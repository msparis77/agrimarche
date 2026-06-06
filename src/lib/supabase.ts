import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rlnigbyjnlloplqwzxrm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmlnYnlqbmxsb3BscXd6eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM1ODEsImV4cCI6MjA5NTk4OTU4MX0.ZVJ0lskiUwo55aEmxpFJ9BWiw4L6giAG_s1kXHh5sA4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  nom: string
  email: string
  telephone?: string
  pays?: string
  role: 'vendeur' | 'acheteur' | 'admin'
  verifie: boolean
  avatar_url?: string
  bio?: string
  whatsapp?: string
  langue: 'fr' | 'en' | 'wo'
  created_at: string
}

export type Category = {
  id: string
  nom_fr: string
  nom_en: string
  nom_wo?: string
  icone: string
  slug: string
}

export type Product = {
  id: string
  user_id?: string
  vendeur_id?: string
  categorie_id?: string
  titre: string
  description?: string
  quantite?: number
  unite?: string
  prix: number
  devise: string
  pays?: string
  ville?: string
  images?: string[]
  disponible?: boolean
  sponsorise?: boolean
  vues?: number
  whatsapp_contact?: string
  statut?: string
  created_at: string
  expires_at?: string
  profiles?: Profile
  categories?: Category
}

export type Message = {
  id: string
  sender_id?: string
  receiver_id?: string
  expediteur_id?: string
  destinataire_id?: string
  product_id?: string
  produit_id?: string
  contenu: string
  lu: boolean
  created_at: string
  sender?: Profile
  receiver?: Profile
  product?: Product
}

export type Review = {
  id: string
  reviewer_id: string
  vendeur_id: string
  product_id?: string
  note: number
  commentaire?: string
  created_at: string
  reviewer?: Profile
}

export type Transaction = {
  id: string
  acheteur_id?: string
  buyer_id?: string
  vendeur_id?: string
  seller_id?: string
  produit_id?: string
  product_id?: string
  montant: number
  devise: string
  statut: string
  created_at: string
}

export type PrixMarche = {
  id: string
  vendeur: string
  type_vendeur?: string
  telephone?: string
  produit: string
  prix: number
  unite: string
  quantite_dispo?: string
  ville: string
  description?: string
  created_at: string
}

export async function getProducts(filters?: {
  categorie?: string
  pays?: string
  ville?: string
  minPrix?: number
  maxPrix?: number
  search?: string
  limit?: number
}) {
  let query = supabase
    .from('products')
    .select(`*, profiles(*), categories(*)`)
    .order('created_at', { ascending: false })
  if (filters?.categorie) query = query.eq('categorie_id', filters.categorie)
  if (filters?.pays) query = query.eq('pays', filters.pays)
  if (filters?.ville) query = query.eq('ville', filters.ville)
  if (filters?.minPrix) query = query.gte('prix', filters.minPrix)
  if (filters?.maxPrix) query = query.lte('prix', filters.maxPrix)
  if (filters?.search) query = query.ilike('titre', `%${filters.search}%`)
  if (filters?.limit) query = query.limit(filters.limit)
  return query
}

export async function getCategories() {
  const res = await supabase.from('categories').select('*')
  if (res.error) return { data: [] as Category[], error: res.error }
  const normalized: Category[] = (res.data || []).map((c: any) => ({
    id: c.id,
    nom_fr: c.nom_fr ?? c.name ?? c.nom ?? '?',
    nom_en: c.nom_en ?? c.name ?? '',
    nom_wo: c.nom_wo,
    icone: c.icone ?? c.icon ?? '📦',
    slug: c.slug ?? c.id ?? '',
  }))
  normalized.sort((a, b) => a.nom_fr.localeCompare(b.nom_fr, 'fr'))
  return { data: normalized, error: null }
}

export async function incrementViews(productId: string) {
  await supabase.rpc('increment_views', { product_id: productId })
}

export function formatPrice(prix: number, devise: string) {
  return new Intl.NumberFormat('fr-FR').format(prix) + ' ' + devise
}

export function getWhatsAppLink(number: string, message: string) {
  const cleaned = number.replace(/\D/g, '')
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`
}
