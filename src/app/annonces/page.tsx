'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { supabase, getCategories, formatPrice, Category } from '@/lib/supabase'

export default function AnnoncesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('')

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data))
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [selectedCat])

  const fetchProducts = async () => {
    setLoading(true)
    let q = supabase
      .from('products')
      .select('*, profiles(nom, verifie), categories(nom_fr, icone)')
      .eq('disponible', true)
      .order('created_at', { ascending: false })
      .limit(60)
    if (selectedCat) q = q.eq('categorie_id', selectedCat)
    const { data } = await q
    setProducts(data || [])
    setLoading(false)
  }

  const filtered = search.trim()
    ? products.filter(p => p.titre?.toLowerCase().includes(search.toLowerCase()) || p.ville?.toLowerCase().includes(search.toLowerCase()))
    : products

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header fixe */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        {/* Barre de recherche */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2.5">
            <Search size={16} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une annonce..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Filtres catégories */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setSelectedCat('')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
              !selectedCat ? 'bg-[#166534] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tout
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(selectedCat === cat.id ? '' : cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                selectedCat === cat.id ? 'bg-[#166534] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{cat.icone}</span> {cat.nom_fr}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      <div className="px-4 py-2.5 text-xs text-gray-500 font-medium">
        {loading ? 'Chargement...' : `${filtered.length} annonce${filtered.length > 1 ? 's' : ''}`}
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-24">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-gray-100 h-36 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 px-8">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-gray-600">Aucune annonce trouvée</p>
          <p className="text-sm text-gray-400 mt-1">Essayez une autre catégorie ou un autre mot-clé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 pb-24">
          {filtered.map(p => (
            <Link key={p.id} href={`/annonces/${p.id}`} className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 active:scale-[0.98]">
                {/* Image */}
                <div className="relative h-36 bg-gradient-to-br from-green-50 to-yellow-50 overflow-hidden">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {p.categories?.icone || '🌾'}
                    </div>
                  )}
                  {p.sponsorise && (
                    <span className="absolute top-1.5 left-1.5 bg-[#f5c842] text-[#166534] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      ⭐ Pro
                    </span>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-2.5">
                  <p className="text-xs text-gray-400 mb-0.5 truncate">
                    {p.categories?.icone} {p.categories?.nom_fr || ''}
                  </p>
                  <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                    {p.titre}
                  </p>
                  <p className="font-bold text-[#166534] text-sm">
                    {formatPrice(p.prix, p.devise)}
                    <span className="text-xs font-normal text-gray-400"> /{p.unite}</span>
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                    <MapPin size={10} className="flex-shrink-0" />
                    <span className="truncate">{p.ville || p.pays || '—'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
