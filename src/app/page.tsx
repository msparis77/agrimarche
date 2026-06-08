'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Package, TrendingUp, MapPin } from 'lucide-react'
import { supabase, formatPrice } from '@/lib/supabase'

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [prix, setPrix] = useState<any[]>([])
  const [meteo, setMeteo] = useState<any>(null)
  const [ville, setVille] = useState('Dakar')

  useEffect(() => {
    supabase
      .from('products')
      .select('*, categories(nom_fr, icone)')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
    supabase.from('prix_marche').select('*').order('created_at', { ascending: false }).limit(100)
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
    const map: any = {
      'Riz':'🌾','Mil':'🌾','Maïs':'🌽','Sorgho':'🌾','Fonio':'🌾',
      'Arachide':'🥜','Niébé':'🫘','Haricot':'🫘',
      'Oignon':'🧅','Tomate':'🍅','Gombo':'🥬','Piment':'🌶️','Aubergine':'🍆','Chou':'🥦','Carotte':'🥕','Manioc':'🥔',
      'Mangue':'🥭','Banane':'🍌','Orange':'🍊','Pastèque':'🍉',
      'Poulet':'🐔','Mouton':'🐑','Bœuf':'🐄','Volaille':'🐔',
      'Thiof':'🐟','Yabou':'🐠','Carpe':'🐟','Poisson':'🐟',
      'Huile arachide':'🫙','Huile palme':'🫙','Sucre':'🍬','Farine blé':'🌾','Lait poudre':'🥛',
    }
    return map[produit] || '📦'
  }

  // Un seul prix par produit (FAO en priorité, sinon Terrain)
  const prixParProduit = Object.values(
    prix.reduce((acc: Record<string, any>, p) => {
      if (!acc[p.produit] || p.source === 'FAO') acc[p.produit] = p
      return acc
    }, {})
  )

  const tickerItems = prixParProduit.length > 0
    ? prixParProduit.filter((p: any) => p.prix != null).map((p: any) => `${getEmojiproduit(p.produit)} ${p.produit} ${Number(p.prix).toLocaleString('fr-FR')} F/${p.unite || 'kg'}${p.source === 'FAO' ? ' ★FAO' : ''}`)
    : ['🌾 Riz 450 F/kg', '🌽 Maïs 280 F/kg', '🥜 Arachide 320 F/kg', '🧅 Oignon 200 F/kg', '🍅 Tomate 350 F/kg']

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
            <Link href="/annonces" className="flex items-center gap-1 text-white text-sm font-semibold">
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
              {products.map(p => (
                <Link key={p.id} href={`/annonces/${p.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition active:scale-[0.99]">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-yellow-50 flex-shrink-0 flex items-center justify-center text-2xl">
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt={p.titre} className="w-full h-full object-cover" />
                      : (p.categories?.icone || '🌾')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.titre}</p>
                    <p className="font-bold text-[#166534] text-sm mt-0.5">
                      {formatPrice(p.prix, p.devise)}<span className="text-xs font-normal text-gray-400"> /{p.unite}</span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <MapPin size={10} />{p.ville || p.pays || '—'}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                </Link>
              ))}
              <Link href="/annonces"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-white/10 border border-white/30 text-white font-bold rounded-2xl text-sm hover:bg-white/20 transition active:scale-95">
                Voir toutes les annonces <ChevronRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="text-center py-10 bg-white/10 rounded-2xl">
              <Package size={32} className="mx-auto mb-3 text-white/40" />
              <p className="text-sm font-medium text-white/70 mb-4">Aucune annonce pour l'instant</p>
              <Link href="/vendre"
                className="inline-flex items-center gap-2 bg-white text-[#166534] px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-100 transition">
                ➕ Publier la première
              </Link>
            </div>
          )}
        </section>

        {/* COURS DU JOUR */}
        {prixParProduit.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-[#f5c842]" /> Cours du jour
              </h2>
              <Link href="/marche" className="flex items-center gap-1 text-[#166534] text-sm font-semibold hover:text-green-800 transition">
                Voir tout <ChevronRight size={15} />
              </Link>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {(prixParProduit as any[]).slice(0, 5).map((p: any, i: number) => (
                <div key={p.id} className={`flex items-center justify-between px-4 py-3 ${i < Math.min(prixParProduit.length, 5) - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-7">{getEmojiproduit(p.produit)}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-gray-900">{p.produit}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${p.source === 'FAO' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-700'}`}>
                          {p.source === 'FAO' ? 'FAO' : 'Terrain'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">📍 {p.ville || p.pays || '—'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#166534] text-sm">{Number(p.prix).toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">F</span></p>
                    <p className="text-xs text-gray-400">/{p.unite}</p>
                  </div>
                </div>
              ))}
              <Link href="/marche"
                className="flex items-center justify-center gap-1 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition text-xs font-semibold text-gray-500 border-t border-gray-100">
                Voir tous les prix du marché <ChevronRight size={12} />
              </Link>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
