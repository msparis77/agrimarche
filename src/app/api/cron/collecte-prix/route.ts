import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import {
  SOURCES_PRIX, SourcePrix, USER_AGENT, PROMPT_EXTRACTION,
  robotsAutorise, htmlVersTexte, extraireLiensArticles, normaliserProduit, normaliserUnite,
  parserReponseModele, prixPresentDansTexte, dateValide, plausible,
} from '@/lib/collecte'

export const maxDuration = 60

const MODELE = 'claude-haiku-4-5-20251001'
const CONSERVATION_JOURS = 120

async function telecharger(url: string, timeoutMs = 10000): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!r.ok) return null
    return await r.text()
  } catch { return null }
}

async function autoriseParRobots(url: string): Promise<boolean> {
  try {
    const u = new URL(url)
    const txt = await telecharger(`${u.origin}/robots.txt`, 6000)
    if (txt === null) return true // pas de robots.txt : rien n'est interdit
    return robotsAutorise(txt, u.pathname + u.search)
  } catch { return false }
}

export async function GET(req: NextRequest) {
  // Même protection que l'import WFP ; en test manuel : ?secret=...
  const cronSecret = process.env.CRON_SECRET
  const fourni = req.headers.get('authorization')?.replace('Bearer ', '') || req.nextUrl.searchParams.get('secret')
  if (cronSecret && fourni !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1' // test : n'écrit rien en base
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlnigbyjnlloplqwzxrm.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmlnYnlqbmxsb3BscXd6eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM1ODEsImV4cCI6MjA5NTk4OTU4MX0.ZVJ0lskiUwo55aEmxpFJ9BWiw4L6giAG_s1kXHh5sA4'
  const supabase = createClient(supabaseUrl, supabaseKey)

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: 'ANTHROPIC_API_KEY manquante sur Vercel' }, { status: 500 })
  }
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const journal: string[] = []
  const resultats: any[] = []
  let totalInseres = 0

  // Nettoyage : les relevés web de plus de 120 jours sont supprimés
  if (!dry) {
    const limite = new Date(Date.now() - CONSERVATION_JOURS * 86400000).toISOString().slice(0, 10)
    await supabase.from('prix_marche').delete().eq('source', 'Web').lt('periode', limite)
  }

  for (const src of SOURCES_PRIX) {
    const res: any = { source: src.id, pays: src.pays, articles: [] as any[] }
    resultats.push(res)
    try {
      await traiterSource(src, res, { supabase, claude, dry, journal })
      totalInseres += res.articles.reduce((t: number, a: any) => t + (a.inseres || 0), 0)
    } catch (e: any) {
      res.erreur = e.message
      journal.push(`[${src.id}] erreur : ${e.message}`)
    }
  }

  return NextResponse.json({
    ok: true, dry, date: new Date().toISOString(), inseres: totalInseres, resultats, journal,
    note: dry ? 'Mode test : rien n\'a été écrit en base.' : undefined,
  })
}

async function traiterSource(
  src: SourcePrix, res: any,
  ctx: { supabase: any; claude: Anthropic; dry: boolean; journal: string[] },
) {
  const { supabase, claude, dry, journal } = ctx

  // 1. Trouver les derniers articles
  let liens: string[] = []
  for (const index of src.indexUrls) {
    if (!(await autoriseParRobots(index))) { journal.push(`[${src.id}] ${index} interdit par robots.txt : ignoré`); continue }
    const html = await telecharger(index)
    if (!html) { journal.push(`[${src.id}] ${index} : téléchargement impossible`); continue }
    liens = extraireLiensArticles(html, src, index, src.maxArticles)
    if (liens.length) break
    journal.push(`[${src.id}] ${index} : aucun lien d'article de prix trouvé`)
  }
  if (!liens.length) { res.statut = 'aucun_article'; return }

  // 2. Lire chaque article pas encore traité
  for (const lien of liens) {
    const art: any = { url: lien }
    res.articles.push(art)

    if (!(await autoriseParRobots(lien))) { art.statut = 'interdit_robots'; continue }

    const { count } = await supabase.from('prix_marche')
      .select('id', { count: 'exact', head: true }).ilike('description', `%${lien}%`)
    if (count && count > 0) { art.statut = 'deja_traite'; continue }

    const html = await telecharger(lien)
    if (!html) { art.statut = 'telechargement_impossible'; continue }
    const texte = htmlVersTexte(html)

    // 3. Extraction par Claude (jamais de prix hors du texte)
    let extraction
    try {
      const rep = await claude.messages.create({
        model: MODELE, max_tokens: 1500, temperature: 0,
        system: PROMPT_EXTRACTION,
        messages: [{ role: 'user', content: `Texte de l'article :\n"""\n${texte}\n"""` }],
      })
      const sortie = rep.content.find(b => b.type === 'text')
      extraction = parserReponseModele(sortie && sortie.type === 'text' ? sortie.text : '')
    } catch (e: any) { art.statut = 'erreur_modele'; art.detail = e.message; continue }
    if (!extraction) { art.statut = 'reponse_illisible'; continue }

    const date = dateValide(extraction.date_releve, src.maxAgeJours)
    if (!date) { art.statut = 'date_invalide_ou_trop_ancienne'; art.date_lue = extraction.date_releve; continue }

    const ville = extraction.marche && /abidjan/i.test(extraction.marche) ? 'Abidjan' : (extraction.marche || src.villeParDefaut)
    const aInserer: any[] = []
    const rejetes: any[] = []

    for (const p of extraction.prix) {
      const produit = normaliserProduit(p.produit_source)
      const devise = (p.devise || '').toUpperCase()
      const raison =
        !produit ? 'produit vide'
        : !(p.prix > 0) ? 'prix non positif'
        : devise && !['FCFA', 'XOF', 'F', 'CFA', 'F CFA'].includes(devise.replace(/\./g, '')) ? `devise inattendue (${devise})`
        : !prixPresentDansTexte(texte, p.prix) ? 'prix introuvable dans le texte (possible invention)'
        : null
      if (raison) { rejetes.push({ produit: p.produit_source, prix: p.prix, raison }); continue }

      // Plausibilité par rapport à l'historique du même pays et du même produit
      const { data: hist } = await supabase.from('prix_marche').select('prix')
        .eq('pays', src.pays).eq('produit', produit).neq('source', 'Estimation').limit(30)
      const valeurs = (hist || []).map((h: any) => Number(h.prix)).filter((v: number) => v > 0)
      if (!plausible(p.prix, valeurs)) { rejetes.push({ produit: p.produit_source, prix: p.prix, raison: 'écart anormal avec l\'historique' }); continue }

      aInserer.push({
        produit, prix: p.prix, unite: normaliserUnite(p.unite), ville, pays: src.pays,
        source: 'Web', vendeur: src.nom, periode: date,
        description: `${p.produit_source}${p.tendance ? ` (${p.tendance})` : ''} — relevé du ${date} — Source : ${lien}`,
      })
    }

    art.date = date; art.lus = extraction.prix.length; art.rejetes = rejetes
    art.apercu = aInserer.map(r => `${r.produit} ${r.prix}/${r.unite}`)
    if (dry || !aInserer.length) { art.statut = dry ? 'test_non_insere' : 'rien_a_inserer'; art.inseres = 0; continue }

    const { data, error } = await supabase.from('prix_marche').insert(aInserer).select('id')
    if (error) { art.statut = 'erreur_insert'; art.detail = error.message; journal.push(`[${src.id}] insert : ${error.message}`); continue }
    art.statut = 'ok'; art.inseres = data?.length ?? aInserer.length
  }
}
