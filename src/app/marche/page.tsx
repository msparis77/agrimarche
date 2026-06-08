'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const CATEGORIES_PRODUITS: Record<string, string[]> = {
  '🌾 Céréales':          ['Riz', 'Mil', 'Maïs', 'Sorgho', 'Fonio'],
  '🫘 Légumineuses':      ['Arachide', 'Niébé', 'Haricot'],
  '🥦 Légumes':           ['Oignon', 'Tomate', 'Gombo', 'Piment', 'Aubergine', 'Chou', 'Carotte', 'Manioc'],
  '🍋 Fruits':            ['Mangue', 'Banane', 'Orange', 'Pastèque'],
  '🍗 Viandes':           ['Poulet', 'Mouton', 'Bœuf', 'Volaille'],
  '🐟 Poissons':          ['Thiof', 'Yabou', 'Carpe', 'Poisson'],
  '🛒 Huiles & Épicerie': ['Huile arachide', 'Huile palme', 'Sucre', 'Farine blé', 'Lait poudre'],
}

const TOUS_PRODUITS = [
  'Riz', 'Mil', 'Maïs', 'Sorgho', 'Fonio',
  'Arachide', 'Niébé', 'Haricot',
  'Oignon', 'Tomate', 'Gombo', 'Piment', 'Aubergine', 'Chou', 'Carotte', 'Manioc',
  'Mangue', 'Banane', 'Orange', 'Pastèque',
  'Poulet', 'Mouton', 'Bœuf', 'Volaille',
  'Thiof', 'Yabou', 'Carpe', 'Poisson',
  'Huile arachide', 'Huile palme', 'Sucre', 'Farine blé', 'Lait poudre',
  'Autre',
]

const VILLES = ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 'Tambacounda', 'Ourossogui', 'Kolda', 'Diourbel', 'Louga', 'Fatick', 'Banjul', 'Conakry', 'Autre']
const TYPES_VENDEUR = ['🏪 Grossiste', '🌾 Producteur / Fermier', '🤝 Coopérative', '🏬 Demi-grossiste']
const UNITES = ['kg', 'tonne', 'sac (50kg)', 'sac (100kg)', 'litre', 'unité', 'tas']

const EMOJIS: Record<string, string> = {
  'Riz':'🌾','Mil':'🌾','Maïs':'🌽','Sorgho':'🌾','Fonio':'🌾',
  'Arachide':'🥜','Niébé':'🫘','Haricot':'🫘',
  'Oignon':'🧅','Tomate':'🍅','Gombo':'🥬','Piment':'🌶️','Aubergine':'🍆','Chou':'🥦','Carotte':'🥕','Manioc':'🥔',
  'Mangue':'🥭','Banane':'🍌','Orange':'🍊','Pastèque':'🍉',
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

interface PrixItem {
  id: string; vendeur: string; type_vendeur: string; telephone: string
  produit: string; prix: number; unite: string; quantite_dispo: string
  ville: string; pays?: string; description: string; source?: string; created_at: string
}

export default function MarchePage() {
  const [prix, setPrix] = useState<PrixItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [filtreVille, setFiltreVille] = useState('Toutes')
  const [filtreProduit, setFiltreProduit] = useState('Tous')
  const [filtreCategorie, setFiltreCategorie] = useState('Toutes')
  const [form, setForm] = useState({
    vendeur: '', type_vendeur: '', telephone: '', produit: '',
    prix: '', unite: 'kg', quantite_dispo: '', ville: '', description: '',
  })

  const chargerPrix = async () => {
    const { data } = await supabase
      .from('prix_marche').select('*').order('created_at', { ascending: false }).limit(500)
    if (data) setPrix(data as PrixItem[])
    setLoading(false)
  }

  useEffect(() => { chargerPrix() }, [])

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
    }])
    setSaving(false)
    if (!error) {
      setSuccess(true)
      setForm({ vendeur: '', type_vendeur: '', telephone: '', produit: '', prix: '', unite: 'kg', quantite_dispo: '', ville: '', description: '' })
      setShowForm(false)
      chargerPrix()
      setTimeout(() => setSuccess(false), 4000)
    } else { alert('Erreur: ' + JSON.stringify(error)) }
  }

  // Grouper par produit avec filtres
  const prixParProduit: Record<string, PrixItem[]> = {}
  for (const p of prix) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* En-tête */}
        <div className="text-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">📊 Prix du marché</h1>
          <p className="text-gray-500 text-sm mt-1">Sénégal · Gambie · Guinée</p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">FAO</span>
              Prix officiels WFP/FAO
            </span>
            <span className="flex items-center gap-1">
              <span className="bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Terrain</span>
              Prix signalés par les acteurs
            </span>
          </div>
        </div>

        {/* Succès */}
        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-2xl px-5 py-4 mb-4 text-center font-semibold">
            ✅ Ton prix a été publié !
          </div>
        )}

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
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">WhatsApp</label>
                <input type="tel" placeholder="+221 77 123 45 67" value={form.telephone}
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
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Prix (FCFA) *</label>
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
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
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
              {VILLES.filter(v => v !== 'Autre').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none">
              <option value="Tous">📦 Tous produits</option>
              {TOUS_PRODUITS.filter(p => p !== 'Autre').map(p => <option key={p} value={p}>{getEmoji(p)} {p}</option>)}
            </select>
          </div>
        </div>

        {/* Liste des prix */}
        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />)}</div>
        ) : Object.keys(prixParProduit).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold">Aucun prix disponible</p>
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
                    return (
                      <div key={produit} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
                          <span className="text-xl">{getEmoji(produit)}</span>
                          <span className="font-bold text-gray-800">{produit}</span>
                          {minPrix !== maxPrix && (
                            <span className="ml-2 text-xs text-gray-400">
                              {Number(minPrix).toLocaleString('fr-FR')} – {Number(maxPrix).toLocaleString('fr-FR')} F
                            </span>
                          )}
                          {faoItem && (
                            <span className="ml-auto text-xs text-blue-600 font-semibold">
                              ref. FAO {Number(faoItem.prix).toLocaleString('fr-FR')} F/{faoItem.unite}
                            </span>
                          )}
                        </div>
                        <div className="divide-y divide-gray-50">
                          {items.map(p => (
                            <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    p.source === 'FAO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                  }`}>
                                    {p.source || 'Terrain'}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    📍 {p.ville}{p.pays && p.pays !== 'Sénégal' ? ` (${p.pays})` : ''}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 mt-0.5">{p.type_vendeur || p.vendeur}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-700 text-lg">
                                  {Number(p.prix).toLocaleString('fr-FR')} F
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
          Données FAO/WFP · ANSD · BCEAO — mise à jour hebdomadaire · Prix terrain en temps réel
        </p>
      </div>
    </div>
  )
}
