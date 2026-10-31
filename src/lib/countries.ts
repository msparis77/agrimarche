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
  lat: number        // position approximative (centre de la ville), pas l'adresse exacte du marché
  lng: number
  note?: string
}

export interface Country {
  code: string       // ISO alpha-2
  nom: string        // valeur stockée en base (colonne `pays`)
  nomEn: string
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
    code: 'SN', nom: 'Sénégal', nomEn: 'Senegal',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+221',
    regions: ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Louga', 'Matam', 'Sédhiou', 'Diourbel'],
    marches: [
      { nom: 'Tilène', ville: 'Dakar', lat: 14.678, lng: -17.45 },
      { nom: 'Marché central', ville: 'Thiès', lat: 14.791, lng: -16.936 },
      { nom: 'Marché central', ville: 'Kaolack', lat: 14.165, lng: -16.076 },
      { nom: 'Marché de Saint-Louis', ville: 'Saint-Louis', lat: 16.018, lng: -16.49 },
      { nom: 'Marché de Ziguinchor', ville: 'Ziguinchor', lat: 12.583, lng: -16.272 },
      { nom: 'Marché de Tambacounda', ville: 'Tambacounda', lat: 13.771, lng: -13.667 },
      { nom: 'Ourossogui', ville: 'Ourossogui', lat: 15.61, lng: -13.32 },
    ],
    cultures: "arachide, mil, sorgho, maïs, riz (vallée du fleuve Sénégal et Casamance), niébé, oignon (Niayes), tomate, mangue, pêche (thiof, yabou)",
    hdxId: 'wfp-food-prices-for-senegal', wfp: 'oui',
    wfpNote: 'Données WFP/HDX disponibles.',
    lat: 15.6, lng: -14.4, // position légèrement décalée pour ne pas masquer la Gambie sur la carte
  },
  {
    code: 'GM', nom: 'Gambie', nomEn: 'The Gambia',
    devise: 'GMD', deviseLabel: 'GMD (dalasi)', indicatif: '+220',
    regions: ['Banjul', 'Brikama', 'Kanifing', 'Basse', 'Janjanbureh', 'Kerewan', 'Kuntaur', 'Mansakonko'],
    marches: [
      { nom: 'Albert Market', ville: 'Banjul', lat: 13.455, lng: -16.579 },
      { nom: 'Serrekunda Market', ville: 'Kanifing', lat: 13.438, lng: -16.678 },
      { nom: 'Brikama Market', ville: 'Brikama', lat: 13.271, lng: -16.649 },
      { nom: 'Basse Market', ville: 'Basse', lat: 13.317, lng: -14.217 },
    ],
    cultures: 'arachide, mil, riz, maïs, sorgho, niébé, sésame, légumes maraîchers',
    hdxId: null, wfp: 'inconnu',
    wfpNote: "Pas d'import automatique WFP/HDX pour ce pays (inchangé).",
    lat: 13.0, lng: -15.9, // idem (position schématique)
  },
  {
    code: 'GN', nom: 'Guinée', nomEn: 'Guinea',
    devise: 'GNF', deviseLabel: 'GNF (franc guinéen)', indicatif: '+224',
    regions: ['Conakry', 'Labé', 'Kankan', 'Kindia', 'Boké', 'Faranah', 'Mamou', "N'Zérékoré"],
    marches: [
      { nom: 'Madina', ville: 'Conakry', lat: 9.546, lng: -13.673 },
      { nom: 'Marché de Kankan', ville: 'Kankan', lat: 10.385, lng: -9.306 },
      { nom: 'Marché de Labé', ville: 'Labé', lat: 11.318, lng: -12.283 },
      { nom: 'Marché de Kindia', ville: 'Kindia', lat: 10.057, lng: -12.866 },
      { nom: "Marché de N'Zérékoré", ville: "N'Zérékoré", lat: 7.756, lng: -8.818 },
    ],
    cultures: 'riz, manioc, fonio, maïs, arachide, pomme de terre (Fouta), huile de palme, banane, ananas',
    hdxId: null, wfp: 'inconnu',
    wfpNote: "Pas d'import automatique WFP/HDX pour ce pays (inchangé).",
    lat: 10.9, lng: -11.0,
  },
  {
    code: 'CV', nom: 'Cap-Vert', nomEn: 'Cabo Verde',
    devise: 'CVE', deviseLabel: 'CVE (escudo)', indicatif: '+238',
    regions: ['Praia', 'Assomada', 'Tarrafal', 'Mindelo', 'Santa Maria', 'Espargos', 'Porto Novo', 'Ribeira Grande', 'São Filipe', 'Sal Rei', 'Vila do Maio'],
    marches: [
      { nom: 'Sucupira', ville: 'Praia', lat: 14.933, lng: -23.513 },
      { nom: 'Marché d\'Assomada', ville: 'Assomada', lat: 15.098, lng: -23.678 },
      { nom: 'Mercado Municipal', ville: 'Mindelo', lat: 16.886, lng: -24.989 },
      { nom: 'Marché de São Filipe', ville: 'São Filipe', lat: 14.896, lng: -24.496 },
    ],
    cultures: "maïs, haricots, manioc, patate douce, canne à sucre (grogue), banane, papaye, légumes irrigués. Archipel sec et volcanique : sécheresse fréquente, peu de terres arables, forte dépendance aux importations",
    hdxId: null, wfp: 'non',
    wfpNote: "Pas de prix WFP par marché pour le Cap-Vert. HDX n'a que des chiffres nationaux FAOSTAT (indices, prix producteurs annuels).",
    lat: 15.1, lng: -23.6,
  },
  {
    code: 'CI', nom: "Côte d'Ivoire", nomEn: 'Ivory Coast',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+225',
    regions: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'Daloa', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa', 'Abengourou', 'Odienné', 'Bondoukou', 'Divo'],
    marches: [
      { nom: 'Adjamé', ville: 'Abidjan', lat: 5.367, lng: -4.028 },
      { nom: 'Treichville', ville: 'Abidjan', lat: 5.297, lng: -4.005 },
      { nom: 'Marché de Bouaké', ville: 'Bouaké', lat: 7.691, lng: -5.03 },
      { nom: 'Marché de Korhogo', ville: 'Korhogo', lat: 9.458, lng: -5.63 },
      { nom: 'Marché de Daloa', ville: 'Daloa', lat: 6.877, lng: -6.45 },
      { nom: 'Marché de San-Pédro', ville: 'San-Pédro', lat: 4.749, lng: -6.636 },
    ],
    cultures: 'cacao, café, anacarde (noix de cajou), hévéa, palmier à huile, igname, manioc, banane plantain, riz, maïs, coton (nord)',
    hdxId: 'wfp-food-prices-for-cote-divoire', wfp: 'ancien',
    wfpNote: "Jeu de données WFP/HDX existant mais ancien (dernières données : octobre 2018).",
    lat: 7.6, lng: -5.5,
  },
  {
    code: 'BJ', nom: 'Bénin', nomEn: 'Benin',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+229',
    regions: ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou', 'Bohicon', 'Natitingou', 'Djougou', 'Lokossa', 'Kandi', 'Malanville', 'Dassa-Zoumè', 'Ouidah'],
    marches: [
      { nom: 'Dantokpa', ville: 'Cotonou', lat: 6.367, lng: 2.433 },
      { nom: 'Ouando', ville: 'Porto-Novo', lat: 6.497, lng: 2.629 },
      { nom: 'Marché de Parakou', ville: 'Parakou', lat: 9.337, lng: 2.63 },
      { nom: 'Marché de Bohicon', ville: 'Bohicon', lat: 7.178, lng: 2.067 },
      { nom: 'Marché de Malanville', ville: 'Malanville', lat: 11.868, lng: 3.385 },
    ],
    cultures: 'coton, maïs, manioc, igname, ananas, anacarde, noix de palme, soja, riz, niébé',
    hdxId: 'wfp-food-prices-for-benin', wfp: 'inconnu',
    wfpNote: "Une page WFP/HDX existe pour le Bénin, mais je n'ai pas pu vérifier sa période. Le cron l'essaie à chaque exécution et le journal indique ce qui est reçu.",
    lat: 9.3, lng: 2.3,
  },
  {
    code: 'BF', nom: 'Burkina Faso', nomEn: 'Burkina Faso',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+226',
    regions: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou', 'Ouahigouya', 'Banfora', 'Fada N\'Gourma', 'Dédougou', 'Kaya', 'Dori', 'Tenkodogo', 'Gaoua', 'Ziniaré', 'Manga'],
    marches: [
      { nom: 'Rood Woko', ville: 'Ouagadougou', lat: 12.371, lng: -1.52 },
      { nom: 'Marché de Bobo-Dioulasso', ville: 'Bobo-Dioulasso', lat: 11.177, lng: -4.298 },
      { nom: 'Marché de Koudougou', ville: 'Koudougou', lat: 12.253, lng: -2.363 },
      { nom: 'Marché de Ouahigouya', ville: 'Ouahigouya', lat: 13.583, lng: -2.422 },
      { nom: 'Marché de Fada N\'Gourma', ville: 'Fada N\'Gourma', lat: 12.061, lng: 0.358 },
    ],
    cultures: 'sorgho, mil, maïs, riz, coton, sésame, arachide, niébé, karité, oignon, tomate, mangue (Hauts-Bassins)',
    hdxId: 'wfp-food-prices-for-burkina-faso', wfp: 'oui',
    wfpNote: 'Données WFP/HDX disponibles (mensuel, jusqu\'à juillet 2024).',
    lat: 12.3, lng: -1.6,
  },
  {
    code: 'ML', nom: 'Mali', nomEn: 'Mali',
    devise: 'XOF', deviseLabel: 'FCFA', indicatif: '+223',
    regions: ['Bamako', 'Kayes', 'Koulikoro', 'Sikasso', 'Ségou', 'Mopti', 'Koutiala', 'San', 'Kati'],
    marches: [
      { nom: 'Médine', ville: 'Bamako', lat: 12.64, lng: -8.003 },
      { nom: 'Marché de Sikasso', ville: 'Sikasso', lat: 11.318, lng: -5.667 },
      { nom: 'Marché de Ségou', ville: 'Ségou', lat: 13.432, lng: -6.216 },
      { nom: 'Marché de Mopti', ville: 'Mopti', lat: 14.484, lng: -4.183 },
      { nom: 'Marché de Kayes', ville: 'Kayes', lat: 14.447, lng: -11.445 },
      { nom: 'Marché de Koutiala', ville: 'Koutiala', lat: 12.392, lng: -5.465 },
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
