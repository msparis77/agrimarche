'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, MessageSquare, User, Megaphone } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'

const tabs = [
  { href: '/', icon: Home, label: 'Accueil' },
  { href: '/vendre', icon: Megaphone, label: 'Publier', protected: true },
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
        {tabs.map(({ href, icon: Icon, label, protected: isProtected, badge }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          const targetHref = isProtected && !user ? '/login' : href
          const showBadge = badge && user && unread > 0

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
