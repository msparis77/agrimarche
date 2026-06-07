'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, ChevronRight, Package } from 'lucide-react'
import { getProducts, Product } from '@/lib/supabase'
import ProductCard from '@/components/marketplace/ProductCard'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [prix, setPrix] = useState<any[]>([])
  const [meteo, setMeteo] = useState<any>(null)
  const [ville, setVille] = useState('Dakar')

  useEffect(() => {
    getProducts({ limit: 8 }).then(({ data }) => { setProducts(data || []); setLoading(false) })
    supabase.from('prix_marche').select('*').order('created_at', { ascending: false }).limit(30)
      .then(({ data }) => { if (data) setPrix(data) })
    loadMeteo()
  }, [])

  const loadMeteo = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async pos => {
          const { latitude, longitude } = pos.coords
          const [meteoRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`),
          ])
          setMeteo(await meteoRes.json())
          const geo = await geoRes.json()
          setVille(geo.address?.city || geo.address?.town || 'Ta région')
        }, () => loadMeteoDefaut())
      } else loadMeteoDefaut()
    } catch { loadMeteoDefaut() }
  }

  const loadMeteoDefaut = async () => {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.6928&longitude=-17.4467&current=temperature_2m,weathercode&timezone=Africa%2FDakar')
      setMeteo(await res.json())
    } catch {}
  }

  const meteoEmoji = (code: number) => {
    if (code === 0) return '☀️'
    if (code <= 2) return '⛅'
    if (code <= 49) return '🌫️'
    if (code <= 67) return '🌧️'
    return '⛈️'
  }

  const getEmojiproduit = (produit: string) => {
    const map: any = { 'Riz': '🌾', 'Mil': '🌾', 'Maïs': '🌽', 'Arachide': '🥜', 'Oignon': '🧅', 'Tomate': '🍅', 'Manioc': '🥔', 'Banane': '🍌', 'Poisson': '🐟' }
    return map[produit] || '📦'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) router.push(`/recherche?q=${encodeURIComponent(search)}`)
    else router.push('/recherche')
  }

  const tickerItems = prix.length > 0
    ? prix.map(p => `${getEmojiproduit(p.produit)} ${p.produit} ${p.prix.toLocaleString()} FCFA/${p.unite} · ${p.ville}`)
    : ['🌾 Riz · 450 FCFA/kg', '🌽 Maïs · 280 FCFA/kg', '🥜 Arachide · 320 FCFA/kg', '🧅 Oignon · 200 FCFA/kg', '🍅 Tomate · 350 FCFA/kg']

  return (
    <div className="min-h-screen bg-[#f8faf8]">

      {/* TICKER */}
      <div className="bg-[#166534] overflow-hidden">
        <div className="flex items-center">
          <Link href="/marche" className="shrink-0 bg-[#f5c842] text-[#166534] px-4 py-2 text-xs font-extrabold uppercase tracking-wider whitespace-nowrap hover:bg-yellow-300 transition">
            📊 COURS
          </Link>
          <div className="overflow-hidden flex-1 py-2">
            <div className="inline-block text-xs text-green-200 font-medium whitespace-nowrap px-4"
              style={{ animation: 'marquee 40s linear infinite' }}>
              {tickerItems.join('   ·   ')}&nbsp;&nbsp;&nbsp;&nbsp;{tickerItems.join('   ·   ')}
            </div>
          </div>
        </div>
        <style>{`@keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      </div>

      {/* HERO */}
      <section className="relative bg-[#166534] overflow-hidden pb-20 pt-10 px-5"
        style={{ background: 'linear-gradient(160deg, #166534 0%, #14532d 60%, #052e16 100%)' }}>

        {/* Déco cercles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #f5c842, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4ade80, transparent)', transform: 'translate(-30%, 30%)' }} />

        <div className="max-w-lg mx-auto relative z-10">
          {/* Météo pill */}
          {meteo && (
            <div className="inline-flex items-center gap-2 bg-white/10 text-white rounded-full px-3 py-1.5 text-sm mb-6 backdrop-blur-sm">
              <span>{meteoEmoji(meteo.current?.weathercode)}</span>
              <span className="font-medium">{Math.round(meteo.current?.temperature_2m)}°C</span>
              <span className="text-green-300">·</span>
              <span className="text-green-200">📍 {ville}</span>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-3 tracking-tight">
            Le marché agricole<br />
            <span className="text-[#f5c842]">de l'Afrique de l'Ouest</span>
          </h1>
          <p className="text-green-300 text-sm mb-8 font-medium">
            Sénégal 🇸🇳 · Gambie 🇬🇲 · Guinée 🇬🇳
          </p>

          {/* Barre de recherche */}
          <form onSubmit={handleSearch}
            className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-xl mb-8">
            <Search size={18} className="text-gray-400 ml-2 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Riz, mil, arachide, mangue..."
              className="flex-1 text-gray-800 text-sm outline-none py-1 placeholder-gray-400 bg-transparent"
            />
            <button type="submit"
              className="bg-[#166534] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-green-800 transition active:scale-95 flex-shrink-0">
              Chercher
            </button>
          </form>

          {/* 2 CTA */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/recherche"
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold py-3.5 rounded-2xl text-sm transition active:scale-95 border border-white/20 backdrop-blur-sm">
              🛒 Acheter
            </Link>
            <Link href={user ? '/vendre' : '/login'}
              className="flex items-center justify-center gap-2 bg-[#f5c842] hover:bg-yellow-400 text-[#166534] font-bold py-3.5 rounded-2xl text-sm transition active:scale-95 shadow-lg">
              ➕ Vendre
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div className="px-5 -mt-6 relative z-10 max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-3 divide-x divide-gray-100"
          style={{ boxShadow: '0 8px 32px rgba(22,101,52,0.12)' }}>
          {[
            { emoji: '🌾', value: '1 200+', label: 'Vendeurs' },
            { emoji: '📦', value: '5 800+', label: 'Produits' },
            { emoji: '🌍', value: '3', label: 'Pays' },
          ].map((s, i) => (
            <div key={i} className="text-center px-2">
              <div className="text-lg mb-0.5">{s.emoji}</div>
              <div className="text-lg font-extrabold text-[#166534]">{s.value}</div>
              <div className="text-xs text-gray-400 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* QUI ÊTES-VOUS */}
      <section className="px-5 pt-10 pb-4 max-w-lg mx-auto">
        <h2 className="text-xl font-extrabold text-gray-900 mb-1">Qui êtes-vous ?</h2>
        <p className="text-gray-400 text-sm mb-5">Inscrivez-vous gratuitement en 2 minutes</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: '🌾', title: 'Producteur', desc: 'Vends tes récoltes', href: '/register?profil=producteur', color: 'from-green-50 to-emerald-50 border-green-100' },
            { emoji: '🛒', title: 'Acheteur', desc: 'Trouve les prix', href: '/register?profil=acheteur', color: 'from-blue-50 to-sky-50 border-blue-100' },
            { emoji: '🏭', title: 'Transformateur', desc: 'Approvisionne', href: '/register?profil=transformateur', color: 'from-orange-50 to-amber-50 border-orange-100' },
            { emoji: '🚛', title: 'Transporteur', desc: 'Propose tes services', href: '/register?profil=transporteur', color: 'from-purple-50 to-violet-50 border-purple-100' },
          ].map(p => (
            <Link key={p.href} href={p.href}
              className={`bg-gradient-to-br ${p.color} border rounded-2xl p-4 flex flex-col items-center text-center active:scale-95 transition-all hover:shadow-md`}>
              <span className="text-3xl mb-2">{p.emoji}</span>
              <span className="font-bold text-sm text-gray-900">{p.title}</span>
              <span className="text-xs text-gray-500 mt-0.5">{p.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ANNONCES RÉCENTES */}
      <section className="px-5 py-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold text-gray-900">Annonces récentes</h2>
          <Link href="/recherche" className="flex items-center gap-1 text-[#166534] text-sm font-semibold hover:underline">
            Tout voir <ChevronRight size={16} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-44 animate-pulse" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-gray-500">Les premières annonces arrivent bientôt</p>
            <Link href="/vendre"
              className="mt-4 inline-flex items-center gap-2 bg-[#166534] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition">
              ➕ Publier une annonce
            </Link>
          </div>
        )}
      </section>

      {/* PRIX DU MARCHÉ */}
      {prix.length > 0 && (
        <section className="px-5 pb-8 max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#f5c842]" /> Cours du jour
            </h2>
            <Link href="/marche" className="flex items-center gap-1 text-[#166534] text-sm font-semibold hover:underline">
              Voir tout <ChevronRight size={16} />
            </Link>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {prix.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i < 4 ? 'border-b border-gray-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">{getEmojiproduit(p.produit)}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{p.produit}</p>
                    <p className="text-xs text-gray-400">📍 {p.ville}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#166534]">{p.prix.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                  <p className="text-xs text-gray-400">/{p.unite}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="px-5 pb-8 max-w-lg mx-auto">
        <div className="bg-[#166534] rounded-3xl p-6 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #166534, #052e16)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #f5c842 0%, transparent 50%)' }} />
          <p className="text-2xl mb-2">🌾</p>
          <h3 className="text-white font-extrabold text-lg mb-2">Prêt à vendre vos produits ?</h3>
          <p className="text-green-300 text-sm mb-5">Publiez une annonce gratuite en 2 minutes</p>
          <Link href={user ? '/vendre' : '/register'}
            className="inline-flex items-center gap-2 bg-[#f5c842] text-[#166534] font-extrabold px-8 py-3.5 rounded-2xl text-sm hover:bg-yellow-400 transition active:scale-95 shadow-lg">
            Démarrer maintenant →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 px-5 bg-white">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 font-extrabold text-[#166534] mb-4">
            <span className="text-xl">🌾</span> AgriMarché
            <span className="text-xs font-normal text-gray-400 ml-1">Afrique de l'Ouest</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-400 mb-4">
            <Link href="/recherche" className="hover:text-gray-700">Produits</Link>
            <Link href="/marche" className="hover:text-gray-700">Prix du marché</Link>
            <Link href="/forum" className="hover:text-gray-700">Forum</Link>
            <Link href="/register" className="hover:text-gray-700">S'inscrire</Link>
          </div>
          <p className="text-xs text-gray-300">© 2025 AgriMarché · Sénégal · Gambie · Guinée</p>
        </div>
      </footer>

    </div>
  )
}
