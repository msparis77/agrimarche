'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { getProducts, getCategories, Product, Category } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import ProductCard from '@/components/marketplace/ProductCard'

const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée']
const DEVISES = ['XOF', 'GMD', 'GNF', 'EUR', 'USD']

function SearchContent() {
  const searchParams = useSearchParams()
  const { t } = useLang()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [categorie, setCategorie] = useState(searchParams.get('categorie') || '')
  const [pays, setPays] = useState('')
  const [minPrix, setMinPrix] = useState('')
  const [maxPrix, setMaxPrix] = useState('')
  const [sort, setSort] = useState('recent')

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    getProducts({
      search: search || undefined,
      categorie: categorie || undefined,
      pays: pays || undefined,
      minPrix: minPrix ? Number(minPrix) : undefined,
      maxPrix: maxPrix ? Number(maxPrix) : undefined,
    }).then(({ data }) => {
      let sorted = data || []
      if (sort === 'price_asc') sorted = [...sorted].sort((a, b) => a.prix - b.prix)
      if (sort === 'price_desc') sorted = [...sorted].sort((a, b) => b.prix - a.prix)
      setProducts(sorted)
      setLoading(false)
    })
  }, [search, categorie, pays, minPrix, maxPrix, sort])

  const resetFilters = () => {
    setSearch('')
    setCategorie('')
    setPays('')
    setMinPrix('')
    setMaxPrix('')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.nav.search}</h1>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-4 gap-2 shadow-sm">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.home.search_placeholder}
              className="flex-1 py-3 outline-none text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')}><X size={16} className="text-gray-400" /></button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 rounded-xl shadow-sm hover:border-[#0a4a2f] transition"
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:block text-sm">{t.filters.filter}</span>
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{t.filters.all_categories}</label>
              <select
                value={categorie}
                onChange={e => setCategorie(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t.filters.all_categories}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icone} {c.nom_fr}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{t.filters.all_countries}</label>
              <select
                value={pays}
                onChange={e => setPays(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">{t.filters.all_countries}</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{t.filters.min_price}</label>
              <input
                type="number"
                value={minPrix}
                onChange={e => setMinPrix(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">{t.filters.max_price}</label>
              <input
                type="number"
                value={maxPrix}
                onChange={e => setMaxPrix(e.target.value)}
                placeholder="999999"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
            <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-red-500 transition">
              {t.filters.reset}
            </button>
          </div>
        </div>
      )}

      {/* Results bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">{products.length}</span> {t.filters.results}
        </p>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
        >
          <option value="recent">{t.filters.recent}</option>
          <option value="price_asc">{t.filters.price_asc}</option>
          <option value="price_desc">{t.filters.price_desc}</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-lg font-medium">Aucun produit trouvé</p>
          <p className="text-sm mt-1">Essayez d'autres termes ou réinitialisez les filtres</p>
          <button onClick={resetFilters} className="mt-4 bg-[#0a4a2f] text-white px-5 py-2 rounded-xl text-sm">
            {t.filters.reset}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Chargement...</div>}>
      <SearchContent />
    </Suspense>
  )
}
