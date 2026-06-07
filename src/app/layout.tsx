import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/hooks/useAuth'
import { LangProvider } from '@/hooks/useLang'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import WhatsAppButton from '@/components/WhatsAppButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AgriMarché — Marketplace Agricole Afrique de l\'Ouest',
  description: 'La plateforme de mise en relation entre producteurs agricoles et acheteurs au Sénégal, Gambie et Guinée',
  keywords: 'agriculture, marché, Sénégal, Gambie, Guinée, produits agricoles, marketplace',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <LangProvider>
            <Navbar />
            <main className="pb-16 md:pb-0">{children}</main>
            <WhatsAppButton />
            <BottomNav />
          </LangProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
