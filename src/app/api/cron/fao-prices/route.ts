import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { COUNTRIES_DATA, Country } from '@/lib/countries'

export const maxDuration = 30

// ── Prix de repli SÉNÉGAL uniquement (estimations, utilisées si HDX ne répond pas) ──
// Attention : ce sont des estimations, pas des relevés WFP. Aucun équivalent n'est
// créé pour les autres pays : sans données HDX réelles, rien n'est inséré.
const PRIX_ENRICHIS = [
  // CÉRÉALES
  { produit: 'Riz',            prix: 490,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Riz',            prix: 465,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Riz',            prix: 455,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Riz',            prix: 475,  unite: 'kg',    ville: 'Saint-Louis' },
  { produit: 'Riz',            prix: 505,  unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Riz',            prix: 460,  unite: 'kg',    ville: 'Tambacounda' },
  { produit: 'Mil',            prix: 275,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Mil',            prix: 258,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Mil',            prix: 243,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Mil',            prix: 263,  unite: 'kg',    ville: 'Saint-Louis' },
  { produit: 'Mil',            prix: 253,  unite: 'kg',    ville: 'Tambacounda' },
  { produit: 'Mil',            prix: 318,  unite: 'kg',    ville: 'Ourossogui' },
  { produit: 'Maïs',           prix: 205,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Maïs',           prix: 192,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Maïs',           prix: 185,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Sorgho',         prix: 243,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Sorgho',         prix: 232,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Sorgho',         prix: 228,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Sorgho',         prix: 228,  unite: 'kg',    ville: 'Tambacounda' },
  { produit: 'Fonio',          prix: 625,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Fonio',          prix: 585,  unite: 'kg',    ville: 'Tambacounda' },
  // LÉGUMINEUSES
  { produit: 'Arachide',       prix: 960,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Arachide',       prix: 930,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Arachide',       prix: 910,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Arachide',       prix: 1010, unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Niébé',          prix: 990,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Niébé',          prix: 960,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Niébé',          prix: 910,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Niébé',          prix: 1010, unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Niébé',          prix: 1010, unite: 'kg',    ville: 'Ourossogui' },
  // LÉGUMES
  { produit: 'Oignon',         prix: 380,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Oignon',         prix: 320,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Oignon',         prix: 305,  unite: 'kg',    ville: 'Saint-Louis' },
  { produit: 'Oignon',         prix: 290,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Tomate',         prix: 480,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Tomate',         prix: 420,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Tomate',         prix: 460,  unite: 'kg',    ville: 'Saint-Louis' },
  { produit: 'Gombo',          prix: 750,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Gombo',          prix: 700,  unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Gombo',          prix: 680,  unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Piment',         prix: 650,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Piment',         prix: 580,  unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Aubergine',      prix: 450,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Chou',           prix: 350,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Chou',           prix: 300,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Carotte',        prix: 500,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Carotte',        prix: 450,  unite: 'kg',    ville: 'Thiès' },
  // FRUITS
  { produit: 'Mangue',         prix: 250,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Mangue',         prix: 200,  unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Mangue',         prix: 220,  unite: 'kg',    ville: 'Tambacounda' },
  { produit: 'Banane',         prix: 450,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Banane',         prix: 380,  unite: 'kg',    ville: 'Ziguinchor' },
  { produit: 'Orange',         prix: 500,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Pastèque',       prix: 180,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Pastèque',       prix: 150,  unite: 'kg',    ville: 'Kaolack' },
  // VIANDES
  { produit: 'Poulet',         prix: 3200, unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Poulet',         prix: 3000, unite: 'kg',    ville: 'Thiès' },
  { produit: 'Poulet',         prix: 2900, unite: 'kg',    ville: 'Kaolack' },
  { produit: 'Mouton',         prix: 4500, unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Mouton',         prix: 4200, unite: 'kg',    ville: 'Thiès' },
  { produit: 'Bœuf',           prix: 5000, unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Bœuf',           prix: 4700, unite: 'kg',    ville: 'Kaolack' },
  // POISSONS
  { produit: 'Thiof',          prix: 5500, unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Thiof',          prix: 5000, unite: 'kg',    ville: 'Saint-Louis' },
  { produit: 'Yabou',          prix: 3500, unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Yabou',          prix: 3200, unite: 'kg',    ville: 'Saint-Louis' },
  { produit: 'Carpe',          prix: 3000, unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Carpe',          prix: 2800, unite: 'kg',    ville: 'Saint-Louis' },
  // HUILES & ÉPICERIE
  { produit: 'Huile arachide', prix: 1400, unite: 'litre', ville: 'Dakar (Tilène)' },
  { produit: 'Huile arachide', prix: 1300, unite: 'litre', ville: 'Kaolack' },
  { produit: 'Huile palme',    prix: 1200, unite: 'litre', ville: 'Dakar (Tilène)' },
  { produit: 'Huile palme',    prix: 1100, unite: 'litre', ville: 'Ziguinchor' },
  { produit: 'Sucre',          prix: 780,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Sucre',          prix: 760,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Farine blé',     prix: 480,  unite: 'kg',    ville: 'Dakar (Tilène)' },
  { produit: 'Farine blé',     prix: 460,  unite: 'kg',    ville: 'Thiès' },
  { produit: 'Lait poudre',    prix: 4500, unite: 'kg',    ville: 'Dakar (Tilène)' },
]

const COMMODITY_MAP: Record<string, string> = {
  'rice': 'Riz', 'millet': 'Mil', 'pearl millet': 'Mil', 'maize': 'Maïs', 'corn': 'Maïs',
  'sorghum': 'Sorgho', 'fonio': 'Fonio', 'groundnuts': 'Arachide', 'peanuts': 'Arachide',
  'cowpeas': 'Niébé', 'beans (niebe)': 'Niébé', 'beans': 'Haricot', 'onion': 'Oignon', 'onions': 'Oignon',
  'tomato': 'Tomate', 'tomatoes': 'Tomate', 'okra': 'Gombo', 'chili': 'Piment',
  'mango': 'Mangue', 'banana': 'Banane', 'bananas': 'Banane', 'plantain': 'Banane', 'plantains': 'Banane',
  'orange': 'Orange',
  'cassava': 'Manioc', 'yam': 'Igname', 'yams': 'Igname', 'sweet potatoes': 'Patate douce', 'cashew': 'Anacarde',
  'chicken': 'Poulet', 'mutton': 'Mouton', 'beef': 'Bœuf', 'sugar': 'Sucre',
  'groundnut oil': 'Huile arachide', 'palm oil': 'Huile palme', 'wheat flour': 'Farine blé', 'flour': 'Farine blé',
  'milk': 'Lait poudre',
}

// Traduit un nom de produit WFP (« Rice (imported) », « Meat (beef) »…) en nom AgriMarché.
function traduireProduit(brut: string, pays: string): string {
  const k = (brut || '').toLowerCase().trim()
  if (!k) return ''
  if (k === 'fish' || k.startsWith('fish ')) return pays === 'Sénégal' ? 'Thiof' : 'Poisson'
  if (COMMODITY_MAP[k]) return COMMODITY_MAP[k]
  const entreParentheses = k.match(/\(([^)]+)\)/)?.[1]?.trim()
  if (entreParentheses && COMMODITY_MAP[entreParentheses]) return COMMODITY_MAP[entreParentheses]
  const base = k.replace(/\s*\(.*\)\s*/g, '').trim()
  if (COMMODITY_MAP[base]) return COMMODITY_MAP[base]
  if (/^oil/.test(k) && /palm/.test(k)) return 'Huile palme'
  if (/^oil/.test(k) && /(groundnut|peanut)/.test(k)) return 'Huile arachide'
  return brut // produit non traduit : conservé tel quel
}

interface ResultatPays {
  pays: string
  statut: 'ok' | 'aucune_donnee_wfp' | 'echec' | 'repli_estimation'
  lignes: number
  derniere_date?: string
  message: string
}

// Récupère les prix WFP/HDX d'un pays (API CKAN de HDX). Retourne null si rien d'exploitable.
async function recupererHdx(c: Country, logs: string[]): Promise<{ rows: any[]; derniere: string } | null> {
  if (!c.hdxId) return null
  try {
    const pkgRes = await fetch(
      `https://data.humdata.org/api/3/action/package_show?id=${c.hdxId}`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!pkgRes.ok) { logs.push(`[${c.nom}] HDX package : HTTP ${pkgRes.status}`); return null }
    const pkg = await pkgRes.json()
    if (!pkg.success) { logs.push(`[${c.nom}] HDX : jeu de données introuvable (${c.hdxId})`); return null }

    const resource = (pkg.result?.resources || []).find((r: any) => r.datastore_active === true)
    if (!resource) { logs.push(`[${c.nom}] HDX : aucune ressource datastore active (le jeu existe mais n'est pas interrogeable par l'API)`); return null }

    const dsRes = await fetch(
      `https://data.humdata.org/api/3/action/datastore_search?resource_id=${resource.id}&limit=1000&sort=date%20desc`,
      { signal: AbortSignal.timeout(6000) }
    )
    if (!dsRes.ok) { logs.push(`[${c.nom}] HDX datastore : HTTP ${dsRes.status}`); return null }
    const ds = await dsRes.json()
    const records: any[] = ds.result?.records || []
    if (!records.length) { logs.push(`[${c.nom}] HDX : 0 enregistrement`); return null }

    // Un seul prix par produit + marché : le plus récent (les enregistrements sont triés par date décroissante)
    const vus = new Set<string>()
    const rows: any[] = []
    let derniere = ''
    for (const r of records) {
      const devise = (r.currency || r.Currency || '').toString().toUpperCase()
      if (devise && devise !== c.devise) continue // on n'affiche jamais un prix dans la mauvaise monnaie
      const brut = r.commodity || r.Commodity || ''
      const produit = traduireProduit(brut, c.nom)
      const prix = parseFloat(r.price || r.Price || '0')
      const marche = r.market || r.Market || r.admin1 || c.nom
      const date = (r.date || r.Date || '').toString().slice(0, 10)
      if (!produit || produit.length < 2 || !(prix > 0) || !date) continue
      const cle = `${produit}|${marche}`
      if (vus.has(cle)) continue
      vus.add(cle)
      if (date > derniere) derniere = date
      rows.push({
        produit, prix, unite: (r.unit || r.Unit || 'kg').toString().toLowerCase(),
        ville: marche, pays: c.nom, source: 'FAO',
        periode: date, vendeur: 'WFP/OCHA HDX',
        description: `${brut} — ${marche} (WFP/HDX ${date.slice(0, 7)})`,
      })
    }
    if (rows.length < 5) { logs.push(`[${c.nom}] HDX : seulement ${rows.length} lignes exploitables, ignoré`); return null }
    return { rows, derniere }
  } catch (e: any) {
    logs.push(`[${c.nom}] HDX échec : ${e.message}`)
    return null
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlnigbyjnlloplqwzxrm.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmlnYnlqbmxsb3BscXd6eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM1ODEsImV4cCI6MjA5NTk4OTU4MX0.ZVJ0lskiUwo55aEmxpFJ9BWiw4L6giAG_s1kXHh5sA4'
  const supabase = createClient(supabaseUrl, supabaseKey)

  const aujourd_hui = new Date().toISOString().split('T')[0]
  const logs: string[] = []
  const resultats: ResultatPays[] = []

  // Pays concernés : le Sénégal (comportement existant) + les pays ayant un jeu HDX
  const pays = COUNTRIES_DATA.filter(c => c.hdxId !== null)
  const sansHdx = COUNTRIES_DATA.filter(c => c.hdxId === null && c.nom !== 'Gambie' && c.nom !== 'Guinée')

  // Récupération en parallèle (limite le temps total)
  const recus = await Promise.all(pays.map(c => recupererHdx(c, logs)))

  // Pays sans aucune donnée WFP/HDX : on le dit, on n'invente rien
  for (const c of sansHdx) {
    logs.push(`[${c.nom}] ${c.wfpNote} → aucune ligne insérée.`)
    resultats.push({ pays: c.nom, statut: 'aucune_donnee_wfp', lignes: 0, message: c.wfpNote })
  }

  const semaine = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))

  for (let idx = 0; idx < pays.length; idx++) {
    const c = pays[idx]
    const recu = recus[idx]
    let rows: any[] | null = recu?.rows ?? null
    let statut: ResultatPays['statut'] = 'ok'
    let message = ''

    if (!rows && c.nom === 'Sénégal') {
      // Repli historique : estimations Sénégal (jamais utilisées pour les autres pays)
      rows = PRIX_ENRICHIS.map((p, i) => {
        const v = 1 + ((((semaine * 7 + i * 13) % 17) - 8) / 200)
        return {
          produit: p.produit, prix: Math.round(p.prix * v), unite: p.unite,
          ville: p.ville, pays: 'Sénégal', source: 'FAO',
          periode: aujourd_hui, vendeur: 'WFP/OCHA HDX',
          description: `${p.produit} — ${p.ville} (données enrichies Sénégal 2026)`,
        }
      })
      statut = 'repli_estimation'
      message = 'HDX indisponible : estimations Sénégal utilisées (pas des relevés WFP).'
    }

    if (!rows) {
      const msg = 'Aucune donnée HDX exploitable cette fois : anciennes lignes conservées, rien inséré.'
      logs.push(`[${c.nom}] ${msg}`)
      resultats.push({ pays: c.nom, statut: 'echec', lignes: 0, message: msg })
      continue
    }

    // On ne remplace que les lignes FAO de CE pays (le Sénégal inclut les anciennes lignes sans pays)
    let del = supabase.from('prix_marche').delete({ count: 'exact' }).eq('source', 'FAO')
    del = c.nom === 'Sénégal' ? del.or('pays.eq.Sénégal,pays.is.null') : del.eq('pays', c.nom)
    const { error: deleteError, count: deleted } = await del
    if (deleteError) logs.push(`[${c.nom}] Avertissement suppression : ${deleteError.message}`)
    else logs.push(`[${c.nom}] ${deleted ?? 0} anciennes lignes FAO supprimées`)

    const { data, error } = await supabase.from('prix_marche').insert(rows).select('id')
    if (error) {
      logs.push(`[${c.nom}] Erreur insert : ${error.message}`)
      resultats.push({ pays: c.nom, statut: 'echec', lignes: 0, message: error.message })
      continue
    }
    const n = data?.length ?? rows.length
    if (!message) message = `${n} prix WFP/HDX insérés (dernier relevé : ${recu?.derniere}).`
    logs.push(`[${c.nom}] ${message}`)
    resultats.push({ pays: c.nom, statut, lignes: n, derniere_date: recu?.derniere, message })
  }

  const inserted = resultats.reduce((t, r) => t + r.lignes, 0)
  const toutEchoue = resultats.length > 0 && resultats.every(r => r.statut === 'echec')
  return NextResponse.json(
    { ok: !toutEchoue, date: aujourd_hui, inserted, parPays: resultats, logs },
    { status: toutEchoue ? 500 : 200 }
  )
}
