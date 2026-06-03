'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BadgeCheck, XCircle, Clock, Eye, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase, formatPrice } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Tab = 'verifications' | 'transactions'

export default function AdminPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('verifications')
  const [verifs, setVerifs] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVerif, setSelectedVerif] = useState<any>(null)
  const [noteAdmin, setNoteAdmin] = useState('')

  useEffect(() => {
    if (!profile) return
    if (profile.role !== 'admin') { router.push('/'); return }
    fetchAll()
  }, [profile])

  const fetchAll = async () => {
    const [{ data: v }, { data: t }] = await Promise.all([
      supabase.from('vendor_verifications')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false }),
      supabase.from('transactions')
        .select('*, buyer:buyer_id(*), seller:seller_id(*), products(*)')
        .order('created_at', { ascending: false })
    ])
    setVerifs(v || [])
    setTransactions(t || [])
    setLoading(false)
  }

  const updateVerif = async (id: string, statut: string) => {
    await supabase.from('vendor_verifications').update({
      statut,
      note_admin: noteAdmin,
      examine_par: user?.id,
      examine_le: new Date().toISOString(),
    }).eq('id', id)

    // Si approuvé, mettre à jour le profil vendeur
    if (statut === 'approuve' && selectedVerif) {
      await supabase.from('profiles').update({ verifie: true }).eq('id', selectedVerif.user_id)
    }
    if (statut === 'rejete' && selectedVerif) {
      await supabase.from('profiles').update({ verifie: false }).eq('id', selectedVerif.user_id)
    }

    setSelectedVerif(null)
    setNoteAdmin('')
    fetchAll()
  }

  const updateTransaction = async (id: string, statut: string) => {
    await supabase.from('transactions').update({
      statut,
      ...(statut === 'confirme' ? { confirmed_at: new Date().toISOString() } : {})
    }).eq('id', id)
    fetchAll()
  }

  const verifStats = {
    total: verifs.length,
    en_attente: verifs.filter(v => v.statut === 'en_attente').length,
    approuve: verifs.filter(v => v.statut === 'approuve').length,
    rejete: verifs.filter(v => v.statut === 'rejete').length,
  }

  const txStats = {
    total: transactions.length,
    confirme: transactions.filter(t => t.statut === 'confirme').length,
    en_cours: transactions.filter(t => t.statut === 'en_cours').length,
    volume: transactions.filter(t => t.statut === 'confirme').reduce((s, t) => s + t.montant, 0),
  }

  const StatusTag = ({ statut }: { statut: string }) => {
    const map: Record<string, string> = {
      en_attente: 'bg-amber-100 text-amber-700',
      en_cours: 'bg-blue-100 text-blue-700',
      en_cours_examen: 'bg-blue-100 text-blue-700',
      approuve: 'bg-green-100 text-green-700',
      confirme: 'bg-green-100 text-green-700',
      rejete: 'bg-red-100 text-red-700',
      echoue: 'bg-red-100 text-red-700',
      info_manquante: 'bg-orange-100 text-orange-700',
    }
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${map[statut] || 'bg-gray-100 text-gray-600'}`}>
        {statut.replace(/_/g, ' ')}
      </span>
    )
  }

  if (!profile || profile.role !== 'admin') {
    return <div className="text-center py-20 text-gray-500">Accès réservé aux administrateurs</div>
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🛠 Administration</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Vérifications en attente', value: verifStats.en_attente, color: 'text-amber-600', icon: '⏳' },
          { label: 'Vendeurs certifiés', value: verifStats.approuve, color: 'text-green-600', icon: '✅' },
          { label: 'Transactions en cours', value: txStats.en_cours, color: 'text-blue-600', icon: '💳' },
          { label: 'Volume confirmé (XOF)', value: formatPrice(txStats.volume, 'XOF'), color: 'text-[#0a4a2f]', icon: '💰' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {(['verifications', 'transactions'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-white shadow-sm text-[#0a4a2f]' : 'text-gray-600'}`}
          >
            {t === 'verifications' ? '🔐 Vérifications' : '💳 Transactions'}
            {t === 'verifications' && verifStats.en_attente > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full">{verifStats.en_attente}</span>
            )}
          </button>
        ))}
      </div>

      {/* ========= VERIFICATIONS ========= */}
      {tab === 'verifications' && (
        <div className="space-y-3">
          {verifs.map(v => (
            <div key={v.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold">
                    {v.profiles?.nom?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1">
                      {v.profiles?.nom}
                      {v.profiles?.verifie && <BadgeCheck size={14} className="text-blue-500" />}
                    </p>
                    <p className="text-xs text-gray-400">{v.profiles?.email} · {v.profiles?.pays}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Doc : {v.type_doc} · {v.activite || '—'} · {v.annees_experience ? `${v.annees_experience} ans exp.` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusTag statut={v.statut} />
                  <button
                    onClick={() => setSelectedVerif(selectedVerif?.id === v.id ? null : v)}
                    className="text-gray-400 hover:text-[#0a4a2f] transition"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {/* Expanded */}
              {selectedVerif?.id === v.id && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {/* Documents */}
                  <div className="flex gap-3 mb-4">
                    {v.doc_recto_url && (
                      <a href={v.doc_recto_url} target="_blank" rel="noopener noreferrer">
                        <img src={v.doc_recto_url} className="h-28 rounded-lg border hover:opacity-90 transition" alt="recto" />
                      </a>
                    )}
                    {v.doc_verso_url && (
                      <a href={v.doc_verso_url} target="_blank" rel="noopener noreferrer">
                        <img src={v.doc_verso_url} className="h-28 rounded-lg border hover:opacity-90 transition" alt="verso" />
                      </a>
                    )}
                    {v.selfie_url && (
                      <a href={v.selfie_url} target="_blank" rel="noopener noreferrer">
                        <img src={v.selfie_url} className="h-28 rounded-lg border hover:opacity-90 transition" alt="selfie" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    {[
                      ['Nom complet', v.nom_complet],
                      ['Date naissance', v.date_naissance],
                      ['Adresse', v.adresse],
                      ['Activité', v.activite],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="font-medium">{val || '—'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Admin note */}
                  <div className="mb-3">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Note (optionnel)</label>
                    <input
                      value={noteAdmin}
                      onChange={e => setNoteAdmin(e.target.value)}
                      placeholder="Motif de rejet ou commentaire..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a4a2f]"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => updateVerif(v.id, 'approuve')}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1">
                      <CheckCircle size={16} /> Approuver
                    </button>
                    <button onClick={() => updateVerif(v.id, 'info_manquante')}
                      className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-1">
                      <AlertCircle size={16} /> Info manquante
                    </button>
                    <button onClick={() => updateVerif(v.id, 'rejete')}
                      className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-1">
                      <XCircle size={16} /> Rejeter
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {verifs.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-400">Aucune demande de vérification</div>
          )}
        </div>
      )}

      {/* ========= TRANSACTIONS ========= */}
      {tab === 'transactions' && (
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">
                    {tx.products?.titre || 'Produit supprimé'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Acheteur : {tx.buyer?.nom} → Vendeur : {tx.seller?.nom}
                  </p>
                  <p className="text-xs text-gray-400">
                    {tx.methode?.replace(/_/g, ' ')} · Réf: {tx.reference_interne} · {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#0a4a2f]">{formatPrice(tx.montant, tx.devise)}</p>
                  <StatusTag statut={tx.statut} />
                </div>
              </div>

              {tx.statut === 'en_cours' && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => updateTransaction(tx.id, 'confirme')}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-medium hover:bg-green-700">
                    ✅ Confirmer le paiement
                  </button>
                  <button onClick={() => updateTransaction(tx.id, 'echoue')}
                    className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-sm font-medium hover:bg-red-100">
                    ❌ Marquer échoué
                  </button>
                </div>
              )}
            </div>
          ))}
          {transactions.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-400">Aucune transaction</div>
          )}
        </div>
      )}
    </div>
  )
}
