import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MAPPING_PRODUITS: Record<string, string> = {
  'maize':           'Maïs',
  'corn':            'Maïs',
  'millet':          'Mil',
  'pearl millet':    'Mil',
  'sorghum':         'Sorgho',
  'rice':            'Riz',
  'wheat':           'Blé',
  'groundnuts':      'Arachide',
  'peanuts':         'Arachide',
  'beans (niebe)':   'Niébé',
  'cowpeas':         'Niébé',
  'niebe':           'Niébé',
  'tomatoes':        'Tomate',
  'tomato':          'Tomate',
  'onions':          'Oignon',
  'onion':           'Oignon',
  'cassava':         'Manioc',
  'fonio':           'Fonio',
}

const CSV_URL = 'https://data.humdata.org/dataset/77b76bc7-1edd-43f6-a5e4-784498ff6aca/resource/04ffc070-6d05-4653-a9f6-9f3f893a229e/download/'

function mapProduit(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [key, fr] of Object.entries(MAPPING_PRODUITS)) {
    if (lower.startsWith(key) || lower.includes(key)) return fr
  }
  return null
}

function parseRows(text: string, header: string[]): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const cols: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    if (cols.length >= header.length && /^\d{4}-\d{2}/.test(cols[0])) {
      const row: Record<string, string> = {}
      header.forEach((h, i) => { row[h] = cols[i] ?? '' })
      rows.push(row)
    }
  }
  return rows
}

export async function GET(req: NextRequest) {
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

  // Seuil : 4 mois en arrière
  const seuil = new Date()
  seuil.setMonth(seuil.getMonth() - 4)

  try {
    // 1. Récupérer seulement les derniers 300 Ko du fichier CSV (données récentes en fin de fichier)
    logs.push('Téléchargement des 300 derniers Ko du CSV WFP...')
    const res = await fetch(CSV_URL, {
      headers: {
        'Range': 'bytes=-307200',  // 300 Ko
        'User-Agent': 'AgriMarche-Cron/1.0',
      },
      signal: AbortSignal.timeout(20000),
    })

    if (!res.ok && res.status !== 206) {
      throw new Error(`HTTP ${res.status}`)
    }

    const chunk = await res.text()
    logs.push(`${chunk.length} octets reçus`)

    // 2. Récupérer l'en-tête (première ligne du fichier complet) séparément
    const headRes = await fetch(CSV_URL, {
      headers: {
        'Range': 'bytes=0-200',
        'User-Agent': 'AgriMarche-Cron/1.0',
      },
      signal: AbortSignal.timeout(10000),
    })
    const headerText = await headRes.text()
    const headerLine = headerText.split('\n')[0]
    const header = headerLine.split(',').map(h => h.trim().replace(/"/g, ''))
    logs.push(`En-tête : ${header.join(', ')}`)

    // 3. Ignorer la première ligne (incomplète car on a commencé au milieu du fichier)
    const lines = chunk.split('\n')
    const bodyText = lines.slice(1).join('\n')

    const rows = parseRows(bodyText, header)
    logs.push(`${rows.length} lignes parsées`)

    // 4. Filtrer : récent + XOF + Retail
    const recents = rows.filter(r => {
      const date = new Date(r.date)
      return date >= seuil && r.currency === 'XOF' && r.pricetype === 'Retail' && parseFloat(r.price) > 0
    })
    logs.push(`${recents.length} entrées récentes (4 mois, XOF, Retail)`)

    // 5. Insérer (par lot pour éviter les timeouts)
    for (const row of recents) {
      const produitFr = mapProduit(row.commodity)
      if (!produitFr) continue
      const prix = Math.round(parseFloat(row.price))
      if (!prix || prix <= 0) continue

      // Anti-doublon : même produit + marché dans les 25 derniers jours
      const { count } = await supabase
        .from('prix_marche')
        .select('*', { count: 'exact', head: true })
        .eq('produit', produitFr)
        .eq('ville', row.market)
        .eq('source', 'FAO')
        .gte('created_at', new Date(Date.now() - 25 * 86400000).toISOString())

      if ((count ?? 0) > 0) continue

      const { error } = await supabase.from('prix_marche').insert({
        produit:     produitFr,
        prix,
        unite:       row.unit?.toLowerCase() || 'kg',
        ville:       row.market || row.admin2 || row.admin1,
        pays:        'Sénégal',
        source:      'FAO',
        periode:     row.date || aujourd_hui,
        vendeur:     'WFP/OCHA HDX',
        description: `${row.commodity} — ${row.market}, ${row.admin1}`,
      })
      if (!error) totalInserted++
    }

    logs.push(`✅ ${totalInserted} prix insérés`)
  } catch (err: any) {
    logs.push(`❌ Erreur : ${err.message}`)
    return NextResponse.json({ ok: false, error: err.message, logs }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    date: aujourd_hui,
    source: 'WFP/OCHA HDX — données réelles Sénégal',
    inserted: totalInserted,
    logs,
  })
}
