'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, ShoppingBasket, MessageCircle, LayoutDashboard, PlusCircle, LogOut, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'
import type { Lang } from '@/i18n/translations'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const { lang, setLang, t } = useLang()

  const langs: Lang[] = ['fr', 'en', 'wo']
  const langLabels = { fr: '🇫🇷 FR', en: '🇬🇧 EN', wo: '🟢 WO' }

  return (
    <nav className="sticky top-0 z-50 bg-[#0a4a2f] text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-2xl">🌾</span>
            <span className="text-[#f5c842]">AgriMarché</span>
            <span className="text-xs text-green-300 font-normal hidden sm:block">Afrique de l'Ouest</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="hover:text-[#f5c842] transition-colors text-sm">{t.nav.home}</Link>
            <Link href="/recherche" className="hover:text-[#f5c842] transition-colors text-sm">{t.nav.search}</Link>
            {user && (
              <>
                <Link href="/vendre" className="hover:text-[#f5c842] transition-colors text-sm">{t.nav.sell}</Link>
                <Link href="/messages" className="hover:text-[#f5c842] transition-colors text-sm flex items-center gap-1">
                  <MessageCircle size={15} /> {t.nav.messages}
                </Link>
                <Link href="/dashboard" className="hover:text-[#f5c842] transition-colors text-sm">{t.nav.dashboard}</Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Lang switcher */}
            <div className="flex gap-1">
              {langs.map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${lang === l ? 'bg-[#f5c842] text-[#0a4a2f] font-bold' : 'hover:bg-green-800'}`}
                >
                  {langLabels[l]}
                </button>
              ))}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm bg-green-800 hover:bg-green-700 px-3 py-1.5 rounded-lg transition">
                  <User size={14} />
                  {profile?.nom?.split(' ')[0] || 'Mon compte'}
                </Link>
                <button onClick={signOut} className="text-green-300 hover:text-red-400 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="text-sm hover:text-[#f5c842] transition-colors">{t.nav.login}</Link>
                <Link href="/register" className="text-sm bg-[#f5c842] text-[#0a4a2f] font-semibold px-3 py-1.5 rounded-lg hover:bg-yellow-400 transition">
                  {t.nav.register}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu btn */}
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#063520] px-4 py-4 flex flex-col gap-3">
          <Link href="/" onClick={() => setOpen(false)} className="hover:text-[#f5c842]">{t.nav.home}</Link>
          <Link href="/recherche" onClick={() => setOpen(false)} className="hover:text-[#f5c842]">{t.nav.search}</Link>
          {user ? (
            <>
              <Link href="/vendre" onClick={() => setOpen(false)} className="hover:text-[#f5c842]">{t.nav.sell}</Link>
              <Link href="/messages" onClick={() => setOpen(false)} className="hover:text-[#f5c842]">{t.nav.messages}</Link>
              <Link href="/dashboard" onClick={() => setOpen(false)} className="hover:text-[#f5c842]">{t.nav.dashboard}</Link>
              <button onClick={() => { signOut(); setOpen(false) }} className="text-left text-red-400">{t.nav.logout}</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="hover:text-[#f5c842]">{t.nav.login}</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="bg-[#f5c842] text-[#0a4a2f] font-bold px-3 py-2 rounded-lg text-center">
                {t.nav.register}
              </Link>
            </>
          )}
          <div className="flex gap-2 pt-2 border-t border-green-800">
            {langs.map(l => (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false) }}
                className={`text-xs px-2 py-1 rounded ${lang === l ? 'bg-[#f5c842] text-[#0a4a2f] font-bold' : 'bg-green-800'}`}
              >
                {langLabels[l]}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
