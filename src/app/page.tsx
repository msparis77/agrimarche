'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, Shield, Smartphone, Users, Package, Globe } from 'lucide-react'
import { supabase, getProducts, getCategories, Product, Category } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'
import ProductCard from '@/components/marketplace/ProductCard'

export default function HomePage() {
  const { t } = useLang()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getProducts({ limit: 8 }),
      getCategories()
    ]).then(([{ data: prods }, { data: cats }]) => {
      setProducts(prods || [])
      setCategories(cats || [])
      setLoading(false)
    })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/recherche?q=${encodeURIComponent(search)}`
  }

  const stats = [
    { icon: <Users size={28} />, value: '1,200+', label: t.home.stats_sellers },
    { icon: <Package size={28} />, value: '5,800+', label: t.home.stats_products },
    { icon: <Globe size={28} />, value: '3', label: t.home.stats_countries },
  ]

  const steps = [
    { icon: '📝', title: t.home.step1_title, desc: t.home.step1_desc },
    { icon: '💬', title: t.home.step2_title, desc: t.home.step2_desc },
    { icon: '🤝', title: t.home.step3_title, desc: t.home.step3_desc },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a4a2f 0%, #1a7a4f 50%, #0a4a2f 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#f5c842]/10 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm mb-6 text-[#f5c842]">
            🌍 Sénégal · Gambie · Guinée
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {t.home.hero_title}
          </h1>
          <p className="text-lg md:text-xl text-green-200 mb-10 max-w-2xl mx-auto">
            {t.home.hero_subtitle}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2 mb-8">
            <div className="flex-1 flex items-center bg-white rounded-xl px-4 gap-2">
              <Search size={20} className="text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.home.search_placeholder}
                className="flex-1 py-3.5 text-gray-900 outline-none placeholder-gray-400"
              />
            </div>
            <button type="submit" className="bg-[#f5c842] text-[#0a4a2f] font-bold px-6 py-3.5 rounded-xl hover:bg-yellow-400 transition">
              {t.filters.filter}
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/recherche" className="bg-white text-[#0a4a2f] font-semibold px-6 py-3 rounded-xl hover:bg-green-50 transition">
              {t.home.hero_cta}
            </Link>
            <Link href="/vendre" className="border-2 border-white text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/10 transition">
              {t.home.hero_sell}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0a4a2f] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 text-white text-center">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="text-[#f5c842]">{s.icon}</div>
                <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                <div className="text-green-300 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.home.categories}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/recherche?categorie=${cat.id}`}
              className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl hover:shadow-md hover:border-[#0a4a2f] border border-transparent transition-all cursor-pointer"
            >
              <span className="text-3xl">{cat.icone}</span>
              <span className="text-sm font-medium text-gray-700 text-center">{cat.nom_fr}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest products */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{t.home.latest_products}</h2>
          <Link href="/recherche" className="text-[#0a4a2f] font-medium hover:underline flex items-center gap-1">
            {t.home.view_all} →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {products.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-500">
            <span className="text-5xl block mb-4">🌱</span>
            <p>Aucun produit disponible pour l'instant</p>
            <Link href="/vendre" className="mt-4 inline-block bg-[#0a4a2f] text-white px-6 py-2 rounded-xl">
              Publier le premier produit
            </Link>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="bg-gradient-to-br from-green-50 to-yellow-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">{t.home.how_it_works}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl shadow-md mx-auto mb-4">
                  {step.icon}
                </div>
                <div className="w-8 h-8 bg-[#0a4a2f] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto -mt-2 mb-4 border-4 border-green-50">
                  {i + 1}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-[#f5c842] py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0a4a2f] mb-4">
            Vous êtes producteur ou grossiste ?
          </h2>
          <p className="text-[#0a4a2f]/80 mb-6">
            Publiez vos produits gratuitement et touchez des milliers d'acheteurs
          </p>
          <Link href="/register" className="bg-[#0a4a2f] text-white font-bold px-8 py-3.5 rounded-xl hover:bg-green-900 transition inline-block">
            Créer mon compte vendeur
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a4a2f] text-green-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="text-2xl mb-2">🌾</div>
          <p className="font-bold text-white text-lg mb-1">AgriMarché</p>
          <p className="text-sm">© 2024 — Sénégal · Gambie · Guinée</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/recherche" className="hover:text-white">Produits</Link>
            <Link href="/vendre" className="hover:text-white">Vendre</Link>
            <Link href="/register" className="hover:text-white">S'inscrire</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
