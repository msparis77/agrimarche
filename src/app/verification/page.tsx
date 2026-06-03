'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, CheckCircle, Clock, XCircle, AlertCircle, BadgeCheck, ChevronRight, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type VerifStatus = 'none' | 'en_attente' | 'en_cours_examen' | 'approuve' | 'rejete' | 'info_manquante'
type DocType = 'CNI' | 'Passeport' | 'Registre_commerce' | 'Carte_agriculteur'
type Step = 'statut' | 'doc_type' | 'upload' | 'infos' | 'recapitulatif' | 'envoye'

const DOC_LABELS: Record<DocType, string> = {
  CNI: "🪪 Carte Nationale d'Identité",
  Passeport: "📘 Passeport",
  Registre_commerce: "📋 Registre de Commerce",
  Carte_agriculteur: "🌾 Carte d'Agriculteur",
}

const ACTIVITES = [
  'Producteur céréales', 'Producteur légumes', 'Producteur fruits', 'Éleveur',
  'Grossiste agricole', 'Importateur/Exportateur', 'Transformateur', 'Autre'
]

export default function VerificationPage() {
  const { user, profile } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState<Step>('statut')
  const [status, setStatus] = useState<VerifStatus>('none')
  const [existing, setExisting] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [docType, setDocType] = useState<DocType>('CNI')
  const [rectoFile, setRectoFile] = useState<File | null>(null)
  const [versoFile, setVersoFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [rectoPreview, setRectoPreview] = useState('')
  const [versoPreview, setVersoPreview] = useState('')
  const [selfiePreview, setSelfiePreview] = useState('')

  const [form, setForm] = useState({
    nom_complet: profile?.nom || '',
    date_naissance: '',
    adresse: '',
    activite: '',
    annees_experience: '',
  })

  useEffect(() => {
    if (!user) { router.push('/login'); return }

    supabase.from('vendor_verifications').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setExisting(data)
          setStatus(data.statut)
        }
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    if (profile?.nom) setForm(f => ({ ...f, nom_complet: profile?.nom || '' }))
  }, [profile])

  const handleFile = (
    file: File,
    setter: (f: File) => void,
    previewSetter: (s: string) => void
  ) => {
    setter(file)
    previewSetter(URL.createObjectURL(file))
  }

  const uploadFile = async (file: File, path: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('verifications')
      .upload(path, file, { upsert: true })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('verifications').getPublicUrl(path)
    return publicUrl
  }

  const handleSubmit = async () => {
    if (!user || !rectoFile) return
    setSubmitting(true)

    const basePath = `${user.id}/${Date.now()}`
    const rectoUrl = await uploadFile(rectoFile, `${basePath}_recto`)
    const versoUrl = versoFile ? await uploadFile(versoFile, `${basePath}_verso`) : null
    const selfieUrl = selfieFile ? await uploadFile(selfieFile, `${basePath}_selfie`) : null

    const payload = {
      user_id: user.id,
      type_doc: docType,
      doc_recto_url: rectoUrl,
      doc_verso_url: versoUrl,
      selfie_url: selfieUrl,
      nom_complet: form.nom_complet,
      date_naissance: form.date_naissance || null,
      adresse: form.adresse,
      activite: form.activite,
      annees_experience: form.annees_experience ? Number(form.annees_experience) : null,
      statut: 'en_attente',
    }

    const { error } = existing
      ? await supabase.from('vendor_verifications').update(payload).eq('user_id', user.id)
      : await supabase.from('vendor_verifications').insert(payload)

    setSubmitting(false)
    if (!error) setStep('envoye')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-[#0a4a2f] border-t-transparent rounded-full" />
    </div>
  )

  const StatusBadge = () => {
    const configs: Record<VerifStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
      none: { icon: <AlertCircle size={20} />, label: 'Non soumis', color: 'text-gray-600', bg: 'bg-gray-100' },
      en_attente: { icon: <Clock size={20} />, label: 'En attente d\'examen', color: 'text-amber-700', bg: 'bg-amber-100' },
      en_cours_examen: { icon: <Clock size={20} />, label: 'En cours d\'examen', color: 'text-blue-700', bg: 'bg-blue-100' },
      approuve: { icon: <CheckCircle size={20} />, label: 'Approuvé ✅', color: 'text-green-700', bg: 'bg-green-100' },
      rejete: { icon: <XCircle size={20} />, label: 'Rejeté', color: 'text-red-700', bg: 'bg-red-100' },
      info_manquante: { icon: <AlertCircle size={20} />, label: 'Information manquante', color: 'text-orange-700', bg: 'bg-orange-100' },
    }
    const c = configs[status]
    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${c.bg} ${c.color} font-medium text-sm w-fit`}>
        {c.icon} {c.label}
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">🔐 Vérification vendeur</h1>
      <p className="text-gray-500 text-sm mb-8">
        Faites vérifier votre identité pour obtenir le badge de vendeur certifié
      </p>

      {/* ========= STATUT ========= */}
      {step === 'statut' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold">Statut de vérification</h2>
              <StatusBadge />
            </div>

            {status === 'approuve' && (
              <div className="text-center py-6">
                <BadgeCheck size={64} className="text-blue-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg text-gray-900">Vous êtes certifié !</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Votre badge <BadgeCheck size={14} className="inline text-blue-500" /> est affiché sur votre profil et vos annonces
                </p>
              </div>
            )}

            {status === 'rejete' && existing?.note_admin && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800 mb-4">
                <p className="font-medium mb-1">Motif de rejet :</p>
                <p>{existing.note_admin}</p>
              </div>
            )}

            {status === 'info_manquante' && existing?.note_admin && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-800 mb-4">
                <p className="font-medium mb-1">Information demandée :</p>
                <p>{existing.note_admin}</p>
              </div>
            )}

            {status === 'en_attente' && (
              <div className="text-center py-4 text-gray-500">
                <Clock size={40} className="mx-auto mb-2 text-amber-400" />
                <p className="text-sm">Délai d'examen : <strong>24 à 48h</strong></p>
                <p className="text-xs mt-1 text-gray-400">Vous serez notifié par email</p>
              </div>
            )}
          </div>

          {/* Avantages */}
          <div className="bg-gradient-to-br from-[#0a4a2f] to-[#1a7a4f] rounded-2xl p-6 text-white">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BadgeCheck size={20} className="text-[#f5c842]" />
              Avantages du badge certifié
            </h3>
            <ul className="space-y-2 text-sm text-green-100">
              {[
                'Badge bleu ✅ sur votre profil et vos annonces',
                'Meilleur classement dans les résultats de recherche',
                'Accès aux annonces sponsorisées',
                'Accès au paiement sécurisé intégré',
                'Plus de confiance des acheteurs',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-[#f5c842]">•</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {(status === 'none' || status === 'rejete' || status === 'info_manquante') && (
            <button
              onClick={() => setStep('doc_type')}
              className="w-full bg-[#0a4a2f] text-white font-bold py-4 rounded-xl hover:bg-green-900 transition flex items-center justify-center gap-2"
            >
              {status === 'none' ? 'Commencer la vérification' : 'Soumettre à nouveau'}
              <ChevronRight size={18} />
            </button>
          )}
        </div>
      )}

      {/* ========= DOC TYPE ========= */}
      {step === 'doc_type' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Quel document souhaitez-vous soumettre ?</h2>
            <div className="space-y-3">
              {(Object.keys(DOC_LABELS) as DocType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setDocType(type)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition text-left ${
                    docType === type ? 'border-[#0a4a2f] bg-green-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{DOC_LABELS[type].split(' ')[0]}</span>
                  <span className="font-medium">{DOC_LABELS[type].substring(2)}</span>
                  {docType === type && <CheckCircle size={18} className="ml-auto text-[#0a4a2f]" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('statut')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">Retour</button>
            <button onClick={() => setStep('upload')} className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900">Continuer</button>
          </div>
        </div>
      )}

      {/* ========= UPLOAD DOCUMENTS ========= */}
      {step === 'upload' && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-1">Photos de votre {DOC_LABELS[docType].substring(2)}</h2>
            <p className="text-sm text-gray-500 mb-5">Photos nettes et lisibles. Max 5 MB par photo.</p>

            {/* Recto */}
            <UploadZone
              label="Photo recto (face) *"
              preview={rectoPreview}
              onFile={f => handleFile(f, setRectoFile, setRectoPreview)}
              onClear={() => { setRectoFile(null); setRectoPreview('') }}
            />

            {/* Verso */}
            {docType !== 'Carte_agriculteur' && (
              <UploadZone
                label="Photo verso (dos)"
                preview={versoPreview}
                onFile={f => handleFile(f, setVersoFile, setVersoPreview)}
                onClear={() => { setVersoFile(null); setVersoPreview('') }}
              />
            )}

            {/* Selfie */}
            <UploadZone
              label="Selfie avec le document"
              sublabel="Tenez votre document à côté de votre visage"
              preview={selfiePreview}
              onFile={f => handleFile(f, setSelfieFile, setSelfiePreview)}
              onClear={() => { setSelfieFile(null); setSelfiePreview('') }}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 mt-4">
              🔒 Vos documents sont chiffrés et utilisés uniquement pour la vérification. Ils ne seront jamais partagés.
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('doc_type')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">Retour</button>
            <button
              onClick={() => setStep('infos')}
              disabled={!rectoFile}
              className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 disabled:opacity-40"
            >Continuer</button>
          </div>
        </div>
      )}

      {/* ========= INFOS VENDEUR ========= */}
      {step === 'infos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Vos informations</h2>
            <div className="space-y-4">
              <Field label="Nom complet *" value={form.nom_complet}
                onChange={v => setForm({ ...form, nom_complet: v })} placeholder="Mamadou Diallo" />
              <Field label="Date de naissance" value={form.date_naissance} type="date"
                onChange={v => setForm({ ...form, date_naissance: v })} />
              <Field label="Adresse" value={form.adresse}
                onChange={v => setForm({ ...form, adresse: v })} placeholder="Dakar, Sénégal" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Activité principale</label>
                <select
                  value={form.activite}
                  onChange={e => setForm({ ...form, activite: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                >
                  <option value="">— Choisir —</option>
                  {ACTIVITES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <Field label="Années d'expérience" value={form.annees_experience} type="number"
                onChange={v => setForm({ ...form, annees_experience: v })} placeholder="5" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">Retour</button>
            <button
              onClick={() => setStep('recapitulatif')}
              disabled={!form.nom_complet}
              className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 disabled:opacity-40"
            >Continuer</button>
          </div>
        </div>
      )}

      {/* ========= RÉCAPITULATIF ========= */}
      {step === 'recapitulatif' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Vérifiez avant d'envoyer</h2>

            <div className="space-y-2 text-sm mb-5">
              {[
                ['Document', DOC_LABELS[docType]],
                ['Nom', form.nom_complet],
                ['Adresse', form.adresse || '—'],
                ['Activité', form.activite || '—'],
                ['Expérience', form.annees_experience ? `${form.annees_experience} ans` : '—'],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {rectoPreview && <img src={rectoPreview} className="h-20 w-auto rounded-lg border" alt="recto" />}
              {versoPreview && <img src={versoPreview} className="h-20 w-auto rounded-lg border" alt="verso" />}
              {selfiePreview && <img src={selfiePreview} className="h-20 w-auto rounded-lg border" alt="selfie" />}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            En soumettant, vous certifiez que les informations sont exactes et que les documents appartiennent à votre identité.
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('infos')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">Retour</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 disabled:opacity-50"
            >
              {submitting ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </div>
        </div>
      )}

      {/* ========= ENVOYÉ ========= */}
      {step === 'envoye' && (
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-gray-600 mb-2">Votre dossier est en cours d'examen.</p>
          <p className="text-sm text-gray-500 mb-8">Délai : <strong>24 à 48 heures</strong>. Vous recevrez un email de confirmation.</p>
          <button onClick={() => router.push('/dashboard')} className="w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900">
            Retour au tableau de bord
          </button>
        </div>
      )}
    </div>
  )
}

// ===== Sub-components =====

function UploadZone({ label, sublabel, preview, onFile, onClear }: {
  label: string
  sublabel?: string
  preview: string
  onFile: (f: File) => void
  onClear: () => void
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {sublabel && <p className="text-xs text-gray-400 mb-2">{sublabel}</p>}
      {preview ? (
        <div className="relative">
          <img src={preview} className="w-full h-40 object-cover rounded-xl border border-gray-200" alt="preview" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-red-600"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 cursor-pointer hover:border-[#0a4a2f] transition bg-gray-50">
          <Upload size={24} className="text-gray-400" />
          <span className="text-sm text-gray-500">Cliquez pour ajouter une photo</span>
          <span className="text-xs text-gray-400">JPG, PNG · Max 5 MB</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
      />
    </div>
  )
}
