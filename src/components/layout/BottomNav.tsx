'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, MessageSquare, User, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

const tabs = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/recherche', icon: Search, label: 'Chercher' },
  { href: '/vendre', icon: Plus, label: 'Vendre', center: true },
  { href: '/messages', icon: MessageSquare, label: 'Messages', protected: true, badge: true },
  { href: '/dashboard', icon: User, label: 'Profil', protected: true },
]

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const unread = useUnreadMessages()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100"
      style={{ boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, icon: Icon, label, center, protected: isProtected, badge }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          const targetHref = isProtected && !user ? '/login' : href
          const showBadge = badge && user && unread > 0

          if (center) {
            return (
              <Link key={href} href={user ? href : '/login'}
                className="flex flex-col items-center justify-center -mt-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 bg-[#166534]"
                  style={{ boxShadow: '0 4px 16px rgba(22,101,52,0.4)' }}>
                  <Icon size={26} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-semibold text-[#166534] mt-1">{label}</span>
              </Link>
            )
          }

          return (
            <Link key={href} href={targetHref}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all active:scale-95">
              <div className={`relative w-10 h-8 flex items-center justify-center rounded-xl transition-all ${isActive ? 'bg-[#166534]/10' : ''}`}>
                <Icon size={22} strokeWidth={1.8} className={isActive ? 'text-[#166534]' : 'text-gray-400'} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#166534]' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
