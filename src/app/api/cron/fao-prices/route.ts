import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const HDX_CSV = 'https://data.humdata.org/dataset/77b76bc7-1edd-43f6-a5e4-784498ff6aca/resource/04ffc070-6d05-4653-a9f6-9f3f893a229e/download/'

const MAPPING: Record<string, string> = {
  'maize':          'Maïs',
  'corn':           'Maïs',
  'millet':         'Mil',
  'pearl millet':   'Mil',
  'sorghum':        'Sorgho',
  'rice':           'Riz',
  'wheat':          'Blé',
  'groundnuts':     'Arachide',
  'peanuts':        'Arachide',
  'beans (niebe)':  'Niébé',
  'cowpeas':        'Niébé',
  'niebe':          'Niébé',
  'tomatoes':       'Tomate',
  'tomato':         'Tomate',
  'onions':         'Oignon',
  'onion':          'Oignon',
  'cassava':        'Manioc',
  'fonio':          'Fonio',
}

function mapProduit(name: string): string | null {
  const lower = name.toLowerCase()
  for (const [k, fr] of Object.entries(MAPPING)) {
    if (lower.startsWith(k) || lower.includes(k)) return fr
  }
  return null
}

function parseCsvRows(body: string, header: string[]): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  for (const line of body.split('\n')) {
    if (!line.trim() || !/^\d{4}-\d{2}/.test(line)) continue
    const cols: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    if (cols.length >= header.length) {
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

  const aujourd_hui = new Date().toISOString().split('T')[0]

  // Anti-doublon rapide : données FAO déjà insérées cette semaine ?
  const debutSemaine = new Date(Date.now() - 7 * 86400000).toISOString()
  const { count: existing } = await supabase
    .from('prix_marche')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'FAO')
    .gte('created_at', debutSemaine)

  if ((existing ?? 0) > 0) {
    return NextResponse.json({
      ok: true, inserted: 0,
      message: `Déjà ${existing} entrées FAO cette semaine`,
    })
  }

  try {
    // ── Requête 1 : en-tête CSV (200 premiers octets) ─────────────────
    const headRes = await fetch(HDX_CSV, {
      headers: { 'Range': 'bytes=0-299', 'User-Agent': 'AgriMarche/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    const headerText = await headRes.text()
    const header = headerText.split('\n')[0].split(',').map(h => h.trim().replace(/"/g, ''))

    // ── Requête 2 : 200 derniers Ko du fichier (données récentes) ────
    const bodyRes = await fetch(HDX_CSV, {
      headers: { 'Range': 'bytes=-204800', 'User-Agent': 'AgriMarche/1.0' },
      signal: AbortSignal.timeout(15000),
    })
    const bodyText = await bodyRes.text()

    // Ignorer la 1ère ligne incomplète (on est au milieu du fichier)
    const body = bodyText.split('\n').slice(1).join('\n')
    const allRows = parseCsvRows(body, header)

    // Garder seulement les 4 derniers mois, XOF, Retail
    const seuil = new Date(); seuil.setMonth(seuil.getMonth() - 4)
    const filtered = allRows.filter(r =>
      new Date(r.date) >= seuil &&
      r.currency === 'XOF' &&
      r.pricetype === 'Retail' &&
      parseFloat(r.price) > 0
    )

    if (!filtered.length) {
      return NextResponse.json({ ok: true, inserted: 0, message: 'Aucune donnée récente dans le CSV' })
    }

    // ── Insert batch unique ───────────────────────────────────────────
    const rows = filtered
      .map(r => {
        const produit = mapProduit(r.commodity)
        const prix = Math.round(parseFloat(r.price))
        if (!produit || !prix) return null
        return {
          produit,
          prix,
          unite: r.unit?.toLowerCase() || 'kg',
          ville: r.market || r.admin2 || r.admin1,
          pays: 'Sénégal',
          source: 'FAO',
          periode: r.date || aujourd_hui,
          vendeur: 'WFP/OCHA HDX',
          description: `${r.commodity} — ${r.market}, ${r.admin1}`,
        }
      })
      .filter(Boolean) as object[]

    const { data, error } = await supabase.from('prix_marche').insert(rows).select('id')
    if (error) throw new Error(error.message)

    return NextResponse.json({
      ok: true,
      date: aujourd_hui,
      source: 'WFP/OCHA HDX — vrais prix Sénégal',
      inserted: data?.length ?? rows.length,
      parsed: allRows.length,
      filtered: filtered.length,
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
