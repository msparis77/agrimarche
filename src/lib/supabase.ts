import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
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
  user_id: string
  categorie_id?: string
  titre: string
  description?: string
  quantite?: number
  unite: string
  prix: number
  devise: string
  pays?: string
  ville?: string
  images: string[]
  disponible: boolean
  sponsorise: boolean
  vues: number
  whatsapp_contact?: string
  created_at: string
  profiles?: Profile
  categories?: Category
}

export type Message = {
  id: string
  sender_id: string
  receiver_id: string
  product_id?: string
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

// Helper functions
export async function getProducts(filters?: {
  categorie?: string
  pays?: string
  minPrix?: number
  maxPrix?: number
  search?: string
  limit?: number
}) {
  let query = supabase
    .from('products')
    .select(`*, profiles(*), categories(*)`)
    .eq('disponible', true)
    .order('sponsorise', { ascending: false })
    .order('created_at', { ascending: false })

  if (filters?.categorie) query = query.eq('categorie_id', filters.categorie)
  if (filters?.pays) query = query.eq('pays', filters.pays)
  if (filters?.minPrix) query = query.gte('prix', filters.minPrix)
  if (filters?.maxPrix) query = query.lte('prix', filters.maxPrix)
  if (filters?.search) query = query.ilike('titre', `%${filters.search}%`)
  if (filters?.limit) query = query.limit(filters.limit)

  return query
}

export async function getCategories() {
  return supabase.from('categories').select('*').order('nom_fr')
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
