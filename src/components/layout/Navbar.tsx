'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ShoppingBasket, MessageCircle, LayoutDashboard, PlusCircle, LogOut, User, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import type { Lang } from '@/i18n/translations'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const { user, profile, signOut } = useAuth()
  const { lang, setLang, t } = useLang()

  const langs: Lang[] = ['fr', 'en', 'wo']
  const langLabels = { fr: '🇫🇷 FR', en: '🇬🇧 EN', wo: '🟢 WO' }

  return (
    <>
      {/* Safety Banner */}
      {bannerVisible && (
        <div className="bg-gradient-to-r from-[#0a4a2f] to-[#1a7a4f] text-white px-4 py-2.5 border-b border-green-800">
          <div className="max-w-7xl mx-auto flex items-start gap-3">
            <Shield size={16} className="text-[#f5c842] flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <span className="font-bold text-[#f5c842]">🔒 Négociez sur AgriMarché, protégez vos transactions. </span>
              <span className="text-green-100">
                Échangez et payez via la plateforme pour garder une trace de chaque accord. Les paiements externes ne sont pas couverts.
              </span>
              <span className="hidden sm:inline text-green-200 ml-2">
                ✅ Trace écrite · ✅ Paiement sécurisé · ✅ Protection acheteur & vendeur
              </span>
            </div>
            <button
              onClick={() => setBannerVisible(false)}
              className="text-green-300 hover:text-white transition flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#166534] text-white" style={{ boxShadow: '0 2px 12px rgba(22,101,52,0.2)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="text-2xl">🌾</span>
              <span className="text-[#f5c842] font-extrabold tracking-tight">AgriMarché</span>
              <span className="text-xs text-green-300 font-normal hidden sm:block">Afrique de l'Ouest</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link href="/" className="hover:text-[#f5c842] transition-colors text-sm font-medium">{t.nav.home}</Link>
              <Link href="/recherche" className="hover:text-[#f5c842] transition-colors text-sm font-medium">{t.nav.search}</Link>
              <Link href="/forum" className="hover:text-[#f5c842] transition-colors text-sm font-medium">🌾 Forum</Link>
              {user && (
                <>
                  <Link href="/messages" className="hover:text-[#f5c842] transition-colors text-sm font-medium flex items-center gap-1">
                    <MessageCircle size={15} /> {t.nav.messages}
                  </Link>
                  <Link href="/mes-annonces" className="hover:text-[#f5c842] transition-colors text-sm font-medium">📢 Mes annonces</Link>
                  <Link href="/dashboard" className="hover:text-[#f5c842] transition-colors text-sm font-medium flex items-center gap-1">
                    <LayoutDashboard size={15} /> {t.nav.dashboard}
                  </Link>
                  <Link href="/vendre" className="bg-[#f5c842] text-[#166534] font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-400 transition flex items-center gap-1 active:scale-95">
                    <PlusCircle size={15} /> {t.nav.sell}
                  </Link>
                  <button onClick={signOut} className="hover:text-red-300 transition text-sm p-1">
                    <LogOut size={16} />
                  </button>
                </>
              )}
              {!user && (
                <Link href="/login" className="bg-[#f5c842] text-[#166534] font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-400 transition flex items-center gap-1">
                  <User size={15} /> {t.nav.login}
                </Link>
              )}
              <div className="flex gap-1">
                {langs.map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`text-xs px-2 py-1 rounded-lg transition font-medium ${lang === l ? 'bg-white/20 text-white' : 'text-green-300 hover:text-white'}`}>
                    {langLabels[l]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile right — connexion rapide + langue */}
            <div className="md:hidden flex items-center gap-2">
              <div className="flex gap-1">
                {langs.map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${lang === l ? 'bg-white/20 text-white' : 'text-green-300'}`}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              {!user ? (
                <Link href="/login"
                  className="bg-[#f5c842] text-[#166534] font-bold px-3 py-1.5 rounded-xl text-xs hover:bg-yellow-400 transition">
                  Connexion
                </Link>
              ) : (
                <div className="w-8 h-8 bg-[#f5c842] rounded-full flex items-center justify-center text-[#166534] font-bold text-sm">
                  {profile?.nom?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>
    </>
  )
}
