'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, ChevronLeft } from 'lucide-react'
import MicButton from '@/components/MicButton'
import { supabase, getCategories, Category } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const UNITS = ['kg', 'tonne', 'sac', 'litre', 'unité', 'caisse', 'voyage', 'km']
const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée']

const CATEGORIES = [
  { id: 'agricole', emoji: '🌾', label: 'Produit agricole', desc: 'Céréales, légumes, fruits, élevage...' },
  { id: 'transport', emoji: '🚛', label: 'Transport', desc: 'Camion, pick-up, fret...' },
  { id: 'transformation', emoji: '⚙️', label: 'Transformation', desc: 'Mouture, décorticage, séchage...' },
]

type Step = 1 | 2 | 3
type Intent = 'offre' | 'recherche'

export default function PublierPage() {
  const { user, profile } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>(1)
  const [intent, setIntent] = useState<Intent | null>(null)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])

  const [form, setForm] = useState({
    titre: '',
    description: '',
    prix: '',
    unite: 'kg',
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

  const selectIntent = (i: Intent) => {
    setIntent(i)
    setStep(2)
  }

  const selectCategory = (cat: string) => {
    setCategoryId(cat)
    setStep(3)
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

      const catInfo = CATEGORIES.find(c => c.id === categoryId)
      const intentLabel = intent === 'offre' ? 'Offre' : 'Recherche'

      // Match with Supabase categories
      const supabaseCat = categories.find(c => {
        const nom = (c.nom_fr || '').toLowerCase()
        if (categoryId === 'transport') return nom.includes('transport')
        if (categoryId === 'transformation') return nom.includes('transform')
        return nom.includes('agri') || nom.includes('céré') || nom.includes('légume') || nom.includes('produit')
      })

      const { error } = await supabase.from('products').insert({
        user_id: user.id,
        titre: form.titre,
        categorie_id: supabaseCat?.id || null,
        description: `[${intentLabel} - ${catInfo?.label}] ${form.description}`,
        unite: form.unite,
        prix: Number(form.prix),
        devise: 'XOF',
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
    } catch {
      setSubmitError('Une erreur est survenue. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  // ── ÉTAPE 1 : J'offre ou Je cherche ──
  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 pb-24">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Publier une annonce</h1>
          <p className="text-gray-500 text-sm">Que voulez-vous faire ?</p>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => selectIntent('offre')}
            className="flex flex-col items-start gap-2 p-6 rounded-2xl border-2 border-green-200 bg-green-50 hover:border-[#166534] transition active:scale-95 text-left"
          >
            <span className="text-4xl">✅</span>
            <p className="font-extrabold text-gray-900 text-xl">J'offre</p>
            <p className="text-sm text-gray-500">Je vends, je transporte, je transforme</p>
          </button>

          <button
            onClick={() => selectIntent('recherche')}
            className="flex flex-col items-start gap-2 p-6 rounded-2xl border-2 border-blue-200 bg-blue-50 hover:border-blue-500 transition active:scale-95 text-left"
          >
            <span className="text-4xl">🔍</span>
            <p className="font-extrabold text-gray-900 text-xl">Je cherche</p>
            <p className="text-sm text-gray-500">Je recherche un produit, un transport, une transformation</p>
          </button>
        </div>
      </div>
    )
  }

  // ── ÉTAPE 2 : Catégorie ──
  if (step === 2) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setStep(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition">
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <p className="text-xs text-gray-400">Étape 2 / 3</p>
            <h1 className="font-extrabold text-gray-900 text-lg">
              {intent === 'offre' ? '✅ J\'offre' : '🔍 Je cherche'} — Quelle catégorie ?
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className="flex items-center gap-4 p-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-[#166534] transition active:scale-95 text-left"
            >
              <span className="text-4xl flex-shrink-0">{cat.emoji}</span>
              <div>
                <p className="font-bold text-gray-900">{cat.label}</p>
                <p className="text-sm text-gray-500">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── ÉTAPE 3 : Formulaire ──
  const catInfo = CATEGORIES.find(c => c.id === categoryId)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setStep(2)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition">
          <ChevronLeft size={20} className="text-gray-700" />
        </button>
        <div>
          <p className="text-xs text-gray-400">Étape 3 / 3 · {intent === 'offre' ? '✅ Offre' : '🔍 Recherche'}</p>
          <h1 className="font-extrabold text-gray-900 text-lg leading-tight">
            {catInfo?.emoji} {catInfo?.label}
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
            placeholder={intent === 'offre'
              ? 'Ex : 500 kg de riz paddy disponible à Dakar'
              : 'Ex : Recherche 2 tonnes de maïs au Sénégal'}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] focus:ring-1 focus:ring-[#166534]/20 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
          <div className="relative">
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Détails, qualité, conditions, disponibilité..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#166534] resize-none transition"
            />
            <MicButton
              onResult={text => setForm(f => ({ ...f, description: f.description ? f.description + ' ' + text : text }))}
              className="absolute right-3 top-3"
            />
          </div>
        </div>

        {/* Prix + Unité */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            {intent === 'offre' ? 'Prix *' : 'Budget maximum *'}
          </label>
          <div className="flex gap-2">
            <input
              required
              type="number"
              min="0"
              value={form.prix}
              onChange={e => setForm({ ...form, prix: e.target.value })}
              placeholder="Ex : 450"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#166534] transition"
            />
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3">
              <span className="text-gray-500 font-medium text-sm whitespace-nowrap">FCFA /</span>
              <select
                value={form.unite}
                onChange={e => setForm({ ...form, unite: e.target.value })}
                className="bg-transparent outline-none text-sm font-semibold text-gray-700 py-3"
              >
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Ville + Pays */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Ville</label>
            <input
              value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })}
              placeholder="Dakar, Banjul..."
              className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#166534] transition"
            />
          </div>
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
        </div>

        {/* Photo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Photo (max 4)</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-[#166534] transition bg-gray-50">
            <Upload size={22} className="text-gray-400" />
            <span className="text-sm text-gray-500">Ajouter des photos</span>
            <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
          </label>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} className="h-16 w-full object-cover rounded-xl" alt="" />
                  <button type="button" onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
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

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            ⚠️ {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.titre.trim() || !form.prix}
          className="w-full bg-[#166534] text-white font-extrabold py-4 rounded-2xl hover:bg-green-800 transition disabled:opacity-50 text-base shadow-lg active:scale-[0.98]"
          style={{ boxShadow: '0 4px 16px rgba(22,101,52,0.3)' }}
        >
          {loading ? 'Publication...' : '📢 Publier l\'annonce'}
        </button>

      </form>
    </div>
  )
}
