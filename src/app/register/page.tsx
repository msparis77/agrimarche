'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'

const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée', 'France', 'Autre']

const PRODUITS_AGRICOLES = [
  'Riz', 'Mil', 'Maïs', 'Sorgho', 'Arachide',
  'Niébé', 'Sésame', 'Coton', 'Tomate', 'Oignon',
  'Manioc', 'Patate douce', 'Igname', 'Banane',
  'Mangue', 'Anacarde', 'Huile de palme', 'Bétail',
  'Volaille', 'Poisson', 'Autre'
]

const VEHICULES = [
  'Moto / Tricycle (moins de 500 kg)',
  'Camionnette (500 kg à 2 tonnes)',
  'Camion (2 à 10 tonnes)',
  'Gros camion (plus de 10 tonnes)',
]

const ZONES = [
  'Local (même ville)',
  'Régional (même pays)',
  'International (entre pays)',
]

const REGIONS_SENEGAL = ['Dakar', 'Thiès', 'Kaolack', 'Ziguinchor', 'Saint-Louis', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine', 'Kédougou', 'Louga', 'Matam', 'Sédhiou', 'Diourbel']
const REGIONS_GAMBIE = ['Banjul', 'Brikama', 'Kanifing', 'Basse', 'Janjanbureh', 'Kerewan', 'Kuntaur', 'Mansakonko']
const REGIONS_GUINEE = ['Conakry', 'Labé', 'Kankan', 'Kindia', 'Boké', 'Faranah', 'Mamou', "N'Zérékoré"]

type Role = 'producteur' | 'acheteur' | 'transformateur' | 'transporteur'

const ROLES = [
  { id: 'producteur' as Role, icon: '🌾', label: 'Producteur', desc: 'Je cultive et veux vendre mes produits' },
  { id: 'acheteur' as Role, icon: '🛒', label: 'Commerçant / Acheteur', desc: 'Je cherche des produits agricoles' },
  { id: 'transformateur' as Role, icon: '🏭', label: 'Transformateur', desc: 'Je transforme et vends des produits' },
  { id: 'transporteur' as Role, icon: '🚛', label: 'Transporteur', desc: 'Je transporte des marchandises agricoles' },
]

export default function RegisterPage() {
  const { t } = useLang()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    email: '',
    password: '',
    telephone: '',
    pays: 'Sénégal',
    role: '' as Role | '',
    region: '',
    produits: [] as string[],
    volume_mensuel: '',
    surface_hectares: '',
    produits_recherches: [] as string[],
    quantite_mensuelle: '',
    frequence_achat: '',
    produits_transformes: [] as string[],
    capacite_transformation: '',
    produits_finis: '',
    type_vehicule: '',
    capacite_kg: '',
    zones_desservies: [] as string[],
    disponibilite: '',
    acceptCgv: false,
  })

  const getRegions = () => {
    if (form.pays === 'Sénégal') return REGIONS_SENEGAL
    if (form.pays === 'Gambie') return REGIONS_GAMBIE
    if (form.pays === 'Guinée') return REGIONS_GUINEE
    return []
  }

  const toggleItem = (field: string, value: string) => {
    const current = (form as any)[field] as string[]
    if (current.includes(value)) {
      setForm({ ...form, [field]: current.filter((v: string) => v !== value) })
    } else if (current.length < 5) {
      setForm({ ...form, [field]: [...current, value] })
    }
  }

  const handleRegister = async () => {
    if (!form.nom || !form.email || !form.password || !form.role) {
      setError('Veuillez remplir tous les champs obligatoires')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nom: form.nom,
          telephone: form.telephone,
          pays: form.pays,
          role: form.role,
          region: form.region,
          produits: form.produits,
          volume_mensuel: form.volume_mensuel,
          type_vehicule: form.type_vehicule,
          zones_desservies: form.zones_desservies,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Si Supabase demande une confirmation email
    if (data?.user && !data.session) {
      setNeedsConfirmation(true)
    } else {
      // Compte créé et connecté directement
      setSuccess(true)
    }

    setLoading(false)
  }

  // ── Écran succès — confirmation email requise ──
  if (needsConfirmation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <span className="text-6xl block mb-4">📧</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Vérifiez votre email !</h1>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-800 font-medium text-sm">
              Un email de confirmation a été envoyé à :
            </p>
            <p className="text-[#0a4a2f] font-bold mt-1">{form.email}</p>
          </div>
          <p className="text-gray-500 text-sm mb-6">
            Cliquez sur le lien dans l'email pour activer votre compte.
            Vérifiez aussi vos spams si vous ne le trouvez pas.
          </p>
          <Link
            href="/login"
            className="block w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition"
          >
            Aller à la connexion
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Une fois l'email confirmé, vous pourrez vous connecter.
          </p>
        </div>
      </div>
    )
  }

  // ── Écran succès — compte créé directement ──
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <span className="text-6xl block mb-4">✅</span>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Compte créé avec succès !</h1>
          <p className="text-gray-500 text-sm mb-6">
            Bienvenue sur AgriMarché, {form.nom.split(' ')[0]} ! Votre compte est actif.
          </p>
          <Link
            href="/"
            className="block w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition"
          >
            Accéder à la plateforme →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-10">
      <div className="w-full max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">🌾</span>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 ? 'Créer mon compte' : 'Mon profil'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">AgriMarché — Ceddo Xam-Xam</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-[#0a4a2f]' : 'bg-gray-200'}`} />
          <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-[#0a4a2f]' : 'bg-gray-200'}`} />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">

          {/* ===== ÉTAPE 1 ===== */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Je suis... *</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.id })}
                      className={`p-3 rounded-xl border-2 text-left transition ${
                        form.role === r.id ? 'border-[#0a4a2f] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{r.icon}</span>
                      <p className="font-semibold text-sm">{r.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Mamadou Diallo"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">📱 Numéro WhatsApp *</label>
                <input
                  value={form.telephone}
                  onChange={e => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                <select
                  value={form.pays}
                  onChange={e => setForm({ ...form, pays: e.target.value, region: '' })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="vous@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 6 caractères"
                  minLength={6}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.acceptCgv}
                  onChange={e => setForm({ ...form, acceptCgv: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-[#0a4a2f] flex-shrink-0"
                />
                <span className="text-sm text-gray-600">
                  J'accepte la{' '}
                  <a href="/confidentialite" target="_blank" className="text-[#0a4a2f] underline font-medium">
                    politique de confidentialité
                  </a>{' '}
                  et les{' '}
                  <a href="/mentions-legales" target="_blank" className="text-[#0a4a2f] underline font-medium">
                    mentions légales
                  </a>{' '}
                  d'AgriMarché. *
                </span>
              </label>

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              <button
                onClick={() => {
                  if (!form.role || !form.nom || !form.telephone || !form.email || !form.password) {
                    setError('Veuillez remplir tous les champs')
                    return
                  }
                  if (form.password.length < 6) {
                    setError('Le mot de passe doit contenir au moins 6 caractères')
                    return
                  }
                  if (!form.acceptCgv) {
                    setError('Vous devez accepter la politique de confidentialité pour continuer')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                className="w-full bg-[#0a4a2f] text-white font-bold py-4 rounded-xl hover:bg-green-900 transition"
              >
                Continuer →
              </button>
            </div>
          )}

          {/* ===== ÉTAPE 2 — PRODUCTEUR ===== */}
          {step === 2 && form.role === 'producteur' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🌾</span>
                <h2 className="font-bold text-lg">Votre activité agricole</h2>
              </div>

              {getRegions().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre région</label>
                  <select
                    value={form.region}
                    onChange={e => setForm({ ...form, region: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                  >
                    <option value="">— Choisir —</option>
                    {getRegions().map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ce que vous cultivez (max 5)</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUITS_AGRICOLES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleItem('produits', p)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        form.produits.includes(p)
                          ? 'bg-[#0a4a2f] text-white border-[#0a4a2f]'
                          : 'border-gray-300 text-gray-700 hover:border-[#0a4a2f]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Volume mensuel disponible</label>
                <select
                  value={form.volume_mensuel}
                  onChange={e => setForm({ ...form, volume_mensuel: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  <option>Moins de 500 kg</option>
                  <option>500 kg à 2 tonnes</option>
                  <option>2 à 10 tonnes</option>
                  <option>Plus de 10 tonnes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Surface cultivée</label>
                <select
                  value={form.surface_hectares}
                  onChange={e => setForm({ ...form, surface_hectares: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  <option>Moins de 1 hectare</option>
                  <option>1 à 5 hectares</option>
                  <option>5 à 20 hectares</option>
                  <option>Plus de 20 hectares</option>
                </select>
              </div>

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition">
                  ← Retour
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 2 — ACHETEUR ===== */}
          {step === 2 && form.role === 'acheteur' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛒</span>
                <h2 className="font-bold text-lg">Vos besoins d'achat</h2>
              </div>

              {getRegions().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre région</label>
                  <select
                    value={form.region}
                    onChange={e => setForm({ ...form, region: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                  >
                    <option value="">— Choisir —</option>
                    {getRegions().map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produits recherchés (max 5)</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUITS_AGRICOLES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleItem('produits_recherches', p)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        form.produits_recherches.includes(p)
                          ? 'bg-[#0a4a2f] text-white border-[#0a4a2f]'
                          : 'border-gray-300 text-gray-700 hover:border-[#0a4a2f]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité mensuelle</label>
                <select
                  value={form.quantite_mensuelle}
                  onChange={e => setForm({ ...form, quantite_mensuelle: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  <option>Moins de 1 tonne</option>
                  <option>1 à 5 tonnes</option>
                  <option>5 à 20 tonnes</option>
                  <option>Plus de 20 tonnes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fréquence d'achat</label>
                <select
                  value={form.frequence_achat}
                  onChange={e => setForm({ ...form, frequence_achat: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  <option>Chaque semaine</option>
                  <option>Chaque mois</option>
                  <option>Chaque saison</option>
                  <option>Occasionnellement</option>
                </select>
              </div>

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition">
                  ← Retour
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 2 — TRANSFORMATEUR ===== */}
          {step === 2 && form.role === 'transformateur' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🏭</span>
                <h2 className="font-bold text-lg">Votre activité de transformation</h2>
              </div>

              {getRegions().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre région</label>
                  <select
                    value={form.region}
                    onChange={e => setForm({ ...form, region: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                  >
                    <option value="">— Choisir —</option>
                    {getRegions().map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Produits transformés (max 5)</label>
                <div className="flex flex-wrap gap-2">
                  {PRODUITS_AGRICOLES.map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleItem('produits_transformes', p)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition ${
                        form.produits_transformes.includes(p)
                          ? 'bg-[#0a4a2f] text-white border-[#0a4a2f]'
                          : 'border-gray-300 text-gray-700 hover:border-[#0a4a2f]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacité mensuelle</label>
                <select
                  value={form.capacite_transformation}
                  onChange={e => setForm({ ...form, capacite_transformation: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  <option>Artisanale (moins de 500 kg)</option>
                  <option>Semi-industrielle (500 kg à 5 tonnes)</option>
                  <option>Industrielle (plus de 5 tonnes)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produits finis vendus</label>
                <input
                  value={form.produits_finis}
                  onChange={e => setForm({ ...form, produits_finis: e.target.value })}
                  placeholder="Ex: Farine de mil, huile d'arachide..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                />
              </div>

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition">
                  ← Retour
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </div>
          )}

          {/* ===== ÉTAPE 2 — TRANSPORTEUR ===== */}
          {step === 2 && form.role === 'transporteur' && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🚛</span>
                <h2 className="font-bold text-lg">Votre service de transport</h2>
              </div>

              {getRegions().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre région de départ</label>
                  <select
                    value={form.region}
                    onChange={e => setForm({ ...form, region: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                  >
                    <option value="">— Choisir —</option>
                    {getRegions().map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de véhicule</label>
                <select
                  value={form.type_vehicule}
                  onChange={e => setForm({ ...form, type_vehicule: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  {VEHICULES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zones desservies</label>
                <div className="space-y-2">
                  {ZONES.map(z => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggleItem('zones_desservies', z)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition text-left ${
                        form.zones_desservies.includes(z)
                          ? 'bg-[#0a4a2f] text-white border-[#0a4a2f]'
                          : 'border-gray-200 hover:border-[#0a4a2f]'
                      }`}
                    >
                      <span>{z.includes('Local') ? '📍' : z.includes('Régional') ? '🗺️' : '🌍'}</span>
                      <span className="text-sm font-medium">{z}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                <select
                  value={form.disponibilite}
                  onChange={e => setForm({ ...form, disponibilite: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  <option>Temps plein</option>
                  <option>Temps partiel</option>
                  <option>Sur demande</option>
                </select>
              </div>

              {error && <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition">
                  ← Retour
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
                >
                  {loading ? 'Création...' : 'Créer mon compte'}
                </button>
              </div>
            </div>
          )}

        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#0a4a2f] font-semibold hover:underline">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  )
}
