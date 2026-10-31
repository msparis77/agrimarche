// ─────────────────────────────────────────────────────────────────────────────
// Source unique de vérité pour les pays d'AgriMarché.
// Toutes les pages (inscription, annonces, recherche, prix, carte, AgriAssistant)
// lisent ce fichier. Pour ajouter un pays : l'ajouter ici, rien d'autre.
// ─────────────────────────────────────────────────────────────────────────────

export type WfpStatus =
  | 'oui'      // jeu de données WFP/HDX de prix de marché, récent
  | 'ancien'   // existe mais plus mis à jour depuis longtemps
  | 'inconnu'  // page HDX annoncée mais période non vérifiée
  | 'non'      // aucun prix de marché WFP/HDX

export interface RefMarket {
  nom: string        // nom du marché
  ville: string      // ville (valeur utilisée dans les filtres)
  note?: string
}

export interface Country {
  code: string       // ISO alpha-2
  nom: string        // valeur stockée en base (colonne `pays`)
  nomEn: string
  flag: string
  devise: string     // code stocké dans products.devise
  deviseLabel: string // affiché à l'écran
  indicatif: string
  regions: string[]  // régions / villes principales
  marches: RefMarket[]
  cultures: string   // texte utilisé par AgriAssistant
  hdxId: string | null // identifiant du jeu de données HDX (package_show)
  wfp: WfpStatus
  wfpNote: string
  lat: number
  lng: number
}

export const COUNTRIES_DATA: Country[] = [
  {
    code: 'SN', nom: 'Sénégal', nomEn: 'Senegal', flag: '🇸🇳',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+221',
    regions: ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Louga', 'Matam', 'Sédhiou', 'Diourbel'],
    marches: [
      { nom: 'Tilène', ville: 'Dakar' },
      { nom: 'Marché central', ville: 'Thiès' },
      { nom: 'Marché central', ville: 'Kaolack' },
      { nom: 'Marché de Saint-Louis', ville: 'Saint-Louis' },
      { nom: 'Marché de Ziguinchor', ville: 'Ziguinchor' },
      { nom: 'Marché de Tambacounda', ville: 'Tambacounda' },
      { nom: 'Ourossogui', ville: 'Ourossogui' },
    ],
    cultures: "arachide, mil, sorgho, maïs, riz (vallée du fleuve Sénégal et Casamance), niébé, oignon (Niayes), tomate, mangue, pêche (thiof, yabou)",
    hdxId: 'wfp-food-prices-for-senegal', wfp: 'oui',
    wfpNote: 'Données WFP/HDX disponibles.',
    lat: 15.6, lng: -14.4, // position légèrement décalée pour ne pas masquer la Gambie sur la carte
  },
  {
    code: 'GM', nom: 'Gambie', nomEn: 'The Gambia', flag: '🇬🇲',
    devise: 'GMD', deviseLabel: 'GMD (dalasi)', indicatif: '+220',
    regions: ['Banjul', 'Brikama', 'Kanifing', 'Basse', 'Janjanbureh', 'Kerewan', 'Kuntaur', 'Mansakonko'],
    marches: [
      { nom: 'Albert Market', ville: 'Banjul' },
      { nom: 'Serrekunda Market', ville: 'Kanifing' },
      { nom: 'Brikama Market', ville: 'Brikama' },
      { nom: 'Basse Market', ville: 'Basse' },
    ],
    cultures: 'arachide, mil, riz, maïs, sorgho, niébé, sésame, légumes maraîchers',
    hdxId: null, wfp: 'inconnu',
    wfpNote: "Pas d'import automatique WFP/HDX pour ce pays (inchangé).",
    lat: 13.0, lng: -15.9, // idem (position schématique)
  },
  {
    code: 'GN', nom: 'Guinée', nomEn: 'Guinea', flag: '🇬🇳',
    devise: 'GNF', deviseLabel: 'GNF (franc guinéen)', indicatif: '+224',
    regions: ['Conakry', 'Labé', 'Kankan', 'Kindia', 'Boké', 'Faranah', 'Mamou', "N'Zérékoré"],
    marches: [
      { nom: 'Madina', ville: 'Conakry' },
      { nom: 'Marché de Kankan', ville: 'Kankan' },
      { nom: 'Marché de Labé', ville: 'Labé' },
      { nom: 'Marché de Kindia', ville: 'Kindia' },
      { nom: "Marché de N'Zérékoré", ville: "N'Zérékoré" },
    ],
    cultures: 'riz, manioc, fonio, maïs, arachide, pomme de terre (Fouta), huile de palme, banane, ananas',
    hdxId: null, wfp: 'inconnu',
    wfpNote: "Pas d'import automatique WFP/HDX pour ce pays (inchangé).",
    lat: 10.9, lng: -11.0,
  },
  {
    code: 'CV', nom: 'Cap-Vert', nomEn: 'Cabo Verde', flag: '🇨🇻',
    devise: 'CVE', deviseLabel: 'CVE (escudo)', indicatif: '+238',
    regions: ['Praia', 'Assomada', 'Tarrafal', 'Mindelo', 'Santa Maria', 'Espargos', 'Porto Novo', 'Ribeira Grande', 'São Filipe', 'Sal Rei', 'Vila do Maio'],
    marches: [
      { nom: 'Sucupira', ville: 'Praia' },
      { nom: 'Marché d\'Assomada', ville: 'Assomada' },
      { nom: 'Mercado Municipal', ville: 'Mindelo' },
      { nom: 'Marché de São Filipe', ville: 'São Filipe' },
    ],
    cultures: "maïs, haricots, manioc, patate douce, canne à sucre (grogue), banane, papaye, légumes irrigués. Archipel sec et volcanique : sécheresse fréquente, peu de terres arables, forte dépendance aux importations",
    hdxId: null, wfp: 'non',
    wfpNote: "Pas de prix WFP par marché pour le Cap-Vert. HDX n'a que des chiffres nationaux FAOSTAT (indices, prix producteurs annuels).",
    lat: 15.1, lng: -23.6,
  },
  {
    code: 'CI', nom: "Côte d'Ivoire", nomEn: 'Ivory Coast', flag: '🇨🇮',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+225',
    regions: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa', 'Abengourou', 'Odienné', 'Bondoukou', 'Divo'],
    marches: [
      { nom: 'Adjamé', ville: 'Abidjan' },
      { nom: 'Treichville', ville: 'Abidjan' },
      { nom: 'Marché de Bouaké', ville: 'Bouaké' },
      { nom: 'Marché de Korhogo', ville: 'Korhogo' },
      { nom: 'Marché de Daloa', ville: 'Daloa' },
      { nom: 'Marché de San-Pédro', ville: 'San-Pédro' },
    ],
    cultures: 'cacao, café, anacarde (noix de cajou), hévéa, palmier à huile, igname, manioc, banane plantain, riz, maïs, coton (nord)',
    hdxId: 'wfp-food-prices-for-cote-divoire', wfp: 'ancien',
    wfpNote: "Jeu de données WFP/HDX existant mais ancien (dernières données : octobre 2018).",
    lat: 7.6, lng: -5.5,
  },
  {
    code: 'BJ', nom: 'Bénin', nomEn: 'Benin', flag: '🇧🇯',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+229',
    regions: ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou', 'Bohicon', 'Natitingou', 'Djougou', 'Lokossa', 'Kandi', 'Malanville', 'Dassa-Zoumè', 'Ouidah'],
    marches: [
      { nom: 'Dantokpa', ville: 'Cotonou' },
      { nom: 'Ouando', ville: 'Porto-Novo' },
      { nom: 'Marché de Parakou', ville: 'Parakou' },
      { nom: 'Marché de Bohicon', ville: 'Bohicon' },
      { nom: 'Marché de Malanville', ville: 'Malanville' },
    ],
    cultures: 'coton, maïs, manioc, igname, ananas, anacarde, noix de palme, soja, riz, niébé',
    hdxId: 'wfp-food-prices-for-benin', wfp: 'inconnu',
    wfpNote: "Une page WFP/HDX existe pour le Bénin, mais je n'ai pas pu vérifier sa période. Le cron l'essaie à chaque exécution et le journal indique ce qui est reçu.",
    lat: 9.3, lng: 2.3,
  },
  {
    code: 'BF', nom: 'Burkina Faso', nomEn: 'Burkina Faso', flag: '🇧🇫',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+226',
    regions: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Fada N\'Gourma', 'Dédougou', 'Kaya', 'Dori', 'Tenkodogo', 'Gaoua', 'Ziniaré', 'Manga'],
    marches: [
      { nom: 'Rood Woko', ville: 'Ouagadougou' },
      { nom: 'Marché de Bobo-Dioulasso', ville: 'Bobo-Dioulasso' },
      { nom: 'Marché de Koudougou', ville: 'Koudougou' },
      { nom: 'Marché de Ouahigouya', ville: 'Ouahigouya' },
      { nom: 'Marché de Fada N\'Gourma', ville: 'Fada N\'Gourma' },
    ],
    cultures: 'sorgho, mil, maïs, riz, coton, sésame, arachide, niébé, karité, oignon, tomate, mangue (Hauts-Bassins)',
    hdxId: 'wfp-food-prices-for-burkina-faso', wfp: 'oui',
    wfpNote: 'Données WFP/HDX disponibles (mensuel, jusqu\'à juillet 2024).',
    lat: 12.3, lng: -1.6,
  },
  {
    code: 'ML', nom: 'Mali', nomEn: 'Mali', flag: '🇲🇱',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+223',
    regions: ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Koutiala', 'San', 'Kati'],
    marches: [
      { nom: 'Médine', ville: 'Bamako' },
      { nom: 'Marché de Sikasso', ville: 'Sikasso' },
      { nom: 'Marché de Ségou', ville: 'Ségou' },
      { nom: 'Marché de Mopti', ville: 'Mopti' },
      { nom: 'Marché de Kayes', ville: 'Kayes' },
      { nom: 'Marché de Koutiala', ville: 'Koutiala' },
    ],
    cultures: 'mil, sorgho, maïs, riz (Office du Niger), coton (Sikasso, Koutiala), arachide, niébé, karité, mangue, oignon (échalote), élevage',
    hdxId: 'wfp-food-prices-for-mali', wfp: 'oui',
    wfpNote: "Données WFP/HDX disponibles (mensuel, jusqu'à février 2024).",
    lat: 13.0, lng: -6.0,
  },
]

export const COUNTRY_NAMES: string[] = COUNTRIES_DATA.map(c => c.nom)

export function getCountry(nom?: string | null): Country | undefined {
  if (!nom) return undefined
  return COUNTRIES_DATA.find(c => c.nom === nom || c.code === nom)
}

export function getRegions(nom?: string | null): string[] {
  return getCountry(nom)?.regions ?? []
}

/** Code devise stocké dans products.devise (XOF, GMD, GNF, CVE) */
export function getDevise(nom?: string | null): string {
  return getCountry(nom)?.devise ?? 'XOF'
}

/** Libellé de devise affiché (« FCFA », « CVE (escudo) »…) */
export function getDeviseLabel(nom?: string | null): string {
  return getCountry(nom)?.deviseLabel ?? 'FCFA'
}

/** Symbole court pour les prix affichés dans les listes (« F », « CVE », « GMD »…) */
export function getDeviseCourte(nom?: string | null): string {
  const c = getCountry(nom)
  if (!c) return 'F'
  return c.devise === 'XOF' ? 'F' : c.devise
}

/** Liste « Sénégal, Gambie, Guinée… et Mali » pour les textes d'accueil */
export function listeDesPays(lang: 'fr' | 'en' = 'fr'): string {
  const noms = COUNTRIES_DATA.map(c => (lang === 'fr' ? c.nom : c.nomEn))
  const dernier = noms[noms.length - 1]
  return `${noms.slice(0, -1).join(', ')} ${lang === 'fr' ? 'et' : 'and'} ${dernier}`
}

export const NB_PAYS = COUNTRIES_DATA.length
