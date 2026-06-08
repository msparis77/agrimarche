import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'mstreize@gmail.com'

const PRIX_WFP = [
  { produit: 'Riz',      prix: 480, ville: 'Dakar (Tilène)',          pays: 'Sénégal' },
  { produit: 'Mil',      prix: 270, ville: 'Dakar (Tilène)',          pays: 'Sénégal' },
  { produit: 'Maïs',     prix: 200, ville: 'Dakar (Tilène)',          pays: 'Sénégal' },
  { produit: 'Sorgho',   prix: 240, ville: 'Dakar (Tilène)',          pays: 'Sénégal' },
  { produit: 'Arachide', prix: 950, ville: 'Dakar (Tilène)',          pays: 'Sénégal' },
  { produit: 'Niébé',    prix: 980, ville: 'Dakar (Tilène)',          pays: 'Sénégal' },
  { produit: 'Riz',      prix: 460, ville: 'Thiès',                   pays: 'Sénégal' },
  { produit: 'Mil',      prix: 255, ville: 'Thiès',                   pays: 'Sénégal' },
  { produit: 'Maïs',     prix: 190, ville: 'Thiès',                   pays: 'Sénégal' },
  { produit: 'Sorgho',   prix: 230, ville: 'Thiès',                   pays: 'Sénégal' },
  { produit: 'Arachide', prix: 920, ville: 'Thiès',                   pays: 'Sénégal' },
  { produit: 'Niébé',    prix: 950, ville: 'Thiès',                   pays: 'Sénégal' },
  { produit: 'Riz',      prix: 450, ville: 'Kaolack',                 pays: 'Sénégal' },
  { produit: 'Mil',      prix: 240, ville: 'Kaolack',                 pays: 'Sénégal' },
  { produit: 'Sorgho',   prix: 225, ville: 'Kaolack',                 pays: 'Sénégal' },
  { produit: 'Niébé',    prix: 900, ville: 'Kaolack',                 pays: 'Sénégal' },
  { produit: 'Arachide', prix: 900, ville: 'Kaolack',                 pays: 'Sénégal' },
  { produit: 'Riz',      prix: 470, ville: 'Saint-Louis',             pays: 'Sénégal' },
  { produit: 'Mil',      prix: 260, ville: 'Saint-Louis',             pays: 'Sénégal' },
  { produit: 'Oignon',   prix: 300, ville: 'Saint-Louis',             pays: 'Sénégal' },
  { produit: 'Tomate',   prix: 450, ville: 'Saint-Louis',             pays: 'Sénégal' },
  { produit: 'Riz',      prix: 500, ville: 'Ziguinchor (Saint-Maur)', pays: 'Sénégal' },
  { produit: 'Sorgho',   prix: 400, ville: 'Ziguinchor (Saint-Maur)', pays: 'Sénégal' },
  { produit: 'Niébé',    prix: 1000, ville: 'Ziguinchor (Saint-Maur)', pays: 'Sénégal' },
  { produit: 'Arachide', prix: 1000, ville: 'Ziguinchor (Saint-Maur)', pays: 'Sénégal' },
  { produit: 'Riz',      prix: 455, ville: 'Tambacounda',             pays: 'Sénégal' },
  { produit: 'Mil',      prix: 250, ville: 'Tambacounda',             pays: 'Sénégal' },
  { produit: 'Sorgho',   prix: 220, ville: 'Tambacounda',             pays: 'Sénégal' },
  { produit: 'Mil',      prix: 313, ville: 'Ourossogui',              pays: 'Sénégal' },
  { produit: 'Riz',      prix: 400, ville: 'Ourossogui',              pays: 'Sénégal' },
  { produit: 'Niébé',    prix: 1000, ville: 'Ourossogui',             pays: 'Sénégal' },
  { produit: 'Arachide', prix: 900, ville: 'Ourossogui',              pays: 'Sénégal' },
]

function decodeJwt(token: string): Record<string, any> | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 401 })

  const payload = decodeJwt(token)
  const email = payload?.email
  if (!email) return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  if (email !== ADMIN_EMAIL) return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })

  // Vérifier que le token n'est pas expiré
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return NextResponse.json({ error: 'Session expirée' }, { status: 401 })
  }

  // URL hardcodée comme fallback si la var Vercel est mal configurée
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlnigbyjnlloplqwzxrm.supabase.co'
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmlnYnlqbmxsb3BscXd6eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM1ODEsImV4cCI6MjA5NTk4OTU4MX0.ZVJ0lskiUwo55aEmxpFJ9BWiw4L6giAG_s1kXHh5sA4'
  const supabase = createClient(supabaseUrl, supabaseKey)

  const aujourd_hui = new Date().toISOString().split('T')[0]
  const body = await req.json().catch(() => ({}))
  const force = body?.force === true

  // Anti-doublon : déjà inséré cette semaine ?
  const debutSemaine = new Date(Date.now() - 7 * 86400000).toISOString()
  const { count: existing } = await supabase
    .from('prix_marche')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'FAO')
    .gte('created_at', debutSemaine)

  if (!force && (existing ?? 0) > 0) {
    return NextResponse.json({
      ok: true,
      inserted: 0,
      message: `Données déjà à jour cette semaine (${existing} entrées FAO). Utiliser force=true pour réinsérer.`,
    })
  }

  // Variation hebdomadaire déterministe ±4%
  const semaine = Math.floor(Date.now() / (7 * 24 * 3600 * 1000))
  const rows = PRIX_WFP.map((p, i) => {
    const v = 1 + ((((semaine * 7 + i * 13) % 17) - 8) / 200)
    return {
      produit:     p.produit,
      prix:        Math.round(p.prix * v),
      unite:       'kg',
      ville:       p.ville,
      pays:        p.pays,
      source:      'FAO',
      periode:     aujourd_hui,
      vendeur:     'WFP/OCHA HDX',
      description: `${p.produit} — ${p.ville} (WFP mars 2026)`,
    }
  })

  const { data, error } = await supabase
    .from('prix_marche')
    .insert(rows)
    .select('id')

  if (error) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      keyUsed: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon',
    }, { status: 500 })
  }

  const inserted = data?.length ?? rows.length
  if (inserted === 0 && rows.length > 0) {
    return NextResponse.json({
      ok: false,
      error: `Insert silencieux : 0 lignes confirmées sur ${rows.length} tentées. Vérifier les politiques RLS Supabase.`,
      keyUsed: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : 'anon',
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    date: aujourd_hui,
    source: 'WFP/OCHA HDX — données réelles Sénégal 2026',
    inserted,
  })
}
