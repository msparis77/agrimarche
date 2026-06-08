'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Lock, ShieldCheck, Users, Megaphone, MessageSquare, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ── PIN Lock ──────────────────────────────────────────────────────
function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim() || checking) return
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })
      if (res.ok) {
        sessionStorage.setItem('admin_unlocked', '1')
        onUnlock()
      } else {
        setError('Code incorrect')
        setPin('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Erreur réseau, réessayez')
    }
    setChecking(false)
  }

  return (
    <div className="min-h-screen bg-[#0a4a2f] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0a4a2f] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Zone Admin</h1>
          <p className="text-sm text-gray-500 mt-1">AgriMarché — Accès restreint</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="••••••••"
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center text-lg tracking-widest font-bold focus:outline-none focus:border-[#0a4a2f]"
            disabled={checking}
          />
          {error && <p className="text-red-600 text-sm text-center bg-red-50 rounded-xl py-2">{error}</p>}
          <button
            type="submit"
            disabled={checking || !pin.trim()}
            className="w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-2xl hover:bg-green-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? <><RefreshCw size={16} className="animate-spin" /> Vérification...</> : <><ShieldCheck size={16} /> Accéder</>}
          </button>
        </form>
      </div>
    </div>
  )
}

// Email autorisé à accéder à l'admin (vérifié via Supabase Auth, pas via la DB)
const ADMIN_EMAIL = 'mstreize@gmail.com'

// ── Main Admin Page ───────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'unauth' | 'notadmin' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [debugInfo, setDebugInfo] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [stats, setStats] = useState({ users: 0, listings: 0, messages: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_unlocked') === '1') {
      setUnlocked(true)
    }
    checkAuthAndLoad()
  }, [])

  useEffect(() => {
    if (status === 'unauth') {
      router.push('/login?next=/admin')
    }
  }, [status])

  const checkAuthAndLoad = async () => {
    setStatus('loading')
    setDebugInfo('Vérification...')
    try {
      // 1. Vérifier l'utilisateur via Supabase Auth (email vérifié côté serveur)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(`Auth: ${userError.message}`)
      if (!user) { setStatus('unauth'); return }
      setDebugInfo(`Connecté: ${user.email}`)

      // 2. Vérifier que c'est le bon email admin
      if (user.email !== ADMIN_EMAIL) {
        setDebugInfo(`Accès refusé: ${user.email} n'est pas admin`)
        setStatus('notadmin')
        return
      }

      // 3. Vérifier le PIN
      const alreadyUnlocked = sessionStorage.getItem('admin_unlocked') === '1'
      if (!alreadyUnlocked) { setStatus('ready'); return }

      // 4. Charger les stats
      setDebugInfo('')
      await loadStats()
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur inconnue')
      setStatus('error')
    }
  }

  const loadStats = async () => {
    setRefreshing(true)
    try {
      // Chaque requête indépendante — une erreur ne bloque pas les autres
      const [usersRes, listingsRes, messagesRes] = await Promise.allSettled([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ])

      setStats({
        users: usersRes.status === 'fulfilled' ? (usersRes.value.count ?? 0) : 0,
        listings: listingsRes.status === 'fulfilled' ? (listingsRes.value.count ?? 0) : 0,
        messages: messagesRes.status === 'fulfilled' ? (messagesRes.value.count ?? 0) : 0,
      })

      // Listes détaillées
      const [usersDetailRes, listingsDetailRes] = await Promise.allSettled([
        supabase.from('profiles').select('id, nom, email, role, pays, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('products').select('id, titre, prix, devise, ville, pays, created_at').order('created_at', { ascending: false }).limit(50),
      ])
      if (usersDetailRes.status === 'fulfilled') setUsers(usersDetailRes.value.data ?? [])
      if (listingsDetailRes.status === 'fulfilled') setListings(listingsDetailRes.value.data ?? [])

      setStatus('ready')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erreur chargement données')
      setStatus('error')
    } finally {
      setRefreshing(false)
    }
  }

  const handleUnlock = async () => {
    setUnlocked(true)
    await loadStats()
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    if (typeof window !== 'undefined') sessionStorage.removeItem('admin_unlocked')
    router.push('/')
  }

  // ── Écrans d'état ─────────────────────────────────────────────────
  if (status === 'loading') return (
    <div className="min-h-screen bg-[#0a4a2f] flex items-center justify-center">
      <div className="text-center text-white">
        <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-green-300" />
        <p className="text-green-300 text-sm">Vérification en cours...</p>
        {debugInfo && <p className="text-green-400 text-xs mt-2 font-mono">{debugInfo}</p>}
      </div>
    </div>
  )

  if (status === 'error') return (
    <div className="min-h-screen bg-[#0a4a2f] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-bold text-gray-900 text-lg mb-2">Erreur</p>
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4 font-mono break-all">{errorMsg}</p>
        <button onClick={checkAuthAndLoad} className="bg-[#0a4a2f] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-900 transition">
          Réessayer
        </button>
      </div>
    </div>
  )

  if (status === 'unauth') {
    return null // la redirection est gérée dans useEffect
  }

  if (status === 'notadmin') return (
    <div className="min-h-screen bg-[#0a4a2f] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">🚫</div>
        <p className="font-bold text-gray-900 text-lg">Accès refusé</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">Votre compte n'a pas les droits admin.</p>
        <button onClick={() => router.push('/')} className="text-sm text-[#0a4a2f] underline">Retour à l'accueil</button>
      </div>
    </div>
  )

  // PIN non validé encore (utiliser le state React, pas sessionStorage directement)
  if (!unlocked) {
    return <PinLock onUnlock={handleUnlock} />
  }

  // ── Dashboard ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#0a4a2f] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">🌾 Admin — AgriMarché</h1>
          <p className="text-green-300 text-xs mt-0.5">Tableau de bord</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadStats}
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => { sessionStorage.removeItem('admin_unlocked'); setUnlocked(false); checkAuthAndLoad() }}
            className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition"
          >
            <Lock size={14} /> Verrouiller
          </button>
          <button onClick={handleSignOut} className="bg-red-500/80 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <Users size={28} className="text-[#0a4a2f] mx-auto mb-2" />
            <div className="text-4xl font-extrabold text-[#0a4a2f]">{stats.users}</div>
            <div className="text-sm text-gray-500 mt-1 font-semibold">Utilisateurs</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <Megaphone size={28} className="text-[#f5c842] mx-auto mb-2" />
            <div className="text-4xl font-extrabold text-[#0a4a2f]">{stats.listings}</div>
            <div className="text-sm text-gray-500 mt-1 font-semibold">Annonces</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <MessageSquare size={28} className="text-blue-500 mx-auto mb-2" />
            <div className="text-4xl font-extrabold text-[#0a4a2f]">{stats.messages}</div>
            <div className="text-sm text-gray-500 mt-1 font-semibold">Messages</div>
          </div>
        </div>

        {/* Derniers utilisateurs */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={18} /> Derniers utilisateurs</h2>
            <span className="text-xs text-gray-400">{users.length} affichés</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Rôle</th>
                  <th className="px-4 py-3 text-left">Pays</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun utilisateur</td></tr>
                )}
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.nom || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'vendeur' ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>{u.role || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.pays || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dernières annonces */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><Megaphone size={18} /> Dernières annonces</h2>
            <span className="text-xs text-gray-400">{listings.length} affichées</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Titre</th>
                  <th className="px-4 py-3 text-left">Prix</th>
                  <th className="px-4 py-3 text-left">Ville</th>
                  <th className="px-4 py-3 text-left">Pays</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucune annonce</td></tr>
                )}
                {listings.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{l.titre || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{l.prix ? `${l.prix} ${l.devise || 'FCFA'}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{l.ville || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{l.pays || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{l.created_at ? new Date(l.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
