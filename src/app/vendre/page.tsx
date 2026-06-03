'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle } from 'lucide-react'
import { supabase, getCategories, Category } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'

const UNITS = ['kg', 'tonne', 'sac', 'litre', 'unité', 'caisse']
const CURRENCIES = ['XOF', 'GMD', 'GNF', 'EUR', 'USD']
const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée']

export default function VendrePage() {
  const { user, profile } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
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
    whatsapp_contact: profile?.whatsapp || '',
  })

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data || []))
    if (!user) router.push('/login')
  }, [user])

  useEffect(() => {
    if (profile?.whatsapp) setForm(f => ({ ...f, whatsapp_contact: profile.whatsapp || '' }))
  }, [profile])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      // Upload images
      const imageUrls: string[] = []
      for (const file of imageFiles) {
        const ext = file.name.split('.').pop()
        const path = `products/${user.id}/${Date.now()}.${ext}`
        const { data, error } = await supabase.storage.from('images').upload(path, file)
        if (data) {
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
          imageUrls.push(publicUrl)
        }
      }

      // Insert product
      const { error } = await supabase.from('products').insert({
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
      })

      if (!error) {
        setSuccess(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">{t.sell.success}</h2>
          <p className="text-gray-500 mt-2">Redirection en cours...</p>
        </div>
      </div>
    )
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
          <select
            value={form.categorie_id}
            onChange={e => setForm({ ...form, categorie_id: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
          >
            <option value="">— Choisir une catégorie —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icone} {c.nom_fr}</option>
            ))}
          </select>
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
            <div className="grid grid-cols-4 gap-2 mt-3">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0a4a2f] text-white font-bold py-4 rounded-xl hover:bg-green-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Publication en cours...' : t.sell.submit}
        </button>
      </form>
    </div>
  )
}
