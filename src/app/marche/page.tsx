'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CountryMap from '@/components/CountryMap'
import { COUNTRIES_DATA, COUNTRY_NAMES, getCountry, getRegions, getDeviseCourte, getDeviseLabel } from '@/lib/countries'

const CATEGORIES_PRODUITS: Record<string, string[]> = {
  '🌾 Céréales':          ['Riz', 'Mil', 'Maïs', 'Sorgho', 'Fonio'],
  '🫘 Légumineuses':      ['Arachide', 'Niébé', 'Haricot'],
  '🥦 Légumes':           ['Oignon', 'Tomate', 'Gombo', 'Piment', 'Aubergine', 'Chou', 'Carotte', 'Manioc', 'Igname', 'Patate douce'],
  '🍋 Fruits':            ['Mangue', 'Banane', 'Orange', 'Pastèque', 'Anacarde'],
  '🍗 Viandes':           ['Poulet', 'Mouton', 'Bœuf', 'Volaille'],
  '🐟 Poissons':          ['Thiof', 'Yabou', 'Carpe', 'Poisson'],
  '🛒 Huiles & Épicerie': ['Huile arachide', 'Huile palme', 'Sucre', 'Farine blé', 'Lait poudre'],
}

const TOUS_PRODUITS = [
  'Riz', 'Mil', 'Maïs', 'Sorgho', 'Fonio',
  'Arachide', 'Niébé', 'Haricot',
  'Oignon', 'Tomate', 'Gombo', 'Piment', 'Aubergine', 'Chou', 'Carotte', 'Manioc', 'Igname', 'Patate douce',
  'Mangue', 'Banane', 'Orange', 'Pastèque', 'Anacarde',
  'Poulet', 'Mouton', 'Bœuf', 'Volaille',
  'Thiof', 'Yabou', 'Carpe', 'Poisson',
  'Huile arachide', 'Huile palme', 'Sucre', 'Farine blé', 'Lait poudre',
  'Autre',
]

const TYPES_VENDEUR = ['🏪 Grossiste', '🌾 Producteur / Fermier', '🤝 Coopérative', '🏬 Demi-grossiste']
const UNITES = ['kg', 'tonne', 'sac (50kg)', 'sac (100kg)', 'litre', 'unité', 'tas']

const EMOJIS: Record<string, string> = {
  'Riz':'🌾','Mil':'🌾','Maïs':'🌽','Sorgho':'🌾','Fonio':'🌾',
  'Arachide':'🥜','Niébé':'🫘','Haricot':'🫘',
  'Oignon':'🧅','Tomate':'🍅','Gombo':'🥬','Piment':'🌶️','Aubergine':'🍆','Chou':'🥦','Carotte':'🥕','Manioc':'🥔',
  'Mangue':'🥭','Banane':'🍌','Orange':'🍊','Pastèque':'🍉','Igname':'🍠','Patate douce':'🍠','Anacarde':'🥜',
  'Poulet':'🐔','Mouton':'🐑','Bœuf':'🐄','Volaille':'🐔',
  'Thiof':'🐟','Yabou':'🐠','Carpe':'🐟','Poisson':'🐟',
  'Huile arachide':'🫙','Huile palme':'🫙','Sucre':'🍬','Farine blé':'🌾','Lait poudre':'🥛',
}
const getEmoji = (p: string) => EMOJIS[p] || '📦'

function getCategorieOf(produit: string): string {
  for (const [cat, prods] of Object.entries(CATEGORIES_PRODUITS)) {
    if (prods.includes(produit)) return cat
  }
  return '📦 Autres'
}

// Pays d'une ligne de prix. Les anciennes lignes « Terrain » n'avaient pas de pays :
// on le déduit de la ville, et à défaut on garde le Sénégal (comportement historique).
function paysDe(p: { pays?: string | null; ville?: string }): string {
  if (p.pays) return p.pays
  const parVille = COUNTRIES_DATA.find(c => c.regions.includes(p.ville || ''))
  return parVille ? parVille.nom : 'Sénégal'
}

// Lien de la source d'un relevé web (inscrit dans la description par l'agent collecteur)
function lienSource(description?: string): string {
  const m = (description || '').match(/https?:\/\/[^\s]+/)
  return m ? m[0] : ''
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
function moisAnnee(periode?: string): string {
  if (!periode) return ''
  const [a, m] = periode.split('-')
  return `${MOIS[Number(m) - 1] ?? ''} ${a}`.trim()
}
// Un relevé WFP/HDX de plus de 6 mois est signalé comme ancien
function estAncien(periode?: string): boolean {
  if (!periode) return false
  const t = new Date(periode).getTime()
  return !isNaN(t) && Date.now() - t > 183 * 24 * 3600 * 1000
}

interface PrixItem {
  id: string; vendeur: string; type_vendeur: string; telephone: string
  produit: string; prix: number; unite: string; quantite_dispo: string
  ville: string; pays?: string; description: string; source?: string; periode?: string; created_at: string
}

export default function MarchePage() {
  const [prix, setPrix] = useState<PrixItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [paysChoisi, setPaysChoisi] = useState('') // '' = tous les pays
  const [filtreVille, setFiltreVille] = useState('Toutes')
  const [filtreProduit, setFiltreProduit] = useState('Tous')
  const [filtreCategorie, setFiltreCategorie] = useState('Toutes')
  const [form, setForm] = useState({
    vendeur: '', type_vendeur: '', telephone: '', produit: '',
    prix: '', unite: 'kg', quantite_dispo: '', ville: '', description: '', pays: 'Sénégal',
  })

  const choisirPays = (nom: string) => {
    setPaysChoisi(nom)
    setFiltreVille('Toutes')
    if (nom) setForm(f => ({ ...f, pays: nom, ville: '' }))
  }

  const chargerPrix = async () => {
    const { data } = await supabase
      .from('prix_marche').select('*').order('created_at', { ascending: false }).limit(500)
    if (data) setPrix(data as PrixItem[])
    setLoading(false)
  }

  useEffect(() => {
    chargerPrix()
    // Lien direct : /marche?pays=Mali
    try {
      const p = new URLSearchParams(window.location.search).get('pays')
      if (p && getCountry(p)) choisirPays(p)
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async () => {
    if (!form.vendeur || !form.produit || !form.prix || !form.ville) {
      alert('Remplis au moins : ton nom, le produit, le prix et la ville !')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('prix_marche').insert([{
      vendeur: form.vendeur, type_vendeur: form.type_vendeur || null,
      telephone: form.telephone || null, produit: form.produit,
      prix: parseFloat(form.prix), unite: form.unite,
      quantite_dispo: form.quantite_dispo || null, ville: form.ville,
      description: form.description || null, source: 'Terrain',
      pays: form.pays,
    }])
    setSaving(false)
    if (!error) {
      setSuccess(true)
      setForm({ vendeur: '', type_vendeur: '', telephone: '', produit: '', prix: '', unite: 'kg', quantite_dispo: '', ville: '', description: '', pays: form.pays })
      setShowForm(false)
      chargerPrix()
      setTimeout(() => setSuccess(false), 4000)
    } else { alert('Erreur: ' + JSON.stringify(error)) }
  }

  // Grouper par produit avec filtres
  const prixParProduit: Record<string, PrixItem[]> = {}
  for (const p of prix) {
    if (paysChoisi && paysDe(p) !== paysChoisi) continue
    if (filtreProduit !== 'Tous' && p.produit !== filtreProduit) continue
    if (filtreVille !== 'Toutes' && p.ville !== filtreVille) continue
    const cat = getCategorieOf(p.produit)
    if (filtreCategorie !== 'Toutes' && cat !== filtreCategorie) continue
    if (!prixParProduit[p.produit]) prixParProduit[p.produit] = []
    if (prixParProduit[p.produit].length < 6) prixParProduit[p.produit].push(p)
  }

  // Grouper les produits par catégorie pour l'affichage
  const parCategorie: Record<string, string[]> = {}
  for (const produit of Object.keys(prixParProduit)) {
    const cat = getCategorieOf(produit)
    if (!parCategorie[cat]) parCategorie[cat] = []
    parCategorie[cat].push(produit)
  }

  const categories = Object.keys(CATEGORIES_PRODUITS)
  const villesForm = [...getRegions(form.pays), 'Autre']
  const villesFiltre = paysChoisi ? getRegions(paysChoisi) : Array.from(new Set(COUNTRIES_DATA.flatMap(c => c.regions)))
  const infoPays = getCountry(paysChoisi)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* En-tête */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">📊 Prix du marché</h1>
          <p className="text-gray-500 text-sm mt-1">{COUNTRY_NAMES.join(' · ')}</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">Officiel</span>
              Relevés WFP/FAO (mensuels)
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Terrain</span>
              Prix signalés par les acteurs
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">Relevé web</span>
              Collecté automatiquement, source citée
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">Estimation</span>
              Pas un relevé
            </span>
          </div>
        </div>

        {/* Succès */}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-2xl px-5 py-4 mb-4 text-center font-semibold">
            ✅ Ton prix a été publié !
          </div>
        )}

        {/* Carte des pays */}
        <div className="mb-4">
          <CountryMap selected={paysChoisi} onSelect={choisirPays} />
        </div>

        {/* Bouton signalement */}
        <button onClick={() => setShowForm(!showForm)}
          className="w-full bg-yellow-400 text-green-900 font-bold py-4 rounded-2xl text-base mb-4 shadow hover:bg-yellow-300 transition">
          {showForm ? '✕ Annuler' : '📢 Signaler un prix du terrain'}
        </button>

        {/* Formulaire terrain */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
            <h2 className="font-bold text-gray-800 text-lg mb-4">📋 Signaler un prix</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Je suis</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES_VENDEUR.map(type => (
                    <button key={type} onClick={() => setForm({ ...form, type_vendeur: type })}
                      className={`py-2 px-3 rounded-xl text-sm border-2 transition ${form.type_vendeur === type ? 'border-green-600 bg-green-50 font-bold text-green-800' : 'border-gray-200 text-gray-600'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ton nom *</label>
                <input type="text" placeholder="Ex: Mamadou Diallo" value={form.vendeur}
                  onChange={e => setForm({ ...form, vendeur: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Pays *</label>
                <select value={form.pays} onChange={e => setForm({ ...form, pays: e.target.value, ville: '' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                  {COUNTRIES_DATA.map(c => <option key={c.code} value={c.nom}>{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">WhatsApp</label>
                <input type="tel" placeholder={`${getCountry(form.pays)?.indicatif ?? '+221'} ...`} value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Produit *</label>
                <select value={form.produit} onChange={e => setForm({ ...form, produit: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                  <option value="">Choisir un produit</option>
                  {Object.entries(CATEGORIES_PRODUITS).map(([cat, prods]) => (
                    <optgroup key={cat} label={cat}>
                      {prods.map(p => <option key={p} value={p}>{getEmoji(p)} {p}</option>)}
                    </optgroup>
                  ))}
                  <optgroup label="📦 Autre">
                    <option value="Autre">Autre produit</option>
                  </optgroup>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Prix ({getDeviseLabel(form.pays)}) *</label>
                  <input type="number" placeholder="450" value={form.prix}
                    onChange={e => setForm({ ...form, prix: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Par</label>
                  <select value={form.unite} onChange={e => setForm({ ...form, unite: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Quantité disponible</label>
                <input type="text" placeholder="Ex: 5 tonnes, 200 sacs..." value={form.quantite_dispo}
                  onChange={e => setForm({ ...form, quantite_dispo: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ville *</label>
                <select value={form.ville} onChange={e => setForm({ ...form, ville: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                  <option value="">Choisir une ville</option>
                  {villesForm.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Note (optionnel)</label>
                <input type="text" placeholder="Ex: prix sortie champ, disponible ce mois..." value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              </div>
              <button onClick={handleSubmit} disabled={saving}
                className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl hover:bg-green-600 transition disabled:opacity-50">
                {saving ? '⏳ Publication...' : '✅ Publier ce prix'}
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="space-y-2 mb-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setFiltreCategorie('Toutes')}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filtreCategorie === 'Toutes' ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              Toutes catégories
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFiltreCategorie(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${filtreCategorie === cat ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {cat.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={filtreVille} onChange={e => setFiltreVille(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
              <option value="Toutes">📍 Toutes villes</option>
              {villesFiltre.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
              <option value="Tous">📦 Tous produits</option>
              {TOUS_PRODUITS.filter(p => p !== 'Autre').map(p => <option key={p} value={p}>{getEmoji(p)} {p}</option>)}
            </select>
          </div>
        </div>

        {infoPays && (infoPays.wfp === 'non' || infoPays.wfp === 'ancien') && (
          <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2">
            {infoPays.wfp === 'non'
              ? `${infoPays.nom} : pas de prix officiels WFP par marché. Seuls les prix signalés sur le terrain sont affichés.`
              : `${infoPays.nom} : les données WFP existantes sont anciennes (2018). Les prix terrain sont plus récents.`}
          </div>
        )}

        {/* Liste des prix */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />)}</div>
        ) : Object.keys(prixParProduit).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold">Aucun prix disponible{infoPays ? ` pour ${infoPays.nom}` : ''}</p>
            {infoPays && infoPays.wfp === 'non' && (
              <p className="text-sm mt-1 px-4">Il n'existe pas de données officielles WFP pour {infoPays.nom} : les prix viennent uniquement des signalements du terrain.</p>
            )}
            <p className="text-sm mt-1">Sois le premier à signaler un prix !</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(parCategorie).map(([cat, produits]) => (
              <div key={cat}>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">{cat}</h2>
                <div className="space-y-3">
                  {produits.map(produit => {
                    const items = prixParProduit[produit]
                    const faoItem = items.find(p => p.source === 'FAO')
                    const minPrix = Math.min(...items.map(p => p.prix))
                    const maxPrix = Math.max(...items.map(p => p.prix))
                    const devises = new Set(items.map(p => getDeviseCourte(paysDe(p))))
                    const deviseUnique = devises.size === 1 ? Array.from(devises)[0] : null
                    return (
                      <div key={produit} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
                          <span className="text-xl">{getEmoji(produit)}</span>
                          <span className="font-bold text-gray-800">{produit}</span>
                          {minPrix !== maxPrix && deviseUnique && (
                            <span className="ml-2 text-xs text-gray-400">
                              {Number(minPrix).toLocaleString('fr-FR')} – {Number(maxPrix).toLocaleString('fr-FR')} {deviseUnique}
                            </span>
                          )}
                          {faoItem && (
                            <span className="ml-auto text-xs text-blue-600 font-semibold">
                              réf. officielle {Number(faoItem.prix).toLocaleString('fr-FR')} {getDeviseCourte(paysDe(faoItem))}/{faoItem.unite}
                            </span>
                          )}
                        </div>
                        <div className="divide-y divide-gray-50">
                          {items.map(p => (
                            <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    p.source === 'FAO' ? 'bg-blue-100 text-blue-700' : p.source === 'Web' ? 'bg-purple-100 text-purple-700' : p.source === 'Estimation' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {p.source === 'FAO' ? 'Officiel' : p.source === 'Web' ? 'Relevé web' : p.source || 'Terrain'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    📍 {p.ville}{!paysChoisi && paysDe(p) !== 'Sénégal' ? ` (${paysDe(p)})` : ''}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{p.type_vendeur || p.vendeur}</div>
                                <div className="text-[11px] text-gray-400">Relevé : {p.source === 'FAO' ? moisAnnee(p.periode) : p.source === 'Web' && p.periode ? new Date(p.periode).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                                {p.source === 'Web' && lienSource(p.description) && (
                                  <div className="text-[11px] text-purple-600">Collecté sur {p.vendeur} · <a href={lienSource(p.description)} target="_blank" rel="noopener noreferrer" className="underline">voir la source</a></div>
                                )}
                                {p.source === 'FAO' && estAncien(p.periode) && (
                                  <div className="text-[11px] text-amber-600 font-semibold mt-0.5">⚠️ Relevé de {moisAnnee(p.periode)} (ancien)</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-700 text-lg">
                                  {Number(p.prix).toLocaleString('fr-FR')} {getDeviseCourte(paysDe(p))}
                                </div>
                                <div className="text-xs text-gray-400">/{p.unite}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-8">
          Données FAO/WFP (OCHA HDX) quand elles existent pour le pays · Prix terrain en temps réel
        </p>
      </div>
    </div>
  )
}
