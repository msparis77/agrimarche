'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Package, TrendingUp } from 'lucide-react'
import { getProducts, Product } from '@/lib/supabase'
import ProductCard from '@/components/marketplace/ProductCard'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [prix, setPrix] = useState<any[]>([])
  const [meteo, setMeteo] = useState<any>(null)
  const [ville, setVille] = useState('Dakar')

  useEffect(() => {
    getProducts({ limit: 3 }).then(({ data }) => { setProducts(data || []); setLoading(false) })
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

  const tickerItems = prix.length > 0
    ? prix.map(p => `${getEmojiproduit(p.produit)} ${p.produit} ${p.prix.toLocaleString()} FCFA/${p.unite} · ${p.ville}`)
    : ['🌾 Riz · 450 FCFA/kg', '🌽 Maïs · 280 FCFA/kg', '🥜 Arachide · 320 FCFA/kg', '🧅 Oignon · 200 FCFA/kg', '🍅 Tomate · 350 FCFA/kg']

  return (
    <div className="min-h-screen bg-[#166534]">

      {/* TICKER */}
      <div className="bg-[#166534] overflow-hidden">
        <div className="flex items-center">
          <Link href="/marche"
            className="shrink-0 bg-[#f5c842] text-[#166534] px-4 py-2 text-xs font-extrabold uppercase tracking-wider whitespace-nowrap hover:bg-yellow-300 transition">
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

      <div className="max-w-lg mx-auto px-4 pt-5 pb-4 space-y-5">

        {/* MÉTÉO */}
        {meteo && (
          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border border-gray-100">
            <span className="text-3xl">{meteoEmoji(meteo.current?.weathercode)}</span>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-base">{Math.round(meteo.current?.temperature_2m)}°C</p>
              <p className="text-xs text-gray-400">📍 {ville}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Aujourd'hui</p>
              <p className="text-xs text-[#166534] font-semibold">Conditions agricoles</p>
            </div>
          </div>
        )}

        {/* ANNONCES RÉCENTES */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-extrabold text-gray-900">Annonces récentes</h2>
            <Link href="/recherche" className="flex items-center gap-1 text-[#166534] text-sm font-semibold">
              Voir tout <ChevronRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-3">
              {products.slice(0, 3).map(p => <ProductCard key={p.id} product={p} />)}
              <Link href="/recherche"
                className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-[#166534] text-[#166534] font-bold rounded-2xl text-sm hover:bg-green-50 transition active:scale-95">
                Voir toutes les annonces <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <Package size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-sm font-medium text-gray-400 mb-4">Aucune annonce pour l'instant</p>
              <Link href="/vendre"
                className="inline-flex items-center gap-2 bg-[#166534] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-800 transition">
                ➕ Publier la première
              </Link>
            </div>
          )}
        </section>

        {/* COURS DU JOUR (si données dispo) */}
        {prix.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#f5c842]" /> Cours du jour
              </h2>
              <Link href="/marche" className="flex items-center gap-1 text-[#166534] text-sm font-semibold">
                Voir tout <ChevronRight size={15} />
              </Link>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {prix.slice(0, 3).map((p, i) => (
                <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i < 2 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-7">{getEmojiproduit(p.produit)}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{p.produit}</p>
                      <p className="text-xs text-gray-400">📍 {p.ville}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#166534] text-sm">{p.prix.toLocaleString()} <span className="text-xs font-normal text-gray-400">FCFA</span></p>
                    <p className="text-xs text-gray-400">/{p.unite}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
