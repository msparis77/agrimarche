'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ChevronLeft } from 'lucide-react'
import { supabase, getCategories, Category } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const UNITS = ['kg', 'tonne', 'sac', 'litre', 'unité', 'caisse', 'voyage', 'km']
const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée']

const TYPES = [
  {
    id: 'vendeur',
    emoji: '🌾',
    label: 'Vendeur agricole',
    desc: 'Céréales, légumes, fruits, élevage...',
    color: 'border-green-200 bg-green-50 hover:border-green-400',
    activeColor: 'border-[#166534] bg-green-100',
  },
  {
    id: 'transporteur',
    emoji: '🚛',
    label: 'Transporteur',
    desc: 'Camion, pick-up, transport de marchandises',
    color: 'border-orange-200 bg-orange-50 hover:border-orange-400',
    activeColor: 'border-orange-500 bg-orange-100',
  },
  {
    id: 'transformateur',
    emoji: '⚙️',
    label: 'Transformateur',
    desc: 'Mouture, décorticage, séchage, conditionnement',
    color: 'border-blue-200 bg-blue-50 hover:border-blue-400',
    activeColor: 'border-blue-500 bg-blue-100',
  },
  {
    id: 'acheteur',
    emoji: '🛒',
    label: 'Acheteur',
    desc: 'Je cherche des produits agricoles',
    color: 'border-purple-200 bg-purple-50 hover:border-purple-400',
    activeColor: 'border-purple-500 bg-purple-100',
  },
]

const FORM_CONFIG: Record<string, { placeholderTitre: string; placeholderDesc: string; labelQuantite: string; labelPrix: string }> = {
  vendeur: {
    placeholderTitre: 'Ex : 500 kg de riz paddy premium, Tomates fraîches...',
    placeholderDesc: 'Qualité, origine, conditions de stockage, délai de livraison...',
    labelQuantite: 'Quantité disponible',
    labelPrix: 'Prix de vente',
  },
  transporteur: {
    placeholderTitre: 'Ex : Camion 10 tonnes disponible Dakar-Tambacounda',
    placeholderDesc: 'Type de véhicule, zones couvertes, fréquence, conditions...',
    labelQuantite: 'Capacité (tonnage)',
    labelPrix: 'Tarif',
  },
  transformateur: {
    placeholderTitre: 'Ex : Service de mouture de mil et maïs à Thiès',
    placeholderDesc: 'Type de transformation, équipements, produits acceptés, délais...',
    labelQuantite: 'Capacité de traitement',
    labelPrix: 'Tarif',
  },
  acheteur: {
    placeholderTitre: 'Ex : Je cherche 2 tonnes d\'arachides décortiquées',
    placeholderDesc: 'Conditions de paiement, délai souhaité, qualité requise...',
    labelQuantite: 'Quantité souhaitée',
    labelPrix: 'Prix maximum offert',
  },
}

export default function PublierPage() {
  const { user, profile } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)
  const [selectedType, setSelectedType] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    titre: '',
    categorie_id: '',
    description: '',
    quantite: '',
    unite: 'kg',
    prix: '',
    devise: 'XOF',
    pays: 'Sénégal',
    ville: '',
    whatsapp_contact: '',
  })

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    getCategories().then(({ data }) => setCategories(data || []))
  }, [user])

  useEffect(() => {
    if (profile?.whatsapp) setForm(f => ({ ...f, whatsapp_contact: profile.whatsapp || '' }))
  }, [profile])

  const selectType = (typeId: string) => {
    setSelectedType(typeId)
    setStep(2)
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4)
    setImageFiles(files)
    setImagePreviews(files.map(f => URL.createObjectURL(f)))
  }

  const removeImage = (i: number) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i))
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setSubmitError('')

    try {
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const path = `products/${user.id}/${Date.now()}.${ext}`
        const { data } = await supabase.storage.from('images').upload(path, file)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
          imageUrls.push(publicUrl)
        }
      }

      const expiresAt = new Date()
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      const typeLabel = TYPES.find(t => t.id === selectedType)?.label || selectedType

      const { error } = await supabase.from('products').insert({
        user_id: user.id,
        titre: form.titre,
        categorie_id: form.categorie_id || null,
        description: `[${typeLabel}] ${form.description}`,
        quantite: form.quantite ? Number(form.quantite) : null,
        unite: form.unite,
        prix: Number(form.prix),
        devise: form.devise,
        pays: form.pays,
        ville: form.ville,
        whatsapp_contact: form.whatsapp_contact,
        images: imageUrls,
        disponible: true,
        statut: 'actif',
        expires_at: expiresAt.toISOString(),
      })

      if (error) { setSubmitError(error.message); setLoading(false); return }
      router.push('/annonces')
    } catch (err: any) {
      setSubmitError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  const config = FORM_CONFIG[selectedType] || FORM_CONFIG.vendeur
  const typeInfo = TYPES.find(t => t.id === selectedType)

  // ── ÉTAPE 1 : Sélection du type ──
  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 pb-24">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Publier une annonce</h1>
          <p className="text-gray-500 text-sm">Qui êtes-vous ?</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => selectType(type.id)}
              className={`flex flex-col items-center text-center p-5 rounded-2xl border-2 transition-all active:scale-95 ${type.color}`}
            >
              <span className="text-5xl mb-3">{type.emoji}</span>
              <p className="font-bold text-gray-900 text-sm mb-1">{type.label}</p>
              <p className="text-xs text-gray-500 leading-snug">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── ÉTAPE 2 : Formulaire ──
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep(1)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <p className="text-xs text-gray-400">Publier une annonce</p>
          <h1 className="font-extrabold text-gray-900 text-lg leading-tight">
            {typeInfo?.emoji} {typeInfo?.label}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Titre */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titre de l'annonce *</label>
          <input
            required
            value={form.titre}
            onChange={e => setForm({ ...form, titre: e.target.value })}
            placeholder={config.placeholderTitre}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]/20 transition"
          />
        </div>

        {/* Catégorie (vendeur et acheteur seulement) */}
        {(selectedType === 'vendeur' || selectedType === 'acheteur') && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie</label>
            <select
              value={form.categorie_id}
              onChange={e => setForm({ ...form, categorie_id: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] bg-white"
            >
              <option value="">— Choisir une catégorie —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icone} {c.nom_fr}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder={config.placeholderDesc}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] resize-none transition"
          />
        </div>

        {/* Quantité + Unité */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{config.labelQuantite}</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={form.quantite}
              onChange={e => setForm({ ...form, quantite: e.target.value })}
              placeholder="Ex : 500"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] transition"
            />
            <select
              value={form.unite}
              onChange={e => setForm({ ...form, unite: e.target.value })}
              className="w-28 border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#166534] bg-white"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Prix */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">{config.labelPrix} *</label>
          <div className="flex items-center gap-2">
            <input
              required
              type="number"
              value={form.prix}
              onChange={e => setForm({ ...form, prix: e.target.value })}
              placeholder="Ex : 450"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] transition"
            />
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-600 whitespace-nowrap">
              <select
                value={form.devise}
                onChange={e => setForm({ ...form, devise: e.target.value })}
                className="bg-transparent outline-none text-sm font-semibold text-gray-700"
              >
                <option value="XOF">FCFA</option>
                <option value="GMD">GMD</option>
                <option value="GNF">GNF</option>
                <option value="EUR">EUR</option>
              </select>
              <span className="text-gray-400">/ {form.unite}</span>
            </div>
          </div>
        </div>

        {/* Pays + Ville */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pays</label>
            <select
              value={form.pays}
              onChange={e => setForm({ ...form, pays: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#166534] bg-white"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville</label>
            <input
              value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })}
              placeholder="Dakar, Banjul..."
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#166534] transition"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">📱 WhatsApp (optionnel)</label>
          <input
            value={form.whatsapp_contact}
            onChange={e => setForm({ ...form, whatsapp_contact: e.target.value })}
            placeholder="+221 77 000 00 00"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] transition"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photos (max 4)</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-[#166534] transition bg-gray-50">
            <Upload size={22} className="text-gray-400" />
            <span className="text-sm text-gray-500">Ajouter des photos</span>
            <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
          </label>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} className="h-16 w-full object-cover rounded-xl" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            ⚠️ {submitError}
          </div>
        )}

        {/* Bouton Publier */}
        <button
          type="submit"
          disabled={loading || !form.titre.trim() || !form.prix}
          className="w-full bg-[#166534] text-white font-extrabold py-4 rounded-2xl hover:bg-green-800 transition disabled:opacity-50 text-base shadow-lg active:scale-[0.98]"
          style={{ boxShadow: '0 4px 16px rgba(22,101,52,0.3)' }}
        >
          {loading ? 'Publication...' : `📢 Publier l'annonce`}
        </button>

      </form>
    </div>
  )
}
