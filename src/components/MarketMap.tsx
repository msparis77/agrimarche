'use client'

import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { RefMarket } from '@/lib/countries'

// Vraie carte (OpenStreetMap) avec un repère par marché de référence.
// Les repères sont placés au centre de la ville du marché (position approximative).
export default function MarketMap({ marches, nomPays }: { marches: RefMarket[]; nomPays: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let carte: any
    let annule = false
    ;(async () => {
      const L = (await import('leaflet')).default
      if (annule || !ref.current) return
      carte = L.map(ref.current, { scrollWheelZoom: false, attributionControl: true })
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(carte)

      const points: [number, number][] = []
      marches.forEach((m, i) => {
        const pt: [number, number] = [m.lat, m.lng]
        points.push(pt)
        // Pastille numérotée (pas d'image : évite les icônes cassées par le bundler)
        const icone = L.divIcon({
          className: '',
          html: `<div style="background:#166534;color:#fff;border:2px solid #f5c842;border-radius:9999px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font:700 12px system-ui;box-shadow:0 1px 4px rgba(0,0,0,.4)">${i + 1}</div>`,
          iconSize: [26, 26], iconAnchor: [13, 13], popupAnchor: [0, -12],
        })
        const marqueur = L.marker(pt, { icon: icone, title: m.nom }).addTo(carte)
        const popup = document.createElement('div')
        const nom = document.createElement('strong'); nom.textContent = m.nom
        const ville = document.createElement('div'); ville.textContent = `${m.ville}, ${nomPays}`
        popup.append(nom, ville)
        marqueur.bindPopup(popup)
      })
      if (points.length === 1) carte.setView(points[0], 11)
      else carte.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 9 })
    })()
    return () => { annule = true; if (carte) carte.remove() }
  }, [marches, nomPays])

  return (
    <div>
      <div ref={ref} className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 z-0" />
      <p className="text-[11px] text-gray-400 mt-1">Repères placés au centre de chaque ville (position approximative).</p>
    </div>
  )
}
