'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, LogOut, Shield } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import type { Lang } from '@/i18n/translations'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(true)
  const { user, profile, signOut } = useAuth()
  const { lang, setLang, t } = useLang()
  const langs: Lang[] = ['fr', 'en', 'wo']
  const langLabels = { fr: 'FR', en: 'EN', wo: 'WO' }

  return (
    <>
      {/* Banner sécurité */}
      {bannerVisible && (
        <div className="bg-[#166534] text-white px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex items-center gap-2">
            <Shield size={13} className="text-[#f5c842] flex-shrink-0" />
            <p className="flex-1 text-green-200">
              <span className="font-semibold text-[#f5c842]">Négociez sur AgriMarché</span> pour protéger vos transactions.
            </p>
            <button onClick={() => setBannerVisible(false)} className="text-green-400 hover:text-white ml-2 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Navbar principale */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100" style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <span className="text-2xl">🌾</span>
            <span className="font-extrabold text-[#166534] text-lg tracking-tight">AgriMarché</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-5">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-[#166534] transition">{t.nav.home}</Link>
            <Link href="/annonces" className="text-sm font-medium text-gray-600 hover:text-[#166534] transition">{t.nav.search}</Link>
            <Link href="/forum" className="text-sm font-medium text-gray-600 hover:text-[#166534] transition">Forum</Link>
            {user && (
              <>
                <Link href="/messages" className="text-sm font-medium text-gray-600 hover:text-[#166534] transition">{t.nav.messages}</Link>
                <Link href="/mes-annonces" className="text-sm font-medium text-gray-600 hover:text-[#166534] transition">Mes annonces</Link>
                <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-[#166534] transition">{t.nav.dashboard}</Link>
                <Link href="/vendre" className="bg-[#166534] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-800 transition">
                  {t.nav.sell}
                </Link>
                <button onClick={signOut} className="p-1.5 text-gray-400 hover:text-red-500 transition">
                  <LogOut size={16} />
                </button>
              </>
            )}
            {!user && (
              <Link href="/login" className="bg-[#166534] text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-green-800 transition">
                Connexion
              </Link>
            )}
            <div className="flex gap-1 ml-1">
              {langs.map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`text-xs px-2 py-1 rounded-lg font-semibold transition ${lang === l ? 'bg-[#166534] text-white' : 'text-gray-400 hover:text-gray-700'}`}>
                  {langLabels[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile : langue + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <div className="flex gap-1">
              {langs.map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${lang === l ? 'bg-[#166534] text-white' : 'text-gray-400'}`}>
                  {langLabels[l]}
                </button>
              ))}
            </div>
            <button onClick={() => setOpen(!open)} className="p-1.5 rounded-xl text-gray-700 hover:bg-gray-100 transition">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Drawer mobile */}
        {open && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 shadow-xl z-50"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <div className="px-4 py-3 space-y-0.5">
              {user && (
                <div className="flex items-center gap-3 py-3 mb-2 border-b border-gray-100">
                  <div className="w-10 h-10 bg-[#166534] rounded-full flex items-center justify-center text-white font-bold text-base">
                    {profile?.nom?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{profile?.nom || 'Mon compte'}</p>
                    <p className="text-xs text-gray-400">{profile?.role}</p>
                  </div>
                </div>
              )}

              {[
                { href: '/', label: '🏠 Accueil' },
                { href: '/annonces', label: '📋 Annonces' },
                { href: '/forum', label: '🌾 Forum' },
                ...(user ? [
                  { href: '/messages', label: '💬 Messages' },
                  { href: '/mes-annonces', label: '📢 Mes annonces' },
                  { href: '/dashboard', label: '⚙️ Mon profil' },
                  { href: '/vendre', label: '➕ Publier une annonce', highlight: true },
                ] : [
                  { href: '/login', label: '🔑 Connexion', highlight: true },
                  { href: '/register', label: '✨ Créer un compte' },
                ]),
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  className={`flex items-center py-3 px-3 rounded-xl text-sm font-medium transition
                    ${(item as any).highlight ? 'bg-[#166534] text-white mt-2' : 'text-gray-700 hover:bg-gray-50'}`}>
                  {item.label}
                </Link>
              ))}

              {user && (
                <button onClick={() => { signOut(); setOpen(false) }}
                  className="flex items-center gap-2 py-3 px-3 text-sm text-red-500 hover:bg-red-50 rounded-xl w-full mt-1 transition">
                  <LogOut size={16} /> Déconnexion
                </button>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
