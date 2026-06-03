'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Clock, AlertCircle, ChevronRight, Copy, Check } from 'lucide-react'
import { supabase, formatPrice, Product } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type PaymentMethod = {
  id: string
  code: string
  nom: string
  logo: string
  pays: string[]
  instructions: string
  numero_marchand: string
}

type Step = 'choix' | 'quantite' | 'methode' | 'instruction' | 'confirmation' | 'succes'

function PaiementContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, profile } = useAuth()

  const productId = searchParams.get('product')
  const [product, setProduct] = useState<Product | null>(null)
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [step, setStep] = useState<Step>('choix')

  const [quantite, setQuantite] = useState(1)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [telephone, setTelephone] = useState(profile?.telephone || '')
  const [reference, setReference] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [transactionId, setTransactionId] = useState('')

  useEffect(() => {
    if (!user) router.push('/login')
    if (!productId) router.push('/')

    supabase.from('products').select('*, profiles(*), categories(*)').eq('id', productId!).single()
      .then(({ data }) => setProduct(data))

    supabase.from('payment_methods').select('*').eq('actif', true)
      .then(({ data }) => setMethods(data || []))
  }, [productId, user])

  useEffect(() => {
    if (profile?.telephone) setTelephone(profile.telephone)
  }, [profile])

  const montantTotal = product ? product.prix * quantite : 0
  const commission = Math.round(montantTotal * 0.05)
  const montantNet = montantTotal - commission

  const refInterne = `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

  const filteredMethods = methods.filter(m =>
    !profile?.pays || m.pays.includes(profile.pays)
  )

  const copyRef = () => {
    navigator.clipboard.writeText(refInterne)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getInstructions = (method: PaymentMethod) =>
    method.instructions.replace('{ref}', refInterne)

  const confirmerPaiement = async () => {
    if (!user || !product || !selectedMethod) return
    setLoading(true)

    const { data, error } = await supabase.from('transactions').insert({
      buyer_id: user.id,
      seller_id: product.user_id,
      product_id: product.id,
      montant: montantTotal,
      devise: product.devise,
      commission,
      montant_net: montantNet,
      methode: selectedMethod.code,
      telephone_paiement: telephone,
      reference_interne: refInterne,
      statut: 'en_cours',
      quantite,
      unite: product.unite,
    }).select().single()

    setLoading(false)
    if (data) {
      setTransactionId(data.id)
      setStep('succes')
    }
  }

  if (!product) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin w-8 h-8 border-4 border-[#0a4a2f] border-t-transparent rounded-full" />
    </div>
  )

  const steps: Step[] = ['choix', 'quantite', 'methode', 'instruction', 'confirmation']
  const stepIdx = steps.indexOf(step)

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">💳 Paiement sécurisé</h1>
        <p className="text-gray-500 text-sm mt-1">{product.titre}</p>
      </div>

      {/* Progress bar */}
      {step !== 'succes' && (
        <div className="flex gap-1 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all ${i <= stepIdx ? 'bg-[#0a4a2f]' : 'bg-gray-200'}`}
            />
          ))}
        </div>
      )}

      {/* ========= STEP 1: Récapitulatif ========= */}
      {step === 'choix' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Récapitulatif</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-50 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
                {product.categories?.icone || '🌾'}
              </div>
              <div>
                <p className="font-semibold">{product.titre}</p>
                <p className="text-sm text-gray-500">Vendeur : {product.profiles?.nom}</p>
                <p className="text-[#0a4a2f] font-bold">{formatPrice(product.prix, product.devise)}/{product.unite}</p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <p className="font-medium mb-1">ℹ️ Comment ça fonctionne</p>
            <p>1. Choisissez votre quantité et méthode de paiement</p>
            <p>2. Effectuez le virement Mobile Money</p>
            <p>3. Le vendeur est notifié et prépare votre commande</p>
          </div>

          <button
            onClick={() => setStep('quantite')}
            className="w-full bg-[#0a4a2f] text-white font-bold py-4 rounded-xl hover:bg-green-900 transition flex items-center justify-center gap-2"
          >
            Commander maintenant <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* ========= STEP 2: Quantité ========= */}
      {step === 'quantite' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-5">Quelle quantité ?</h2>

            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setQuantite(Math.max(1, quantite - 1))}
                className="w-12 h-12 bg-gray-100 rounded-full text-2xl font-bold hover:bg-gray-200 transition"
              >−</button>
              <div className="text-center">
                <span className="text-4xl font-bold text-[#0a4a2f]">{quantite}</span>
                <p className="text-gray-500 text-sm">{product.unite}</p>
              </div>
              <button
                onClick={() => setQuantite(Math.min(product.quantite || 9999, quantite + 1))}
                className="w-12 h-12 bg-[#0a4a2f] text-white rounded-full text-2xl font-bold hover:bg-green-900 transition"
              >+</button>
            </div>

            {product.quantite && (
              <p className="text-center text-sm text-gray-500 mb-4">
                Disponible : {product.quantite} {product.unite}
              </p>
            )}

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Prix unitaire</span>
                <span className="font-medium">{formatPrice(product.prix, product.devise)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantité</span>
                <span className="font-medium">{quantite} {product.unite}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-600">Sous-total</span>
                <span className="font-bold">{formatPrice(montantTotal, product.devise)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Commission plateforme (5%)</span>
                <span>{formatPrice(commission, product.devise)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('choix')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">
              Retour
            </button>
            <button onClick={() => setStep('methode')} className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition">
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ========= STEP 3: Méthode de paiement ========= */}
      {step === 'methode' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-4">Choisissez votre paiement</h2>

            <div className="space-y-3">
              {(filteredMethods.length > 0 ? filteredMethods : methods).map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                    selectedMethod?.id === m.id
                      ? 'border-[#0a4a2f] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{m.logo}</span>
                  <div className="text-left flex-1">
                    <p className="font-semibold">{m.nom}</p>
                    <p className="text-xs text-gray-500">{m.pays.join(', ')}</p>
                  </div>
                  {selectedMethod?.id === m.id && (
                    <div className="w-5 h-5 bg-[#0a4a2f] rounded-full flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre numéro Mobile Money
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={e => setTelephone(e.target.value)}
                placeholder="+221 77 000 00 00"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('quantite')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">
              Retour
            </button>
            <button
              onClick={() => selectedMethod && setStep('instruction')}
              disabled={!selectedMethod || !telephone}
              className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-40"
            >
              Continuer
            </button>
          </div>
        </div>
      )}

      {/* ========= STEP 4: Instructions paiement ========= */}
      {step === 'instruction' && selectedMethod && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="text-center mb-6">
              <span className="text-5xl block mb-2">{selectedMethod.logo}</span>
              <h2 className="font-bold text-xl">{selectedMethod.nom}</h2>
              <p className="text-3xl font-bold text-[#0a4a2f] mt-2">
                {formatPrice(montantTotal, product.devise)}
              </p>
            </div>

            {/* Référence */}
            <div className="bg-[#0a4a2f]/5 border border-[#0a4a2f]/20 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-600 mb-1">Référence de paiement (obligatoire)</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-lg text-[#0a4a2f]">{refInterne}</span>
                <button
                  onClick={copyRef}
                  className="flex items-center gap-1 text-xs bg-[#0a4a2f] text-white px-3 py-1.5 rounded-lg"
                >
                  {copied ? <><Check size={12} /> Copié</> : <><Copy size={12} /> Copier</>}
                </button>
              </div>
            </div>

            {/* Numéro marchand */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-600 mb-1">Numéro à utiliser pour le virement</p>
              <p className="font-bold text-xl">{selectedMethod.numero_marchand}</p>
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Instructions :</p>
              {getInstructions(selectedMethod).split('\n').map((line, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="w-5 h-5 bg-[#0a4a2f] text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            ⚠️ Mentionnez impérativement la référence <strong>{refInterne}</strong> dans votre virement
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('methode')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">
              Retour
            </button>
            <button onClick={() => setStep('confirmation')} className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition">
              J'ai payé ✓
            </button>
          </div>
        </div>
      )}

      {/* ========= STEP 5: Confirmation ========= */}
      {step === 'confirmation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-5">Confirmez votre paiement</h2>

            <div className="space-y-3 text-sm mb-6">
              {[
                ['Produit', product.titre],
                ['Quantité', `${quantite} ${product.unite}`],
                ['Montant', formatPrice(montantTotal, product.devise)],
                ['Méthode', selectedMethod?.nom || ''],
                ['Votre numéro', telephone],
                ['Référence', refInterne],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-right max-w-40 truncate">{val}</span>
                </div>
              ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              ✅ En confirmant, vous attestez avoir effectué le virement de{' '}
              <strong>{formatPrice(montantTotal, product.devise)}</strong> via{' '}
              <strong>{selectedMethod?.nom}</strong>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('instruction')} className="flex-1 border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50">
              Retour
            </button>
            <button
              onClick={confirmerPaiement}
              disabled={loading}
              className="flex-1 bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
            >
              {loading ? 'Envoi...' : 'Confirmer le paiement'}
            </button>
          </div>
        </div>
      )}

      {/* ========= SUCCES ========= */}
      {step === 'succes' && (
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Commande enregistrée !</h2>
          <p className="text-gray-600 mb-2">Votre paiement est en cours de vérification.</p>
          <p className="text-sm text-gray-500 mb-6">
            Le vendeur sera notifié et vous contactera sous 24h.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm">
            <p className="text-gray-500">Référence de votre commande</p>
            <p className="font-mono font-bold text-lg text-[#0a4a2f]">{refInterne}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition"
            >
              Voir mes commandes
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaiementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-[#0a4a2f] border-t-transparent rounded-full" /></div>}>
      <PaiementContent />
    </Suspense>
  )
}
