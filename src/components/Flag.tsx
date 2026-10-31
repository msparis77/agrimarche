import { SN, GM, GN, CV, CI, BJ, BF, ML } from 'country-flag-icons/react/3x2'

// Vrais drapeaux en image (SVG). Les drapeaux emoji ne s'affichent pas sous Windows
// (on y voit seulement les lettres « SN », « CV »…), d'où ce composant.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FLAGS: Record<string, any> = {
  SN, GM, GN, CV, CI, BJ, BF, ML,
}

export default function Flag({ code, className = 'w-6 h-4', title }: { code: string; className?: string; title?: string }) {
  const F = FLAGS[code]
  if (!F) return null
  return <F className={`inline-block rounded-[2px] shadow-sm ring-1 ring-black/10 ${className}`} title={title} aria-hidden={title ? undefined : true} />
}

export { FLAGS }
