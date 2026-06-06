'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MapPin, Eye, Star, BadgeCheck, MessageCircle, Heart, ChevronLeft, Phone } from 'lucide-react'
import { supabase, formatPrice, getWhatsAppLink, Product } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { t } = useLang()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [message, setMessage] = useState('')
  const [msgSent, setMsgSent] = useState(false)

  useEffect(() => {
    const id = params?.id as string
    if (!id) return

    supabase
      .from('products')
      .select('*, profiles(*), categories(*)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setProduct(data)
        setLoading(false)
        // Increment views
        supabase.from('products').update({ vues: (data?.vues || 0) + 1 }).eq('id', id)
      })

    if (user) {
      supabase.from('favorites').select('id').eq('user_id', user.id).eq('product_id', id).single()
        .then(({ data }) => setIsFav(!!data))
    }
  }, [params?.id, user])

  const toggleFav = async () => {
    if (!user || !product) return
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id })
    }
    setIsFav(!isFav)
  }

  const sendMessage = async () => {
    if (!user || !product || !message.trim()) return
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: product.user_id,
      product_id: product.id,
      contenu: message,
    })
    setMessage('')
    setMsgSent(true)
    setTimeout(() => setMsgSent(false), 3000)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-200 rounded-2xl h-80 animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return <div className="text-center py-20">Produit introuvable</div>

  const seller = product.profiles
  const whatsappMsg = `Bonjour, je suis intéressé par votre annonce "${product.titre}" sur AgriMarché.`
  const whatsappUrl = product.whatsapp_contact ? getWhatsAppLink(product.whatsapp_contact, whatsappMsg) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-500 hover:text-[#0a4a2f] mb-6 transition text-sm">
        <ChevronLeft size={16} /> Retour
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="bg-green-50 rounded-2xl overflow-hidden h-80 mb-3 flex items-center justify-center">
            {product.images?.[activeImg] ? (
              <img src={product.images[activeImg]} className="w-full h-full object-cover" alt={product.titre} />
            ) : (
              <span className="text-8xl">{product.categories?.icone || '🌾'}</span>
            )}
          </div>
          {(product.images?.length ?? 0) > 1 && (
            <div className="flex gap-2">
             {(product.images ?? []).map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === activeImg ? 'border-[#0a4a2f]' : 'border-transparent'}`}
                >
                  <img src={img} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              {product.categories && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-2 inline-block">
                  {product.categories.icone} {product.categories.nom_fr}
                </span>
              )}
              <h1 className="text-2xl font-bold text-gray-900">{product.titre}</h1>
            </div>
            <button onClick={toggleFav} className={`transition ${isFav ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}`}>
              <Heart size={24} fill={isFav ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-[#0a4a2f]">{formatPrice(product.prix, product.devise)}</span>
            <span className="text-gray-500">/ {product.unite}</span>
          </div>

          {product.quantite && (
            <p className="text-sm text-gray-500 mb-4">
              Quantité disponible : <span className="font-medium">{product.quantite} {product.unite}</span>
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1"><MapPin size={14} className="text-[#0a4a2f]" /> {product.ville || product.pays}</span>
            <span className="flex items-center gap-1"><Eye size={14} /> {product.vues} vues</span>
          </div>

          {product.description && (
            <div className="mb-5">
              <h3 className="font-semibold text-gray-900 mb-1">{t.product.description}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Seller info */}
          {seller && (
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-400 mb-2">{t.product.seller}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold">
                  {seller.nom?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold flex items-center gap-1">
                    {seller.nom}
                    {seller.verifie && <BadgeCheck size={14} className="text-blue-500" />}
                  </p>
                  <p className="text-xs text-gray-500">{seller.pays}</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            {user && user.id !== product.user_id && (
              <a
                href={`/paiement?product=${product.id}`}
                className="flex items-center justify-center gap-2 w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition"
              >
                💳 Commander &amp; Payer en Mobile Money
              </a>
            )}

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-[#25D366] text-white font-bold py-3.5 rounded-xl hover:bg-green-500 transition"
              >
                <MessageCircle size={20} />
                {t.product.contact_whatsapp}
              </a>
            )}

            {user && user.id !== product.user_id && (
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Envoyer un message..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a4a2f]"
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="bg-[#0a4a2f] text-white px-4 rounded-xl hover:bg-green-900 transition"
                >
                  ✉️
                </button>
              </div>
            )}

            {msgSent && <p className="text-green-600 text-sm text-center">Message envoyé !</p>}

            {!user && (
              <p className="text-center text-sm text-gray-500">
                <a href="/login" className="text-[#0a4a2f] font-semibold">Connectez-vous</a> pour envoyer un message
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
