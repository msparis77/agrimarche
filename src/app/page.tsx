'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Package, Globe } from 'lucide-react'
import { getProducts, Product } from '@/lib/supabase'
import ProductCard from '@/components/marketplace/ProductCard'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [meteo, setMeteo] = useState<any>(null)
  const [ville, setVille] = useState('...')
  const [meteoLoading, setMeteoLoading] = useState(true)
  const [prix, setPrix] = useState<any[]>([])

  useEffect(() => {
    getProducts({ limit: 8 }).then(({ data }) => {
      setProducts(data || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from('prix_marche')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) setPrix(data)
    }
    charger()
    const interval = setInterval(charger, 300000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords
          try {
            const [meteoRes, geoRes] = await Promise.all([
              fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,relative_humidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=auto&forecast_days=3`),
              fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`),
            ])
            setMeteo(await meteoRes.json())
            const geo = await geoRes.json()
            setVille(geo.address?.city || geo.address?.town || geo.address?.village || 'Ta région')
          } catch { loadMeteoDefaut() }
          setMeteoLoading(false)
        },
        () => loadMeteoDefaut()
      )
    } else { loadMeteoDefaut() }
  }, [])

  const loadMeteoDefaut = async () => {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=14.6928&longitude=-17.4467&current=temperature_2m,weathercode,relative_humidity_2m,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum&timezone=Africa%2FDakar&forecast_days=3')
      setMeteo(await res.json())
      setVille('Dakar')
    } catch {}
    setMeteoLoading(false)
  }

  const getMeteoEmoji = (code: number) => {
    if (code === 0) return '☀️'
    if (code <= 2) return '⛅'
    if (code <= 49) return '🌫️'
    if (code <= 67) return '🌧️'
    if (code <= 99) return '⛈️'
    return '🌤️'
  }

  const getMeteoTexte = (code: number) => {
    if (code === 0) return 'Ciel dégagé'
    if (code <= 2) return 'Partiellement nuageux'
    if (code <= 49) return 'Brumeux'
    if (code <= 67) return 'Pluie'
    if (code <= 99) return 'Orage'
    return 'Variable'
  }

  const getEmojiproduit = (produit: string) => {
    const map: any = {
      'Riz': '🌾', 'Mil': '🌾', 'Maïs': '🌽', 'Sorgho': '🌾',
      'Arachide': '🥜', 'Oignon': '🧅', 'Tomate': '🍅',
      'Manioc': '🥔', 'Banane': '🍌', 'Mangue': '🥭',
      'Poisson': '🐟', 'Volaille': '🐔', 'Bétail': '🐄',
      'Coton': '☁️', 'Anacarde': '🥜', 'Huile de palme': '🫙',
    }
    return map[produit] || '📦'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/recherche?q=${encodeURIComponent(search)}`
  }

  const tickerItems = prix.length > 0
    ? prix.map(p => `${getEmojiproduit(p.produit)} ${p.produit} · ${p.ville} · ${p.prix} FCFA/${p.unite}`)
    : ['🌾 Riz · Dakar · 450 FCFA/kg', '🌽 Maïs · Kaolack · 280 FCFA/kg', '🥜 Arachide · Ziguinchor · 320 FCFA/kg', '🧅 Oignon · Thiès · 200 FCFA/kg', '🍅 Tomate · Saint-Louis · 350 FCFA/kg']

  const tickerText = tickerItems.join('     ·     ')

  const profiles = [
    { emoji: '🌾', title: 'Producteur', description: 'Vends tes récoltes directement', href: '/register?profil=producteur' },
    { emoji: '🛒', title: 'Acheteur', description: 'Trouve les meilleurs prix', href: '/register?profil=acheteur' },
    { emoji: '🏭', title: 'Transformateur', description: 'Approvisionne ton unité', href: '/register?profil=transformateur' },
    { emoji: '🚛', title: 'Transporteur', description: 'Propose tes services', href: '/register?profil=transporteur' },
  ]

  const stats = [
    { icon: <Users size={20} />, value: '1 200+', label: 'Vendeurs actifs' },
    { icon: <Package size={20} />, value: '5 800+', label: 'Produits' },
    { icon: <Globe size={20} />, value: '3', label: 'Pays' },
  ]

  const joursSemaine = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <div className="min-h-screen bg-white">

      {/* TICKER PRIX */}
      <div className="bg-[#0a4a2f] overflow-hidden">
        <div className="flex items-center">
          <Link
            href="/marche"
            className="shrink-0 bg-[#f5c842] text-[#0a4a2f] px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-yellow-300 transition whitespace-nowrap"
          >
            Prix du jour →
          </Link>
          <div className="overflow-hidden flex-1 py-2">
            <div
              className="inline-block text-sm text-green-200 font-medium whitespace-nowrap px-4"
              style={{ animation: 'marquee 50s linear infinite' }}
            >
              {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
            </div>
          </div>
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>

      {/* HERO */}
      <section className="bg-[#0a4a2f] text-white px-4 pt-12 pb-16">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Le marché agricole<br />de l'Afrique de l'Ouest
          </h1>
          <p className="text-green-300 text-sm mb-8">
            Sénégal 🇸🇳 · Gambie 🇬🇲 · Guinée 🇬🇳
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Chercher riz, mil, arachide..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-900 text-sm outline-none"
            />
            <button
              type="submit"
              className="bg-[#f5c842] text-[#0a4a2f] font-bold px-5 py-3 rounded-xl hover:bg-yellow-300 transition"
            >
              🔍
            </button>
          </form>
        </div>
      </section>

      {/* MÉTÉO */}
      <div className="px-4 max-w-xl mx-auto -mt-5">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          {meteoLoading ? (
            <div className="flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/4" />
              </div>
            </div>
          ) : meteo ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getMeteoEmoji(meteo.current?.weathercode)}</span>
                <div>
                  <div className="font-bold text-xl text-gray-800">{Math.round(meteo.current?.temperature_2m)}°C</div>
                  <div className="text-xs text-gray-400">{getMeteoTexte(meteo.current?.weathercode)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-[#0a4a2f]">📍 {ville}</div>
                <div className="text-xs text-gray-400">💧 {meteo.current?.relative_humidity_2m}% · 💨 {Math.round(meteo.current?.windspeed_10m)} km/h</div>
              </div>
              <div className="hidden sm:flex gap-4 ml-4 pl-4 border-l border-gray-100">
                {meteo.daily?.time?.slice(0, 3).map((date: string, i: number) => (
                  <div key={i} className="text-center">
                    <div className="text-xs text-gray-400">{i === 0 ? 'Auj.' : i === 1 ? 'Dem.' : joursSemaine[new Date(date).getDay()]}</div>
                    <div className="text-lg">{getMeteoEmoji(meteo.daily.weathercode[i])}</div>
                    <div className="text-xs text-gray-600">{Math.round(meteo.daily.temperature_2m_max[i])}°</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* QUI ÊTES-VOUS */}
      <section className="px-4 pt-12 pb-10 max-w-xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">Qui êtes-vous ?</h2>
        <p className="text-center text-gray-400 text-sm mb-6">Inscrivez-vous en 2 minutes · Gratuit</p>
        <div className="grid grid-cols-2 gap-3">
          {profiles.map(p => (
            <Link
              key={p.href}
              href={p.href}
              className="border border-gray-200 rounded-2xl p-5 flex flex-col items-center text-center hover:border-[#0a4a2f] hover:shadow-md transition-all active:scale-95"
            >
              <span className="text-3xl mb-2">{p.emoji}</span>
              <span className="font-semibold text-sm text-gray-900">{p.title}</span>
              <span className="text-xs text-gray-400 mt-1">{p.description}</span>
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">
          📲 Recevez les annonces directement sur <strong>WhatsApp</strong> dans votre région
        </p>
      </section>

      {/* STATS */}
      <section className="bg-[#0a4a2f] py-8 px-4">
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-4 text-center">
          {stats.map((s, i) => (
            <div key={i} className="text-white">
              <div className="flex justify-center text-[#f5c842] mb-1">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-green-300">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ANNONCES RÉCENTES */}
      <section className="px-4 py-10 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-lg">Annonces récentes</h2>
          <Link href="/recherche" className="text-sm text-[#0a4a2f] font-medium hover:underline">Voir tout →</Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-40 animate-pulse" />)}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Les premières annonces arrivent bientôt</p>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2 font-bold text-[#0a4a2f]">
            <span className="text-xl">🌾</span> AgriMarché
            <span className="text-xs font-normal text-gray-400 ml-1">Afrique de l'Ouest</span>
          </div>
          <div className="flex gap-6 text-gray-400">
            <Link href="/recherche" className="hover:text-gray-700 transition">Produits</Link>
            <Link href="/marche" className="hover:text-gray-700 transition">Prix du marché</Link>
            <Link href="/forum" className="hover:text-gray-700 transition">Forum</Link>
            <Link href="/register" className="hover:text-gray-700 transition">S'inscrire</Link>
          </div>
          <p className="text-xs text-gray-400">© 2024 AgriMarché</p>
        </div>
      </footer>

    </div>
  )
}
