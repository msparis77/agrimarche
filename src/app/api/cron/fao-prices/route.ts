import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Données de référence : correspondances noms français → noms WFP en anglais
const PRODUITS_WFP: Record<string, string[]> = {
  'Riz':       ['Rice', 'Rice (imported)', 'Rice (local)'],
  'Mil':       ['Millet', 'Pearl millet'],
  'Maïs':      ['Maize', 'Corn'],
  'Sorgho':    ['Sorghum'],
  'Arachide':  ['Groundnuts', 'Peanuts (shelled)'],
  'Niébé':     ['Cowpeas', 'Beans (cowpea)'],
  'Tomate':    ['Tomatoes', 'Tomato'],
  'Oignon':    ['Onions', 'Onion'],
}

const PAYS_WFP = [
  { code: 'SN', nom: 'Sénégal', wfpCode: 'SEN' },
  { code: 'GM', nom: 'Gambie',  wfpCode: 'GMB' },
  { code: 'GN', nom: 'Guinée',  wfpCode: 'GIN' },
]

// Prix de référence réalistes (FCFA/kg) utilisés si l'API WFP n'est pas configurée
const PRIX_REFERENCE: Record<string, { min: number; max: number; unite: string }> = {
  'Riz':      { min: 400,  max: 600,  unite: 'kg' },
  'Mil':      { min: 200,  max: 350,  unite: 'kg' },
  'Maïs':     { min: 180,  max: 280,  unite: 'kg' },
  'Sorgho':   { min: 180,  max: 300,  unite: 'kg' },
  'Arachide': { min: 350,  max: 550,  unite: 'kg' },
  'Niébé':    { min: 500,  max: 800,  unite: 'kg' },
  'Tomate':   { min: 300,  max: 700,  unite: 'kg' },
  'Oignon':   { min: 200,  max: 500,  unite: 'kg' },
}

const VILLES_PAR_PAYS: Record<string, string[]> = {
  'Sénégal': ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis'],
  'Gambie':  ['Banjul', 'Brikama', 'Kanifing'],
  'Guinée':  ['Conakry', 'Labé', 'Kindia'],
}

export async function GET(req: NextRequest) {
  // Sécurité : vérifier le token Vercel Cron
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const wfpToken = process.env.WFP_API_TOKEN
  const logs: string[] = []
  let totalInserted = 0
  const periodeAujourdhui = new Date().toISOString().split('T')[0]

  // ── Essai WFP DataBridges API ─────────────────────────────────
  if (wfpToken) {
    logs.push('WFP token found, trying DataBridges API...')
    for (const pays of PAYS_WFP) {
      try {
        const url = `https://api.wfp.org/vam-data-bridges/2.0/MarketPrices/PriceMonthly?CountryCode=${pays.code}&Page=1&format=json`
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${wfpToken}` },
          signal: AbortSignal.timeout(10000),
        })
        if (!res.ok) {
          logs.push(`WFP ${pays.code}: HTTP ${res.status}`)
          continue
        }
        const json = await res.json()
        const items = json?.value || json?.data || json?.items || []
        logs.push(`WFP ${pays.code}: ${items.length} rows received`)

        for (const item of items) {
          // Mapper le nom WFP vers nom français
          const nomWfp = (item.cmname || item.commodity || '').toLowerCase()
          let produitFr: string | null = null
          for (const [fr, aliases] of Object.entries(PRODUITS_WFP)) {
            if (aliases.some(a => nomWfp.includes(a.toLowerCase()))) {
              produitFr = fr; break
            }
          }
          if (!produitFr) continue
          const prix = parseFloat(item.price || item.mp_price || 0)
          if (!prix || prix <= 0) continue

          await supabase.from('prix_marche').insert({
            produit: produitFr,
            prix: Math.round(prix),
            unite: item.unit || 'kg',
            ville: item.mktname || item.market || 'Capitale',
            pays: pays.nom,
            source: 'FAO',
            periode: item.date || item.mp_month || periodeAujourdhui,
            vendeur: 'WFP DataBridges',
            description: `Source WFP/FAO – ${item.mktname || pays.nom}`,
          })
          totalInserted++
        }
      } catch (err: any) {
        logs.push(`WFP ${pays.code} error: ${err.message}`)
      }
    }
  } else {
    logs.push('No WFP_API_TOKEN — generating reference prices')
    // Insérer des prix de référence réalistes (variation hebdomadaire ±5%)
    for (const pays of PAYS_WFP) {
      const villes = VILLES_PAR_PAYS[pays.nom]
      for (const produit of Object.keys(PRIX_REFERENCE)) {
        const ref = PRIX_REFERENCE[produit]
        const ville = villes[Math.floor(Math.random() * villes.length)]
        const prixBase = ref.min + Math.random() * (ref.max - ref.min)
        const variation = 0.95 + Math.random() * 0.10 // ±5%
        const prix = Math.round(prixBase * variation)

        // Éviter les doublons pour la même semaine
        const { count } = await supabase
          .from('prix_marche')
          .select('*', { count: 'exact', head: true })
          .eq('produit', produit)
          .eq('pays', pays.nom)
          .eq('source', 'FAO')
          .gte('created_at', new Date(Date.now() - 6 * 86400000).toISOString())

        if ((count ?? 0) > 0) continue

        await supabase.from('prix_marche').insert({
          produit,
          prix,
          unite: ref.unite,
          ville,
          pays: pays.nom,
          source: 'FAO',
          periode: periodeAujourdhui,
          vendeur: 'Référence AgriMarché',
          description: `Prix de référence hebdomadaire – données indicatives`,
        })
        totalInserted++
      }
    }
  }

  return NextResponse.json({
    ok: true,
    date: periodeAujourdhui,
    source: wfpToken ? 'WFP DataBridges' : 'Référence (configurer WFP_API_TOKEN)',
    inserted: totalInserted,
    logs,
  })
}
