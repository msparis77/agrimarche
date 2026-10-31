'use client'

import dynamic from 'next/dynamic'
import { COUNTRIES_DATA, Country, WfpStatus } from '@/lib/countries'
import Flag, { FLAGS } from '@/components/Flag'

const MarketMap = dynamic(() => import('@/components/MarketMap'), {
  ssr: false,
  loading: () => <div className="w-full h-64 rounded-xl bg-gray-100 animate-pulse" />,
})

// Carte schématique de l'Afrique de l'Ouest : chaque pays est un point placé
// à partir de ses coordonnées (longitude / latitude). Ce n'est pas un fond de
// carte précis : le but est de choisir un pays d'un clic.

const LNG_MIN = -27, LNG_MAX = 6
const LAT_MIN = 3, LAT_MAX = 25
const ECHELLE = 12 // pixels par degré
const W = (LNG_MAX - LNG_MIN) * ECHELLE
const H = (LAT_MAX - LAT_MIN) * ECHELLE

const x = (lng: number) => (lng - LNG_MIN) * ECHELLE
const y = (lat: number) => (LAT_MAX - lat) * ECHELLE

const STATUT: Record<WfpStatus, { label: string; classe: string; couleur: string }> = {
  oui:     { label: 'Données WFP/HDX disponibles',        classe: 'bg-blue-100 text-blue-700',     couleur: '#2563eb' },
  ancien:  { label: 'Données WFP/HDX anciennes (2018)',   classe: 'bg-amber-100 text-amber-700',   couleur: '#d97706' },
  inconnu: { label: 'Données WFP/HDX non vérifiées',      classe: 'bg-gray-100 text-gray-600',     couleur: '#6b7280' },
  non:     { label: 'Pas de données WFP/HDX',             classe: 'bg-red-100 text-red-700',       couleur: '#dc2626' },
}

interface Props {
  selected: string          // nom du pays sélectionné, ou '' / 'Tous'
  onSelect: (nom: string) => void
  /** Texte du bouton d'action dans le panneau (ex. « Voir les prix ») */
  actionLabel?: string
  onAction?: (pays: Country) => void
}

export default function CountryMap({ selected, onSelect, actionLabel, onAction }: Props) {
  const pays = COUNTRIES_DATA.find(c => c.nom === selected)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <h2 className="font-bold text-gray-800">🗺️ Carte des pays</h2>
        <p className="text-xs text-gray-400">Touchez un pays pour voir ses marchés de référence.</p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-sky-50" role="img" aria-label="Carte schématique des pays couverts">
        {/* Repères de l'océan et de l'équateur */}
        <text x={10} y={H - 12} fontSize={10} fill="#94a3b8">Océan Atlantique</text>
        {COUNTRIES_DATA.map(c => {
          const actif = c.nom === selected
          const st = STATUT[c.wfp]
          return (
            <g key={c.code} onClick={() => onSelect(actif ? '' : c.nom)}
               className="cursor-pointer" role="button" tabIndex={0}
               aria-label={c.nom} aria-pressed={actif}
               onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(actif ? '' : c.nom) }}>
              <rect x={x(c.lng) - (actif ? 21 : 17)} y={y(c.lat) - (actif ? 15 : 12)}
                    width={actif ? 42 : 34} height={actif ? 30 : 24} rx={4}
                    fill="#fff" stroke={actif ? '#f5c842' : st.couleur} strokeWidth={actif ? 3 : 2} />
              {(() => {
                const F = FLAGS[c.code]
                const w = actif ? 36 : 28, h = actif ? 24 : 18
                return F ? <F x={x(c.lng) - w / 2} y={y(c.lat) - h / 2} width={w} height={h} /> : null
              })()}
              <text x={x(c.lng)} y={y(c.lat) + (c.code === 'SN' ? -22 : 30)} textAnchor="middle" fontSize={10} fontWeight={600}
                    fill={actif ? '#166534' : '#475569'}>{c.nom}</text>
            </g>
          )
        })}
      </svg>

      {/* Boutons de secours (accessibilité, écrans tactiles) */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3 border-t border-gray-100">
        {COUNTRIES_DATA.map(c => (
          <button key={c.code} onClick={() => onSelect(c.nom === selected ? '' : c.nom)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
              c.nom === selected ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-600 border-gray-200'
            }`}>
            <Flag code={c.code} className="w-4 h-3 mr-1 align-[-1px]" />{c.nom}
          </button>
        ))}
      </div>

      {/* Panneau du pays sélectionné */}
      {pays && (
        <div className="border-t border-gray-100 px-4 py-4 bg-green-50/40">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Flag code={pays.code} className="w-7 h-5" />{pays.nom}</h3>
            <span className="text-xs text-gray-500">Monnaie : {pays.deviseLabel}</span>
          </div>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1.5">
            Marchés de référence
          </p>
          <div className="mb-3">
            <MarketMap key={pays.code} marches={pays.marches} nomPays={pays.nom} />
          </div>
          <ul className="space-y-1">
            {pays.marches.map((m, i) => (
              <li key={m.nom + m.ville} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-green-700 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span><span className="font-semibold">{m.nom}</span> — {m.ville}</span>
              </li>
            ))}
          </ul>

          <div className={`mt-3 rounded-xl px-3 py-2 text-xs ${STATUT[pays.wfp].classe}`}>
            <p className="font-bold">{STATUT[pays.wfp].label}</p>
            <p className="mt-0.5">{pays.wfpNote}</p>
          </div>

          {pays.collecteAuto && (
            <div className="mt-2 rounded-xl px-3 py-2 text-xs bg-purple-50 text-purple-700">
              <p className="font-bold">Collecte automatique quotidienne</p>
              <p className="mt-0.5">{pays.collecteAuto}</p>
            </div>
          )}

          {onAction && actionLabel && (
            <button onClick={() => onAction(pays)}
              className="mt-3 w-full bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-green-600 transition">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
