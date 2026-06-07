'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, ChevronLeft, MessageCircle, Calendar } from 'lucide-react'
import { supabase, formatPrice } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export default function AnnonceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const id = params?.id as string
    if (!id) return
    supabase
      .from('products')
      .select('*, profiles(id, nom, verifie, role, pays, created_at), categories(nom_fr, icone)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data)
        setLoading(false)
        if (data) supabase.from('products').update({ vues: (data.vues || 0) + 1 }).eq('id', id)
      })
  }, [params?.id])

  const handleContact = async () => {
    if (!user) { router.push('/login'); return }
    if (!product) return
    setSending(true)
    // Envoyer un premier message d'introduction
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: product.profiles.id,
      contenu: `Bonjour, je suis intéressé(e) par votre annonce "${product.titre}". Êtes-vous disponible ?`,
    })
    router.push(`/messages?to=${product.profiles.id}`)
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-gray-100 rounded-2xl h-64 animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-5 bg-gray-100 rounded animate-pulse" />
          <div className="h-8 bg-gray-100 rounded w-1/2 animate-pulse" />
          <div className="h-20 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Annonce introuvable</p>
        <button onClick={() => router.back()} className="mt-4 text-[#166534] text-sm font-medium">
          ← Retour
        </button>
      </div>
    )
  }

  const isOwn = user?.id === product.profiles?.id
  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) return 'Aujourd\'hui'
    if (days === 1) return 'Hier'
    if (days < 30) return `Il y a ${days} jours`
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  }

  return (
    <div className="max-w-lg mx-auto pb-32">

      {/* Bouton retour */}
      <div className="px-4 pt-4 pb-2">
        <button onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm transition">
          <ChevronLeft size={18} /> Retour aux annonces
        </button>
      </div>

      {/* Image principale */}
      <div className="relative bg-gradient-to-br from-green-50 to-yellow-50 overflow-hidden"
        style={{ height: '280px' }}>
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.titre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">
            {product.categories?.icone || '🌾'}
          </div>
        )}
        {/* Miniatures */}
        {(product.images?.length ?? 0) > 1 && (
          <div className="absolute bottom-3 left-3 flex gap-2">
            {product.images.slice(0, 4).map((img: string, i: number) => (
              <img key={i} src={img} alt="" className="w-10 h-10 rounded-lg object-cover border-2 border-white shadow-sm" />
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 pt-4 space-y-4">

        {/* Catégorie + date */}
        <div className="flex items-center justify-between">
          <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
            {product.categories?.icone} {product.categories?.nom_fr}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={12} /> {timeAgo(product.created_at)}
          </span>
        </div>

        {/* Titre */}
        <h1 className="text-xl font-bold text-gray-900 leading-snug">{product.titre}</h1>

        {/* Prix */}
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-[#166534]">
            {formatPrice(product.prix, product.devise)}
          </span>
          <span className="text-gray-400 text-sm">/ {product.unite}</span>
        </div>

        {/* Quantité */}
        {product.quantite && (
          <p className="text-sm text-gray-500">
            Quantité disponible : <span className="font-semibold text-gray-700">{product.quantite} {product.unite}</span>
          </p>
        )}

        {/* Localisation */}
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin size={15} className="text-[#166534] flex-shrink-0" />
          <span className="text-sm font-medium">{[product.ville, product.pays].filter(Boolean).join(', ')}</span>
        </div>

        {/* Description */}
        {product.description && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Description</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </div>
        )}

        {/* Vendeur */}
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Vendeur</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#166534] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
              {product.profiles?.nom?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                {product.profiles?.nom}
                {product.profiles?.verifie && <span className="text-blue-500 text-sm">✅</span>}
              </p>
              <p className="text-xs text-gray-400">{product.profiles?.role || 'Membre'} · {product.profiles?.pays}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Bouton fixe en bas */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100 md:static md:border-0 md:bg-transparent md:px-4 md:pt-4 md:pb-8"
        style={{ maxWidth: '512px', margin: '0 auto' }}>
        {isOwn ? (
          <div className="text-center py-3.5 bg-gray-100 rounded-2xl text-sm text-gray-500 font-medium">
            C'est votre annonce
          </div>
        ) : (
          <button
            onClick={handleContact}
            disabled={sending}
            className="flex items-center justify-center gap-3 w-full bg-[#166534] text-white font-bold py-4 rounded-2xl text-base hover:bg-green-800 transition active:scale-[0.98] disabled:opacity-60 shadow-lg"
            style={{ boxShadow: '0 4px 16px rgba(22,101,52,0.35)' }}
          >
            <MessageCircle size={20} />
            {sending ? 'Ouverture du chat...' : 'Je suis intéressé(e)'}
          </button>
        )}
      </div>

    </div>
  )
}
