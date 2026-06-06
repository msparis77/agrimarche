'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rlnigbyjnlloplqwzxrm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsbmlnYnlqbmxsb3BscXd6eHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MTM1ODEsImV4cCI6MjA5NTk4OTU4MX0.ZVJ0lskiUwo55aEmxpFJ9BWiw4L6giAG_s1kXHh5sA4'
)

const PRODUITS = [
  'Riz', 'Mil', 'Maïs', 'Sorgho', 'Arachide',
  'Niébé', 'Sésame', 'Coton', 'Tomate', 'Oignon',
  'Manioc', 'Patate douce', 'Igname', 'Banane',
  'Mangue', 'Anacarde', 'Huile de palme', 'Bétail',
  'Volaille', 'Poisson', 'Autre'
]

const VILLES = [
  'Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis',
  'Tambacounda', 'Kolda', 'Matam', 'Kaffrine', 'Sédhiou',
  'Banjul', 'Brikama', 'Kanifing', 'Conakry', 'Labé', 'Autre'
]

const TYPES_VENDEUR = [
  '🏪 Grossiste',
  '🌾 Producteur / Fermier',
  '🤝 Coopérative',
  '🏬 Demi-grossiste',
]

const UNITES = ['kg', 'tonne', 'sac (50kg)', 'sac (100kg)', 'litre', 'unité']

interface PrixItem {
  id: string
  vendeur: string
  type_vendeur: string
  telephone: string
  produit: string
  prix: number
  unite: string
  quantite_dispo: string
  ville: string
  description: string
  created_at: string
}

interface FormData {
  vendeur: string
  type_vendeur: string
  telephone: string
  produit: string
  prix: string
  unite: string
  quantite_dispo: string
  ville: string
  description: string
}

const getEmoji = (produit: string): string => {
  const map: Record<string, string> = {
    'Riz': '🌾', 'Mil': '🌾', 'Maïs': '🌽', 'Sorgho': '🌾',
    'Arachide': '🥜', 'Oignon': '🧅', 'Tomate': '🍅',
    'Manioc': '🥔', 'Banane': '🍌', 'Mangue': '🥭',
    'Poisson': '🐟', 'Volaille': '🐔', 'Bétail': '🐄',
    'Coton': '☁️', 'Anacarde': '🥜', 'Huile de palme': '🫙',
  }
  return map[produit] || '📦'
}

export default function MarchePage() {
  const [prix, setPrix] = useState<PrixItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [filtreVille, setFiltreVille] = useState('Toutes')
  const [filtreProduit, setFiltreProduit] = useState('Tous')

  const [form, setForm] = useState<FormData>({
    vendeur: '', type_vendeur: '', telephone: '', produit: '',
    prix: '', unite: 'kg', quantite_dispo: '', ville: '', description: '',
  })

  const chargerPrix = async () => {
    const { data } = await supabase
      .from('prix_marche')
      .select('*')
      .order('created_at', { ascending: false })
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
      vendeur: form.vendeur,
      type_vendeur: form.type_vendeur || null,
      telephone: form.telephone || null,
      produit: form.produit,
      prix: parseFloat(form.prix),
      unite: form.unite,
      quantite_dispo: form.quantite_dispo || null,
      ville: form.ville,
      description: form.description || null,
    }])
    setSaving(false)
    if (!error) {
      setSuccess(true)
      setForm({ vendeur: '', type_vendeur: '', telephone: '', produit: '', prix: '', unite: 'kg', quantite_dispo: '', ville: '', description: '' })
      setShowForm(false)
      chargerPrix()
      setTimeout(() => setSuccess(false), 4000)
    } else {
      alert('Erreur: ' + JSON.stringify(error))
    }
  }

  const prixFiltres = prix.filter((p: PrixItem) => {
    const okVille = filtreVille === 'Toutes' || p.ville === filtreVille
    const okProduit = filtreProduit === 'Tous' || p.produit === filtreProduit
    return okVille && okProduit
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-green-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          <span className="font-bold text-lg">AgriMarché</span>
        </Link>
        <Link href="/connexion" className="text-sm text-green-200 hover:text-white">Connexion</Link>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📊 Prix du marché</h1>
          <p className="text-gray-500 text-sm mt-1">Prix en temps réel · Sénégal · Gambie · Guinée</p>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-300 text-green-800 rounded-2xl px-5 py-4 mb-4 text-center font-semibold">
            ✅ Ton prix a été publié ! Visible par tous les acheteurs.
          </div>
        )}

        <button onClick={() => setShowForm(!showForm)}
          className="w-full bg-yellow-400 text-green-900 font-bold py-4 rounded-2xl text-base mb-6 shadow hover:bg-yellow-300 transition active:scale-95">
          {showForm ? '✕ Annuler' : '📢 Publier mon prix'}
        </button>

        {showForm && (
          <div className="bg-white rounded-2xl shadow-md p-5 mb-6">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Publier mon prix</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Je suis</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES_VENDEUR.map((type: string) => (
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
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Téléphone WhatsApp</label>
                <input type="tel" placeholder="Ex: +221 77 123 45 67" value={form.telephone}
                  onChange={e => setForm({...form, telephone: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Produit *</label>
                <select value={form.produit} onChange={e => setForm({...form, produit: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500 bg-white">
                  <option value="">Choisir un produit</option>
                  {PRODUITS.map((p: string) => <option key={p} value={p}>{getEmoji(p)} {p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Prix (FCFA) *</label>
                  <input type="number" placeholder="Ex: 450" value={form.prix}
                    onChange={e => setForm({...form, prix: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Par</label>
                  <select value={form.unite} onChange={e => setForm({...form, unite: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500 bg-white">
                    {UNITES.map((u: string) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Quantité disponible</label>
                <input type="text" placeholder="Ex: 500 kg, 10 tonnes..." value={form.quantite_dispo}
                  onChange={e => setForm({...form, quantite_dispo: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase mb-1 block">Ville *</label>
                <select value={form.ville} onChange={e => setForm({...form, ville: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base outline-none focus:border-green-500 bg-white">
                  <option value="">Choisir une ville</option>
                  {VILLES.map((v: string) => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <button onClick={handleSubmit} disabled={saving}
                className="w-full bg-green-700 text-white font-bold py-4 rounded-2xl text-base hover:bg-green-600 transition active:scale-95 disabled:opacity-50">
                {saving ? '⏳ Publication...' : '✅ Publier mon prix'}
              </button>
              <p className="text-xs text-gray-400 text-center">Les acheteurs pourront te contacter directement sur WhatsApp</p>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <select value={filtreVille} onChange={e => setFiltreVille(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none shrink-0">
            <option value="Toutes">📍 Toutes les villes</option>
            {VILLES.map((v: string) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none shrink-0">
            <option value="Tous">📦 Tous les produits</option>
            {PRODUITS.map((p: string) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-200 rounded-2xl h-24 animate-pulse" />)}
          </div>
        ) : prixFiltres.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📊</p>
            <p className="font-semibold">Aucun prix pour le moment</p>
            <p className="text-sm mt-1">Sois le premier à publier ton prix !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {prixFiltres.map((p: PrixItem) => (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getEmoji(p.produit)}</span>
                    <div>
                      <div className="font-bold text-gray-800">{p.produit}</div>
                      <div className="text-xs text-gray-400">{p.type_vendeur} · 📍 {p.ville}</div>
                      {p.quantite_dispo && <div className="text-xs text-green-600 mt-0.5">📦 {p.quantite_dispo}</div>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-700 text-lg">{p.prix?.toLocaleString()} F</div>
                    <div className="text-xs text-gray-400">/{p.unite}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{p.vendeur}</div>
                    {p.description && <div className="text-xs text-gray-400 mt-0.5">{p.description}</div>}
                  </div>
                  {p.telephone && (
                    <a href={`https://wa.me/${p.telephone?.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(p.vendeur)}%2C%20j'ai%20vu%20ton%20annonce%20sur%20AgriMarché%20pour%20${encodeURIComponent(p.produit)}%20à%20${p.prix}F/${p.unite}.%20Je%20suis%20intéressé.`}
                      target="_blank" rel="noopener noreferrer"
                      className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-green-400 transition">
                      📱 WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
