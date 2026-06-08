'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const PRODUITS = ['Riz', 'Mil', 'Maïs', 'Sorgho', 'Arachide', 'Niébé', 'Tomate', 'Oignon', 'Manioc', 'Banane', 'Poisson', 'Volaille', 'Autre']
const VILLES = ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Banjul', 'Brikama', 'Conakry', 'Labé', 'Autre']
const TYPES_VENDEUR = ['🏪 Grossiste', '🌾 Producteur / Fermier', '🤝 Coopérative', '🏬 Demi-grossiste']
const UNITES = ['kg', 'tonne', 'sac (50kg)', 'sac (100kg)', 'litre', 'unité']

const getEmoji = (p: string) => ({ 'Riz':'🌾','Mil':'🌾','Maïs':'🌽','Sorgho':'🌾','Arachide':'🥜','Oignon':'🧅','Tomate':'🍅','Manioc':'🥔','Banane':'🍌','Poisson':'🐟','Volaille':'🐔' }[p] || '📦')

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
  const [form, setForm] = useState({ vendeur:'', type_vendeur:'', telephone:'', produit:'', prix:'', unite:'kg', quantite_dispo:'', ville:'', description:'' })

  const chargerPrix = async () => {
    const { data } = await supabase
      .from('prix_marche').select('*').order('created_at', { ascending: false }).limit(200)
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
      setForm({ vendeur:'', type_vendeur:'', telephone:'', produit:'', prix:'', unite:'kg', quantite_dispo:'', ville:'', description:'' })
      setShowForm(false); chargerPrix()
      setTimeout(() => setSuccess(false), 4000)
    } else { alert('Erreur: ' + JSON.stringify(error)) }
  }

  // Derniers 5 prix par produit pour l'affichage public
  const prixParProduit: Record<string, PrixItem[]> = {}
  for (const p of prix) {
    if (filtreProduit !== 'Tous' && p.produit !== filtreProduit) continue
    if (filtreVille !== 'Toutes' && p.ville !== filtreVille) continue
    if (!prixParProduit[p.produit]) prixParProduit[p.produit] = []
    if (prixParProduit[p.produit].length < 5) prixParProduit[p.produit].push(p)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
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

        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-2xl px-5 py-4 mb-4 text-center font-semibold">
            ✅ Ton prix a été publié !
          </div>
        )}

        <button onClick={() => setShowForm(!showForm)}
          className="w-full bg-yellow-400 text-green-900 font-bold py-4 rounded-2xl text-base mb-4 shadow hover:bg-yellow-300 transition">
          {showForm ? '✕ Annuler' : '📢 Signaler un prix du terrain'}
        </button>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Signaler un prix</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Je suis</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES_VENDEUR.map(type => (
                    <button key={type} onClick={() => setForm({...form, type_vendeur: type})}
                      className={`py-2 px-3 rounded-xl text-sm border-2 transition ${form.type_vendeur === type ? 'border-green-600 bg-green-50 font-bold text-green-800' : 'border-gray-200 text-gray-600'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ton nom *</label>
                <input type="text" placeholder="Ex: Mamadou Diallo" value={form.vendeur}
                  onChange={e => setForm({...form, vendeur: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">WhatsApp</label>
                <input type="tel" placeholder="+221 77 123 45 67" value={form.telephone}
                  onChange={e => setForm({...form, telephone: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Produit *</label>
                <select value={form.produit} onChange={e => setForm({...form, produit: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                  <option value="">Choisir</option>
                  {PRODUITS.map(p => <option key={p} value={p}>{getEmoji(p)} {p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Prix (FCFA) *</label>
                  <input type="number" placeholder="450" value={form.prix}
                    onChange={e => setForm({...form, prix: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Par</label>
                  <select value={form.unite} onChange={e => setForm({...form, unite: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                    {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ville *</label>
                <select value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-green-500 bg-white">
                  <option value="">Choisir</option>
                  {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <button onClick={handleSubmit} disabled={saving}
                className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl hover:bg-green-600 transition disabled:opacity-50">
                {saving ? '⏳ Publication...' : '✅ Signaler ce prix'}
              </button>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          <select value={filtreVille} onChange={e => setFiltreVille(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none shrink-0">
            <option value="Toutes">📍 Toutes villes</option>
            {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none shrink-0">
            <option value="Tous">📦 Tous produits</option>
            {PRODUITS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />)}</div>
        ) : Object.keys(prixParProduit).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold">Aucun prix disponible</p>
            <p className="text-sm mt-1">Sois le premier à signaler un prix !</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(prixParProduit).map(([produit, items]) => (
              <div key={produit} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
                  <span className="text-2xl">{getEmoji(produit)}</span>
                  <span className="font-bold text-gray-800">{produit}</span>
                  <span className="ml-auto text-xs text-gray-400">{items.length} prix récents</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            p.source === 'FAO'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {p.source || 'Terrain'}
                          </span>
                          <span className="text-sm text-gray-600">📍 {p.ville}{p.pays && p.pays !== 'Sénégal' ? ` (${p.pays})` : ''}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{p.type_vendeur || p.vendeur}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700 text-lg">{p.prix?.toLocaleString()} F</div>
                        <div className="text-xs text-gray-400">/{p.unite}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-gray-400 text-center mt-8">
          Données FAO/WFP mises à jour chaque semaine · Prix terrain signalés en temps réel
        </p>
      </div>
    </div>
  )
}
