import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mapping noms anglais WFP → noms français AgriMarché
const MAPPING_PRODUITS: Record<string, string> = {
  'maize':            'Maïs',
  'corn':             'Maïs',
  'millet':           'Mil',
  'pearl millet':     'Mil',
  'sorghum':          'Sorgho',
  'rice':             'Riz',
  'rice (imported)':  'Riz',
  'rice (local)':     'Riz',
  'rice (ordinary':   'Riz',
  'wheat':            'Blé',
  'groundnuts':       'Arachide',
  'peanuts':          'Arachide',
  'beans (niebe)':    'Niébé',
  'cowpeas':          'Niébé',
  'niebe':            'Niébé',
  'tomatoes':         'Tomate',
  'tomato':           'Tomate',
  'onions':           'Oignon',
  'onion':            'Oignon',
  'cassava':          'Manioc',
  'sweet potato':     'Patate douce',
  'fonio':            'Fonio',
}

// CSV HDX OCHA — données réelles WFP, mises à jour mensuellement, 100% gratuit
const SOURCES_CSV = [
  {
    url: 'https://data.humdata.org/dataset/77b76bc7-1edd-43f6-a5e4-784498ff6aca/resource/04ffc070-6d05-4653-a9f6-9f3f893a229e/download/',
    pays: 'Sénégal',
  },
]

function mapProduit(commodityName: string): string | null {
  const lower = commodityName.toLowerCase()
  for (const [key, fr] of Object.entries(MAPPING_PRODUITS)) {
    if (lower.startsWith(key) || lower.includes(key)) return fr
  }
  return null
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const rows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    // Gérer les virgules dans les guillemets
    const cols: string[] = []
    let cur = '', inQuote = false
    for (const ch of lines[i]) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else { cur += ch }
    }
    cols.push(cur.trim())
    if (cols.length >= headers.length) {
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => { row[h] = cols[idx] ?? '' })
      rows.push(row)
    }
  }
  return rows
}

export async function GET(req: NextRequest) {
  // Protection optionnelle par CRON_SECRET
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const logs: string[] = []
  let totalInserted = 0
  const aujourd_hui = new Date().toISOString().split('T')[0]

  // Seuil : on n'insère que les données des 3 derniers mois
  const seuil = new Date()
  seuil.setMonth(seuil.getMonth() - 3)

  for (const source of SOURCES_CSV) {
    try {
      logs.push(`Téléchargement CSV ${source.pays}...`)
      const res = await fetch(source.url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'AgriMarche-Cron/1.0' },
      })
      if (!res.ok) {
        logs.push(`Erreur HTTP ${res.status} pour ${source.pays}`)
        continue
      }

      const text = await res.text()
      const rows = parseCsv(text)
      logs.push(`${rows.length} lignes parsées pour ${source.pays}`)

      // Filtrer : données récentes + prix en XOF (FCFA) + type Retail
      const recents = rows.filter(r => {
        const date = new Date(r.date)
        return date >= seuil && r.currency === 'XOF' && r.pricetype === 'Retail' && parseFloat(r.price) > 0
      })
      logs.push(`${recents.length} lignes récentes (3 mois, XOF, Retail)`)

      for (const row of recents) {
        const produitFr = mapProduit(row.commodity)
        if (!produitFr) continue
        const prix = Math.round(parseFloat(row.price))
        if (!prix || prix <= 0) continue

        // Éviter les doublons : même produit + marché + date
        const { count } = await supabase
          .from('prix_marche')
          .select('*', { count: 'exact', head: true })
          .eq('produit', produitFr)
          .eq('ville', row.market)
          .eq('source', 'FAO')
          .gte('created_at', new Date(new Date(row.date).getTime() - 20 * 86400000).toISOString())

        if ((count ?? 0) > 0) continue

        await supabase.from('prix_marche').insert({
          produit: produitFr,
          prix,
          unite: row.unit?.toLowerCase() || 'kg',
          ville: row.market || row.admin2 || row.admin1 || 'Sénégal',
          pays: source.pays,
          source: 'FAO',
          periode: row.date || aujourd_hui,
          vendeur: 'WFP/OCHA HDX',
          description: `${row.commodity} — ${row.market}, ${row.admin1}`,
        })
        totalInserted++
      }

      logs.push(`${totalInserted} insérés pour ${source.pays}`)
    } catch (err: any) {
      logs.push(`Erreur ${source.pays}: ${err.message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    date: aujourd_hui,
    source: 'WFP/OCHA HDX (données réelles)',
    inserted: totalInserted,
    logs,
  })
}
