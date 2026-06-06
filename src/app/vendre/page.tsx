'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus } from 'lucide-react'
import { supabase, getCategories, Category } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'

const UNITS = ['kg', 'tonne', 'sac', 'litre', 'unité', 'caisse']
const CURRENCIES = ['FCFA', 'CFA', 'XOF', 'GMD', 'GNF', 'EUR', 'USD']
const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée']

const ICONES = ['📦', '🌾', '🥜', '🥔', '🍅', '🥭', '🫙', '🌶️', '🌿', '☁️', '🐄', '🐔', '🐟', '🥛', '🍯', '🌱', '🧪', '🚜', '🏭', '🪵']

export default function VendrePage() {
  const { user, profile } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatNom, setNewCatNom] = useState('')
  const [newCatIcone, setNewCatIcone] = useState('📦')
  const [addingCat, setAddingCat] = useState(false)
  const [catError, setCatError] = useState('')

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
    whatsapp_contact: profile?.whatsapp || '',
  })

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data || []))
    if (!user) router.push('/login')
  }, [user])

  useEffect(() => {
    if (profile?.whatsapp) setForm(f => ({ ...f, whatsapp_contact: profile.whatsapp || '' }))
  }, [profile])

  const addCategory = async () => {
    const nom = newCatNom.trim()
    if (!nom) return
    setAddingCat(true)
    setCatError('')

    try {
      // Slug sans accents (regex Unicode safe)
      const slug = (nom.toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')) || `cat-${Date.now()}`

      const { data, error } = await supabase
        .from('categories')
        .insert([{ nom_fr: nom, nom_en: nom, icone: newCatIcone, slug }])
        .select()
        .single()

      if (data) {
        const cat: Category = {
          id: data.id,
          nom_fr: data.nom_fr || nom,
          nom_en: data.nom_en || nom,
          icone: data.icone || newCatIcone,
          slug: data.slug || slug,
        }
        setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat])
        setForm(f => ({ ...f, categorie_id: cat.id }))
        setNewCatNom('')
        setNewCatIcone('📦')
        setShowNewCat(false)
        return
      }

      // Slug déjà pris (code 23505 = unique_violation)
      if (error?.code === '23505') {
        const { data: existing } = await supabase
          .from('categories').select('*').eq('slug', slug).maybeSingle()
        if (existing) {
          const cat: Category = {
            id: existing.id, nom_fr: existing.nom_fr || nom,
            nom_en: existing.nom_en || nom, icone: existing.icone || newCatIcone,
            slug: existing.slug || slug,
          }
          setCategories(prev => [...prev.filter(c => c.id !== cat.id), cat])
          setForm(f => ({ ...f, categorie_id: cat.id }))
          setShowNewCat(false)
          return
        }
      }

      setCatError(error?.message || `Erreur ${error?.code || 'inconnue'}`)
    } catch (e: any) {
      setCatError(e?.message || 'Erreur inattendue')
    } finally {
      setAddingCat(false)
    }
  }

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4)
    setImageFiles(files)
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(previews)
  }

  const removeImage = (i: number) => {
    setImageFiles(prev => prev.filter((_, idx) => idx !== i))
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i))
  }

  const [submitError, setSubmitError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setSubmitError('')

    try {
      // Upload images (continue même si le bucket n'existe pas)
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

      const { error: insertError } = await supabase.from('products').insert({
        user_id: user.id,
        titre: form.titre,
        categorie_id: form.categorie_id || null,
        description: form.description,
        quantite: form.quantite ? Number(form.quantite) : null,
        unite: form.unite,
        prix: Number(form.prix),
        devise: form.devise,
        pays: form.pays,
        ville: form.ville,
        whatsapp_contact: form.whatsapp_contact,
        images: imageUrls,
        disponible: true,
        expires_at: expiresAt.toISOString(),
      })

      if (insertError) {
        setSubmitError(`Erreur : ${insertError.message}`)
        setLoading(false)
        return
      }

      router.push('/mes-annonces')
    } catch (err: any) {
      setSubmitError('Une erreur est survenue. Vérifiez votre connexion et réessayez.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.sell.title}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.product_title} *</label>
          <input
            required
            value={form.titre}
            onChange={e => setForm({ ...form, titre: e.target.value })}
            placeholder="Ex: Riz local paddy premium"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f] transition"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.category}</label>
          <div className="flex gap-2">
            <select
              value={form.categorie_id}
              onChange={e => setForm({ ...form, categorie_id: e.target.value })}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            >
              <option value="">— Choisir une catégorie —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icone} {c.nom_fr}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewCat(!showNewCat)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-green-50 border border-green-200 text-[#0a4a2f] px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-100 transition"
              title="Ajouter une catégorie"
            >
              <Plus size={16} /> Nouvelle
            </button>
          </div>

          {/* Formulaire nouvelle catégorie */}
          {showNewCat && (
            <div className="mt-3 border border-dashed border-green-300 rounded-xl p-4 bg-green-50 space-y-3">
              <p className="text-sm font-semibold text-[#0a4a2f]">➕ Nouvelle catégorie</p>

              {/* Sélection icone */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Choisir une icône</p>
                <div className="flex flex-wrap gap-2">
                  {ICONES.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setNewCatIcone(ic)}
                      className={`w-9 h-9 text-xl rounded-lg border-2 transition ${newCatIcone === ic ? 'border-[#0a4a2f] bg-white' : 'border-transparent hover:border-gray-300'}`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom */}
              <div className="flex gap-2">
                <span className="text-2xl w-10 flex items-center justify-center">{newCatIcone}</span>
                <input
                  type="text"
                  value={newCatNom}
                  onChange={e => setNewCatNom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  placeholder="Nom de la catégorie..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0a4a2f]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewCat(false)}
                  className="flex-1 border border-gray-200 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={addCategory}
                  disabled={addingCat || !newCatNom.trim()}
                  className="flex-1 bg-[#0a4a2f] text-white py-2 rounded-xl text-sm font-medium hover:bg-green-900 disabled:opacity-50"
                >
                  {addingCat ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
              {catError && (
                <p className="text-xs text-red-600 mt-2 px-1">{catError}</p>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.description}</label>
          <textarea
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Décrivez votre produit : qualité, origine, conditions de stockage..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f] resize-none"
          />
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.quantity}</label>
            <input
              type="number"
              value={form.quantite}
              onChange={e => setForm({ ...form, quantite: e.target.value })}
              placeholder="500"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.unit}</label>
            <select
              value={form.unite}
              onChange={e => setForm({ ...form, unite: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            >
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Price & Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.price} *</label>
            <input
              required
              type="number"
              value={form.prix}
              onChange={e => setForm({ ...form, prix: e.target.value })}
              placeholder="250"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.currency}</label>
            <select
              value={form.devise}
              onChange={e => setForm({ ...form, devise: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            >
              {CURRENCIES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Country & City */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.country}</label>
            <select
              value={form.pays}
              onChange={e => setForm({ ...form, pays: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.sell.city}</label>
            <input
              value={form.ville}
              onChange={e => setForm({ ...form, ville: e.target.value })}
              placeholder="Dakar, Banjul..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            />
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            📱 {t.sell.whatsapp}
          </label>
          <input
            value={form.whatsapp_contact}
            onChange={e => setForm({ ...form, whatsapp_contact: e.target.value })}
            placeholder="+221 77 000 00 00"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.sell.photos} (max 4)</label>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-[#0a4a2f] transition">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">Cliquez pour ajouter des photos</span>
            <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
          </label>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
              {imagePreviews.map((src, i) => (
                <div key={i} className="relative">
                  <img src={src} className="h-20 w-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0a4a2f] text-white font-bold py-4 rounded-xl hover:bg-green-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publication en cours...' : '📢 Publier l\'annonce'}
        </button>
      </form>
    </div>
  )
}
