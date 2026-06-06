'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Eye, Clock, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Annonce = {
  id: string
  titre: string
  prix: number
  devise: string
  quantite?: number
  unite?: string
  ville?: string
  pays?: string
  images?: string[]
  disponible?: boolean
  vues?: number
  created_at: string
  expires_at?: string
  categories?: { nom_fr: string; icone: string }
}

function getStatut(annonce: Annonce): 'active' | 'expire-bientot' | 'expiree' | 'inconnue' {
  if (!annonce.expires_at) return 'inconnue'
  const now = new Date()
  const exp = new Date(annonce.expires_at)
  const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expiree'
  if (diffDays <= 7) return 'expire-bientot'
  return 'active'
}

function StatutBadge({ annonce }: { annonce: Annonce }) {
  const s = getStatut(annonce)
  if (s === 'active') return (
    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
      <CheckCircle size={11} /> Active
    </span>
  )
  if (s === 'expire-bientot') return (
    <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
      <AlertTriangle size={11} /> Expire bientôt
    </span>
  )
  if (s === 'expiree') return (
    <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
      <XCircle size={11} /> Expirée
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
      <Clock size={11} /> Sans limite
    </span>
  )
}

function joursRestants(expires_at: string): string {
  const diff = Math.ceil((new Date(expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return `Expirée il y a ${Math.abs(diff)} jour${Math.abs(diff) > 1 ? 's' : ''}`
  if (diff === 0) return 'Expire aujourd\'hui'
  if (diff === 1) return 'Expire demain'
  return `Valide encore ${diff} jours`
}

export default function MesAnnoncesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [renewing, setRenewing] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchAnnonces()
  }, [user])

  const fetchAnnonces = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, categories(nom_fr, icone)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    setAnnonces(data || [])
    setLoading(false)
  }

  const deleteAnnonce = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    setDeleting(id)
    await supabase.from('products').delete().eq('id', id)
    setAnnonces(prev => prev.filter(a => a.id !== id))
    setDeleting(null)
  }

  const renewAnnonce = async (id: string) => {
    setRenewing(id)
    const newExpiry = new Date()
    newExpiry.setMonth(newExpiry.getMonth() + 1)
    const { error } = await supabase
      .from('products')
      .update({ expires_at: newExpiry.toISOString(), disponible: true })
      .eq('id', id)
    if (!error) {
      setAnnonces(prev => prev.map(a =>
        a.id === id ? { ...a, expires_at: newExpiry.toISOString(), disponible: true } : a
      ))
    }
    setRenewing(null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const formatExpiry = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const actives = annonces.filter(a => getStatut(a) !== 'expiree')
  const expirees = annonces.filter(a => getStatut(a) === 'expiree')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📢 Mes annonces</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {annonces.length} annonce{annonces.length > 1 ? 's' : ''} · validité 1 mois
          </p>
        </div>
        <Link
          href="/vendre"
          className="flex items-center gap-2 bg-[#0a4a2f] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-900 transition"
        >
          <Plus size={16} /> Nouvelle annonce
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-28 animate-pulse border border-gray-100" />
          ))}
        </div>
      ) : annonces.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-medium text-gray-600">Aucune annonce publiée</p>
          <p className="text-sm mt-1 mb-6">Publiez votre première annonce pour vendre vos produits</p>
          <Link href="/vendre" className="bg-[#0a4a2f] text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-green-900 transition">
            Publier une annonce →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Annonces actives */}
          {actives.length > 0 && (
            <div className="space-y-3">
              {actives.map(a => (
                <AnnonceCard
                  key={a.id}
                  annonce={a}
                  onDelete={deleteAnnonce}
                  onRenew={renewAnnonce}
                  deleting={deleting}
                  renewing={renewing}
                  formatDate={formatDate}
                  formatExpiry={formatExpiry}
                />
              ))}
            </div>
          )}

          {/* Annonces expirées */}
          {expirees.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-6">
                Annonces expirées
              </p>
              <div className="space-y-3 opacity-70">
                {expirees.map(a => (
                  <AnnonceCard
                    key={a.id}
                    annonce={a}
                    onDelete={deleteAnnonce}
                    onRenew={renewAnnonce}
                    deleting={deleting}
                    renewing={renewing}
                    formatDate={formatDate}
                    formatExpiry={formatExpiry}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AnnonceCard({ annonce, onDelete, onRenew, deleting, renewing, formatDate, formatExpiry }: {
  annonce: Annonce
  onDelete: (id: string) => void
  onRenew: (id: string) => void
  deleting: string | null
  renewing: string | null
  formatDate: (d: string) => string
  formatExpiry: (d: string) => string
}) {
  const statut = getStatut(annonce)
  const isExpired = statut === 'expiree'

  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm transition ${isExpired ? 'border-red-100' : 'border-gray-100'}`}>
      <div className="flex gap-3">
        {/* Image ou icône */}
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
          {annonce.images?.[0] ? (
            <img src={annonce.images[0]} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-2xl">{(annonce.categories as any)?.icone || '📦'}</span>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 truncate text-sm">{annonce.titre}</h3>
            <StatutBadge annonce={annonce} />
          </div>

          <p className="text-[#0a4a2f] font-bold text-sm mt-0.5">
            {annonce.prix.toLocaleString('fr-FR')} {annonce.devise}
            {annonce.quantite && <span className="font-normal text-gray-400"> · {annonce.quantite} {annonce.unite}</span>}
          </p>

          {annonce.categories && (
            <p className="text-xs text-gray-400 mt-0.5">
              {(annonce.categories as any).icone} {(annonce.categories as any).nom_fr}
              {annonce.ville && ` · 📍 ${annonce.ville}`}
            </p>
          )}

          {/* Dates */}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={11} /> Publiée le {formatDate(annonce.created_at)}
            </span>
            {annonce.expires_at && (
              <span className={`flex items-center gap-1 font-medium ${isExpired ? 'text-red-500' : statut === 'expire-bientot' ? 'text-amber-600' : 'text-gray-400'}`}>
                📅 {joursRestants(annonce.expires_at)}
                <span className="font-normal text-gray-400">({formatExpiry(annonce.expires_at)})</span>
              </span>
            )}
            {annonce.vues !== undefined && (
              <span className="flex items-center gap-1">
                <Eye size={11} /> {annonce.vues} vue{annonce.vues > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
        <Link
          href={`/produits/${annonce.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
        >
          <Eye size={13} /> Voir
        </Link>

        {isExpired && (
          <button
            onClick={() => onRenew(annonce.id)}
            disabled={renewing === annonce.id}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 bg-green-50 border border-green-200 rounded-xl text-[#0a4a2f] hover:bg-green-100 transition disabled:opacity-50 font-medium"
          >
            <RefreshCw size={13} className={renewing === annonce.id ? 'animate-spin' : ''} />
            {renewing === annonce.id ? 'Renouvellement...' : 'Renouveler 1 mois'}
          </button>
        )}

        <button
          onClick={() => onDelete(annonce.id)}
          disabled={deleting === annonce.id}
          className="flex items-center justify-center gap-1.5 text-xs py-2 px-3 border border-red-100 rounded-xl text-red-500 hover:bg-red-50 transition disabled:opacity-50"
        >
          <Trash2 size={13} />
          {deleting === annonce.id ? '...' : 'Supprimer'}
        </button>
      </div>
    </div>
  )
}
