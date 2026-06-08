import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#0a4a2f] text-green-200 py-6 px-4 md:py-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌾</span>
          <span className="font-extrabold text-white text-sm">AgriMarché Afrique de l'Ouest</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          <Link href="/confidentialite" className="hover:text-white transition">Confidentialité</Link>
          <Link href="/mentions-legales" className="hover:text-white transition">Mentions légales</Link>
          <a href="mailto:mstreize@gmail.com" className="hover:text-white transition">Contact</a>
        </div>
        <p className="text-xs text-green-400">© {new Date().getFullYear()} AgriMarché — Tous droits réservés</p>
      </div>
    </footer>
  )
}
