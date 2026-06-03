'use client'

import Link from 'next/link'
import { MapPin, Eye, Star, BadgeCheck } from 'lucide-react'
import { Product, formatPrice } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useLang()
  const image = product.images?.[0] || '/placeholder-agri.jpg'
  const sellerName = product.profiles?.nom || 'Vendeur'
  const isVerified = product.profiles?.verifie

  return (
    <Link href={`/produits/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
        {/* Image */}
        <div className="relative h-48 bg-gradient-to-br from-green-100 to-yellow-50 overflow-hidden">
          {product.images?.[0] ? (
            <img
              src={image}
              alt={product.titre}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {product.categories?.icone || '🌾'}
            </div>
          )}
          {product.sponsorise && (
            <span className="absolute top-2 left-2 bg-[#f5c842] text-[#0a4a2f] text-xs font-bold px-2 py-0.5 rounded-full">
              ⭐ Sponsorisé
            </span>
          )}
          <span className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Eye size={11} /> {product.vues}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-[#0a4a2f] transition-colors">
              {product.titre}
            </h3>
            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              {product.categories?.icone} {product.categories?.nom_fr || ''}
            </span>
          </div>

          <p className="text-[#0a4a2f] font-bold text-lg">
            {formatPrice(product.prix, product.devise)}
            <span className="text-sm font-normal text-gray-500"> /{product.unite}</span>
          </p>

          {product.quantite && (
            <p className="text-sm text-gray-500 mt-0.5">
              Qté: {product.quantite} {product.unite}
            </p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin size={13} className="text-[#0a4a2f]" />
              {product.ville || product.pays || '—'}
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-700">
              {isVerified && <BadgeCheck size={13} className="text-blue-500" />}
              <span className="text-xs text-gray-500">{sellerName}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
