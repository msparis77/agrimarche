// ─────────────────────────────────────────────────────────────────────────────
// Agent collecteur de prix web : fonctions pures (testables sans réseau).
// Règle d'or : on ne publie jamais un prix que l'on ne retrouve pas, chiffre pour
// chiffre, dans le texte de la page source.
// ─────────────────────────────────────────────────────────────────────────────

export interface SourcePrix {
  id: string
  type: 'html' | 'pdf'    // article web ou document PDF
  pays: string            // nom du pays tel que stocké en base
  nom: string             // affiché à l'écran : « Collecté sur … »
  indexUrls: string[]     // pages où chercher les derniers articles
  patternLien: RegExp     // reconnaît les liens d'articles de prix
  villeParDefaut: string  // si la page ne cite pas de marché précis
  devise: string          // code attendu (XOF, CVE…)
  maxArticles: number     // nombre d'articles lus par exécution
  maxAgeJours: number     // relevé plus vieux que ça : ignoré
}

export const SOURCES_PRIX: SourcePrix[] = [
  {
    id: 'ci-fratmat-cnlvc',
    type: 'html',
    pays: "Côte d'Ivoire",
    nom: 'Fratmat (relevé du Conseil national de lutte contre la vie chère)',
    indexUrls: ['https://www.fratmat.info/economie', 'https://www.fratmat.info/'],
    patternLien: /\/article\/(\d+)\/economie\/[^"'\s<>]*prix-des-[^"'\s<>]*/g,
    villeParDefaut: 'Abidjan',
    devise: 'XOF',
    maxArticles: 4,
    maxAgeJours: 10,
  },
]

// Notes de conjoncture hebdomadaires de l'OCPV (Ministère du Commerce de Côte d'Ivoire) :
// prix moyens par produit pour Abidjan et pour l'intérieur du pays, en FCFA/kg.
SOURCES_PRIX.push({
  id: 'ci-ocpv-hebdo',
  type: 'pdf',
  pays: "Côte d'Ivoire",
  nom: "OCPV, Ministère du Commerce de Côte d'Ivoire (note de conjoncture hebdomadaire)",
  indexUrls: ['https://www.ocpv-ci.com/', 'https://www.ocpv-ci.com/doc/note_de_conjoncture/2026/'],
  patternLien: /\/doc\/note_de_conjoncture\/[^"'\s<>]*\.pdf/gi,
  villeParDefaut: 'Abidjan',
  devise: 'XOF',
  maxArticles: 2,
  maxAgeJours: 21,
})

export const USER_AGENT = 'AgriMarcheBot/1.0 (+https://agrimarche.vercel.app; collecte de prix publics)'

// ── robots.txt ───────────────────────────────────────────────────────────────
// Retourne true si `path` est autorisé pour tous les robots (User-agent: *).
export function robotsAutorise(robotsTxt: string, path: string): boolean {
  const lignes = robotsTxt.split(/\r?\n/).map(l => l.replace(/#.*/, '').trim()).filter(Boolean)
  let dansGroupeEtoile = false
  let groupeCourantAvaitRegle = false
  const disallow: string[] = []
  const allow: string[] = []
  for (const l of lignes) {
    const i = l.indexOf(':')
    if (i < 0) continue
    const cle = l.slice(0, i).trim().toLowerCase()
    const val = l.slice(i + 1).trim()
    if (cle === 'user-agent') {
      if (groupeCourantAvaitRegle) { dansGroupeEtoile = false; groupeCourantAvaitRegle = false }
      if (val === '*') dansGroupeEtoile = true
    } else if (dansGroupeEtoile && (cle === 'disallow' || cle === 'allow')) {
      groupeCourantAvaitRegle = true
      if (val) (cle === 'disallow' ? disallow : allow).push(val)
    }
  }
  const correspond = (regle: string) => {
    const re = new RegExp('^' + regle.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'))
    return re.test(path)
  }
  const longueur = (liste: string[]) => liste.filter(correspond).reduce((m, r) => Math.max(m, r.length), -1)
  const d = longueur(disallow), a = longueur(allow)
  return d < 0 || a >= d
}

// ── HTML → texte ─────────────────────────────────────────────────────────────
export function htmlVersTexte(html: string, max = 12000): string {
  let t = html
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|tr|h[1-6]|br|table)>/gi, '\n')
    .replace(/<(td|th)[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
  t = t
    .replace(/&nbsp;|&#160;|&#8239;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/&euro;/g, '€').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  t = t.replace(/[ \t  ]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim()
  return t.slice(0, max)
}

// ── Découverte des articles récents ──────────────────────────────────────────
export function extraireLiensArticles(html: string, src: SourcePrix, baseUrl: string, max: number): string[] {
  const trouves = new Map<number, string>()
  const re = new RegExp(src.patternLien.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const id = Number(m[1])
    if (!isFinite(id)) continue
    try { trouves.set(id, new URL(m[0], baseUrl).toString()) } catch { /* lien invalide */ }
  }
  return Array.from(trouves.entries()).sort((a, b) => b[0] - a[0]).slice(0, max).map(([, u]) => u)
}

// ── Découverte des notes PDF (nom du fichier : ..._N_43_2026.pdf, ..._N_08_FEVRIER_2026.pdf) ──
// Tri par année puis numéro de semaine décroissants.
export function extraireLiensPdf(html: string, src: SourcePrix, baseUrl: string, max: number): string[] {
  const re = new RegExp(src.patternLien.source, 'gi')
  const trouves = new Map<string, number>()
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    let url: string
    try { url = new URL(m[0].replace(/ /g, '%20'), baseUrl).toString() } catch { continue }
    const nom = decodeURIComponent(url.split('/').pop() || '')
    const semaine = Number((nom.match(/N[_°\s]*0*(\d{1,2})/i) || [])[1])
    const annee = Number((url.match(/\/(20\d{2})\//) || nom.match(/(20\d{2})/) || [])[1])
    if (!isFinite(semaine) || !isFinite(annee)) continue
    trouves.set(url, annee * 100 + semaine)
  }
  return Array.from(trouves.entries()).sort((a, b) => b[1] - a[1]).slice(0, max).map(([u]) => u)
}

// ── Normalisation des noms de produits (noms d'AgriMarché) ──────────────────
const REGLES_PRODUITS: [RegExp, string][] = [
  [/patate douce/i, 'Patate douce'], [/igname/i, 'Igname'], [/manioc|attiéké?/i, 'Manioc'],
  [/tomate/i, 'Tomate'], [/oignon/i, 'Oignon'], [/piment/i, 'Piment'], [/gombo/i, 'Gombo'],
  [/aubergine|n.?drowa/i, 'Aubergine'], [/chou/i, 'Chou'], [/carotte/i, 'Carotte'],
  [/banane|plantain|aloco/i, 'Banane'], [/mangue/i, 'Mangue'], [/orange/i, 'Orange'], [/past[eè]que/i, 'Pastèque'],
  [/riz/i, 'Riz'], [/\bmil\b/i, 'Mil'], [/ma[iï]s/i, 'Maïs'], [/sorgho/i, 'Sorgho'], [/fonio/i, 'Fonio'],
  [/arachide|cacahu/i, 'Arachide'], [/ni[ée]b[ée]|haricot/i, 'Niébé'],
  [/poulet|poule/i, 'Poulet'], [/mouton/i, 'Mouton'], [/b(œ|oe)uf/i, 'Bœuf'],
  [/carpe/i, 'Carpe'], [/poisson|capitaine|silure|tilapia|sosso|maquereau/i, 'Poisson'],
  [/huile.*palme/i, 'Huile palme'], [/huile.*arachide/i, 'Huile arachide'],
  [/sucre/i, 'Sucre'], [/farine/i, 'Farine blé'], [/lait/i, 'Lait poudre'],
  [/pomme de terre/i, 'Pomme de terre'],
]
export function normaliserProduit(brut: string): string {
  // « pomme de terre » avant « terre » : on teste dans l'ordre sauf cas particulier
  if (/pomme de terre/i.test(brut)) return 'Pomme de terre'
  for (const [re, nom] of REGLES_PRODUITS) if (re.test(brut)) return nom
  const propre = brut.trim()
  return propre ? propre.charAt(0).toUpperCase() + propre.slice(1).toLowerCase() : ''
}

// ── Réponse du modèle ────────────────────────────────────────────────────────
export interface ExtraitPrix {
  produit_source: string
  prix: number
  marche?: string | null            // « Abidjan » ou « Intérieur » (notes PDF)
  prix_precedent?: number | null    // semaine précédente (contrôle de cohérence)
  variation_pct?: number | null     // variation publiée, en %
  unite?: string | null
  devise?: string | null
  tendance?: string | null
  citation?: string | null
}
export interface Extraction {
  date_releve: string | null
  marche: string | null
  prix: ExtraitPrix[]
}

export function parserReponseModele(texte: string): Extraction | null {
  const debut = texte.indexOf('{'), fin = texte.lastIndexOf('}')
  if (debut < 0 || fin <= debut) return null
  try {
    const j = JSON.parse(texte.slice(debut, fin + 1))
    if (!j || !Array.isArray(j.prix)) return null
    const prix: ExtraitPrix[] = j.prix
      .filter((p: any) => p && typeof p.produit_source === 'string' && isFinite(Number(p.prix)))
      .map((p: any) => ({
        ...p, prix: Number(p.prix),
        prix_precedent: p.prix_precedent != null && isFinite(Number(p.prix_precedent)) ? Number(p.prix_precedent) : null,
        variation_pct: p.variation_pct != null && isFinite(Number(p.variation_pct)) ? Number(p.variation_pct) : null,
      }))
    return {
      date_releve: typeof j.date_releve === 'string' ? j.date_releve : null,
      marche: typeof j.marche === 'string' && j.marche.trim() ? j.marche.trim() : null,
      prix,
    }
  } catch { return null }
}

// ── Contrôles anti-invention ────────────────────────────────────────────────
// Le prix doit apparaître dans le texte de la page, avec ou sans séparateur de milliers
// (« 1500 », « 1 500 », « 1.500 »).
export function prixPresentDansTexte(texte: string, prix: number, tableau = false): boolean {
  // tableau=false (articles) : « 500 » n'est pas accepté dans « 1 500 ».
  // tableau=true (PDF) : des colonnes voisines (« 400 410 ») sont lues séparément ; les contrôles
  // prix précédent + variation protègent alors contre les erreurs.
  // Le nombre doit apparaître tel quel, ou avec un séparateur de milliers (« 1 000 », « 1.000 », « 1,000 »).
  // On ne fusionne jamais le texte : dans un tableau, « 400 410 » sont deux colonnes, pas « 400410 ».
  let motif: string
  if (Number.isInteger(prix)) {
    const chiffres = String(prix)
    const groupes: string[] = []
    for (let i = chiffres.length; i > 0; i -= 3) groupes.unshift(chiffres.slice(Math.max(0, i - 3), i))
    motif = groupes.join('[\\s\\u00a0\\u202f.,]?')
  } else {
    motif = String(prix).replace('.', '[.,]')
  }
  // ni chiffre collé avant/après, ni suite décimale (« 410,5 » ne valide pas 410)
  const avant = tableau ? '(?<![\\d]|\\d[.,])' : '(?<![\\d]|\\d[.,\\s\\u00a0\\u202f])'
  return new RegExp(`${avant}(?:${motif})(?!\\d|[.,]\\d)`).test(texte)
}

// Contrôle de cohérence : (prix − précédent) / précédent doit correspondre à la variation publiée.
// Un décalage de ligne ou de colonne dans un tableau rend ce contrôle faux, donc le prix est rejeté.
export function variationCoherente(prix: number, precedent?: number | null, variationPct?: number | null, tolerance = 1.5): boolean {
  if (precedent == null || variationPct == null || !(precedent > 0)) return false
  const calc = ((prix - precedent) / precedent) * 100
  return Math.abs(calc - variationPct) <= tolerance
}

export function dateValide(iso: string | null, maxAgeJours: number, maintenant = new Date()): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null
  const d = new Date(iso + 'T12:00:00Z')
  if (isNaN(d.getTime())) return null
  const ageJ = (maintenant.getTime() - d.getTime()) / 86400000
  if (ageJ < -1 || ageJ > maxAgeJours) return null
  return iso
}

export function mediane(v: number[]): number {
  const s = [...v].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

// Écart plausible par rapport à l'historique du même pays et du même produit (≥ 3 valeurs)
export function plausible(prix: number, historique: number[]): boolean {
  if (historique.length < 3) return true
  const med = mediane(historique)
  if (med <= 0) return true
  const ratio = prix / med
  return ratio >= 0.33 && ratio <= 3
}

export function normaliserUnite(u?: string | null): string {
  const t = (u || 'kg').toLowerCase().trim()
  if (/^(kilo|kilogramme|kg)s?$/.test(t)) return 'kg'
  if (/litre|^l$/.test(t)) return 'litre'
  if (/tas/.test(t)) return 'tas'
  if (/sac/.test(t)) return 'sac (50kg)'
  if (/pi[eè]ce|unit/.test(t)) return 'unité'
  return t || 'kg'
}

export const PROMPT_EXTRACTION = `Tu extrais des prix de marché depuis le texte d'un article de presse.
RÈGLES STRICTES :
- N'écris QUE les prix explicitement présents dans le texte. N'invente, ne déduis, n'arrondis rien.
- Si le texte ne contient aucun relevé de prix, renvoie {"date_releve": null, "marche": null, "prix": []}.
- "date_releve" : la date du relevé (pas la date de publication si elles diffèrent), au format AAAA-MM-JJ, ou null.
- "marche" : le marché ou la ville cité (ex. "Abidjan"), ou null si non précisé.
- Pour chaque prix : "produit_source" (nom exact écrit dans le texte), "prix" (nombre, sans espaces ni devise), "unite" (kg, litre, tas…), "devise" (FCFA, XOF…), "tendance" (hausse/baisse/stable ou null), "citation" (la phrase ou ligne exacte du texte).
- Réponds UNIQUEMENT par un objet JSON valide, sans texte autour :
{"date_releve":"AAAA-MM-JJ"|null,"marche":string|null,"prix":[{"produit_source":string,"prix":number,"unite":string,"devise":string,"tendance":string|null,"citation":string}]}`

export const PROMPT_EXTRACTION_PDF = `Tu lis une note de conjoncture hebdomadaire sur les prix des produits vivriers en Côte d'Ivoire (document PDF).
Extrais UNIQUEMENT les tableaux de PRIX MOYENS de la semaine en cours (colonnes du type « Prix moyen S(n-1) », « Prix moyen S(n) », « Variation (%) »), pour « Abidjan » et pour « l'intérieur du pays ». Ignore les tableaux de prix mini-maxi.
RÈGLES STRICTES :
- N'écris QUE des valeurs lues dans le document. N'invente, ne calcule et n'arrondis rien.
- Pour chaque produit : "produit_source" (nom exact du tableau), "marche" ("Abidjan" ou "Intérieur"), "prix" (prix moyen de la semaine en cours S(n), nombre), "prix_precedent" (prix moyen de la semaine précédente S(n-1), nombre), "variation_pct" (variation publiée en %, nombre signé), "unite" ("kg" sauf mention contraire), "devise" ("FCFA").
- Si une des trois valeurs (prix, prix précédent, variation) est absente ou illisible pour un produit, ignore ce produit.
- "date_releve" : le DERNIER jour de la semaine couverte, au format AAAA-MM-JJ (ex. « du 19 au 25 octobre 2026 » → "2026-10-25").
- Réponds UNIQUEMENT par un objet JSON valide, sans texte autour :
{"date_releve":"AAAA-MM-JJ"|null,"marche":null,"prix":[{"produit_source":string,"marche":"Abidjan"|"Intérieur","prix":number,"prix_precedent":number,"variation_pct":number,"unite":"kg","devise":"FCFA"}]}`
