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
  const [prix, setPrix] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'prices'>('overview')
  const [prixFiltreProduit, setPrixFiltreProduit] = useState('Tous')
  const [prixFiltreSource, setPrixFiltreSource] = useState('Tous')
  const [prixFiltrePays, setPrixFiltrePays] = useState('Tous')

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
      // getSession() lit depuis localStorage — pas d'erreur "Auth session missing"
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setStatus('unauth'); return }

      const user = session.user
      setDebugInfo(`Connecté: ${user.email}`)

      if (user.email !== ADMIN_EMAIL) {
        setDebugInfo(`Accès refusé: ${user.email} n'est pas admin`)
        setStatus('notadmin')
        return
      }

      const alreadyUnlocked = sessionStorage.getItem('admin_unlocked') === '1'
      if (!alreadyUnlocked) { setStatus('ready'); return }

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

      // Prix du marché
      const prixRes = await supabase
        .from('prix_marche')
        .select('id, produit, prix, unite, ville, pays, source, created_at, vendeur')
        .order('created_at', { ascending: false })
        .limit(1000)
      if (prixRes.data) setPrix(prixRes.data)

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

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const triggerCron = async () => {
    try {
      const res = await fetch('/api/cron/fao-prices')
      const json = await res.json()
      if (!res.ok || json.ok === false) {
        alert(`❌ Erreur cron :\n${json.error || JSON.stringify(json)}`)
        return
      }
      const msg = json.message
        ? `ℹ️ ${json.message}`
        : `✅ ${json.inserted ?? 0} prix insérés\n📊 Parsés : ${json.parsed ?? '?'} | Filtrés : ${json.filtered ?? '?'}\n📅 ${json.date}`
      alert(msg)
      await loadStats()
    } catch (err: any) {
      alert(`❌ Erreur réseau : ${err.message}`)
    }
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
          <p className="text-green-300 text-xs mt-0.5">Tableau de bord · v2</p>
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

      {/* Onglets */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-1">
          {(['overview', 'prices'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold border-b-2 transition ${activeTab === tab ? 'border-[#0a4a2f] text-[#0a4a2f]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'overview' ? '📊 Vue générale' : '📈 Prix du marché'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── TAB : VUE GÉNÉRALE ── */}
        {activeTab === 'overview' && (<>
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

          {/* Utilisateurs */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Users size={18} /> Derniers utilisateurs</h2>
              <button onClick={() => exportCSV(users, 'utilisateurs.csv')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                ⬇ CSV
              </button>
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
                  {users.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucun utilisateur</td></tr>}
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{u.nom || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'vendeur' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{u.role || '—'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{u.pays || '—'}</td>
                      <td className="px-4 py-3 text-gray-400">{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Annonces */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><Megaphone size={18} /> Dernières annonces</h2>
              <button onClick={() => exportCSV(listings, 'annonces.csv')} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition">
                ⬇ CSV
              </button>
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
                  {listings.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">Aucune annonce</td></tr>}
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
        </>)}

        {/* ── TAB : PRIX DU MARCHÉ ── */}
        {activeTab === 'prices' && <PrixSection prix={prix} exportCSV={exportCSV} triggerCron={triggerCron} prixFiltreProduit={prixFiltreProduit} setPrixFiltreProduit={setPrixFiltreProduit} prixFiltreSource={prixFiltreSource} setPrixFiltreSource={setPrixFiltreSource} prixFiltrePays={prixFiltrePays} setPrixFiltrePays={setPrixFiltrePays} />}

      </div>
    </div>
  )
}

// ── Section Prix — composant séparé pour garder AdminPage lisible ─────
function PrixSection({ prix, exportCSV, triggerCron, prixFiltreProduit, setPrixFiltreProduit, prixFiltreSource, setPrixFiltreSource, prixFiltrePays, setPrixFiltrePays }: {
  prix: any[]; exportCSV: (d: any[], f: string) => void; triggerCron: () => void
  prixFiltreProduit: string; setPrixFiltreProduit: (v: string) => void
  prixFiltreSource: string; setPrixFiltreSource: (v: string) => void
  prixFiltrePays: string; setPrixFiltrePays: (v: string) => void
}) {
  const PRODUITS = ['Riz', 'Mil', 'Maïs', 'Sorgho', 'Arachide', 'Niébé', 'Tomate', 'Oignon']
  const PAYS = Array.from(new Set(prix.map(p => p.pays).filter(Boolean))) as string[]

  const filtered = prix.filter(p =>
    (prixFiltreProduit === 'Tous' || p.produit === prixFiltreProduit) &&
    (prixFiltreSource === 'Tous' || p.source === prixFiltreSource) &&
    (prixFiltrePays === 'Tous' || p.pays === prixFiltrePays)
  )

  // Grouper par produit pour les graphiques
  const produitsPourGraphiques = prixFiltreProduit !== 'Tous'
    ? [prixFiltreProduit]
    : PRODUITS.filter(p => prix.some(x => x.produit === p)).slice(0, 4)

  // Statistiques FAO vs Terrain par produit
  const statsComparatif = PRODUITS.map(produit => {
    const fao = prix.filter(p => p.produit === produit && p.source === 'FAO')
    const terrain = prix.filter(p => p.produit === produit && p.source !== 'FAO')
    const moyFao = fao.length ? Math.round(fao.reduce((s, p) => s + p.prix, 0) / fao.length) : null
    const moyTerrain = terrain.length ? Math.round(terrain.reduce((s, p) => s + p.prix, 0) / terrain.length) : null
    const diff = moyFao && moyTerrain ? Math.round(((moyTerrain - moyFao) / moyFao) * 100) : null
    return { produit, moyFao, moyTerrain, diff, faoCount: fao.length, terrainCount: terrain.length }
  }).filter(s => s.moyFao || s.moyTerrain)

  return (
    <div className="space-y-8">
      {/* En-tête + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📈 Analyse des prix du marché</h2>
          <p className="text-sm text-gray-500 mt-0.5">Données privées — Rapport ONG/Gouvernements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={triggerCron}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition">
            🔄 Déclencher mise à jour FAO
          </button>
          <button onClick={() => exportCSV(filtered, `prix-marche-${new Date().toISOString().split('T')[0]}.csv`)}
            className="bg-[#0a4a2f] hover:bg-green-900 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition">
            ⬇ Export CSV/Excel
          </button>
        </div>
      </div>

      {/* KPIs prix */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total prix', value: prix.length, color: 'text-gray-800' },
          { label: 'FAO/WFP', value: prix.filter(p => p.source === 'FAO').length, color: 'text-blue-700' },
          { label: 'Terrain', value: prix.filter(p => p.source !== 'FAO').length, color: 'text-green-700' },
          { label: 'Produits suivis', value: new Set(prix.map(p => p.produit)).size, color: 'text-purple-700' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <div className={`text-2xl font-extrabold ${k.color}`}>{k.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <select value={prixFiltreProduit} onChange={e => setPrixFiltreProduit(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="Tous">Tous produits</option>
          {PRODUITS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={prixFiltreSource} onChange={e => setPrixFiltreSource(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="Tous">FAO + Terrain</option>
          <option value="FAO">FAO seulement</option>
          <option value="Terrain">Terrain seulement</option>
        </select>
        <select value={prixFiltrePays} onChange={e => setPrixFiltrePays(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="Tous">Tous pays</option>
          {PAYS.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Graphiques courbe par produit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {produitsPourGraphiques.map(produit => {
          const donnees = prix
            .filter(p => p.produit === produit && (prixFiltrePays === 'Tous' || p.pays === prixFiltrePays))
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(-30) // 30 derniers points
          if (donnees.length < 2) return null
          const W = 360, H = 120
          const vals = donnees.map(d => d.prix)
          const minV = Math.min(...vals), maxV = Math.max(...vals)
          const range = maxV - minV || 1
          const xS = (i: number) => (i / (donnees.length - 1)) * (W - 30) + 15
          const yS = (v: number) => H - 15 - ((v - minV) / range) * (H - 30)
          const faoPoints = donnees.filter(d => d.source === 'FAO')
          const terrainPoints = donnees.filter(d => d.source !== 'FAO')
          const polyFao = faoPoints.map((d, i) => {
            const idx = donnees.indexOf(d); return `${xS(idx)},${yS(d.prix)}`
          }).join(' ')
          const polyTerrain = terrainPoints.map(d => {
            const idx = donnees.indexOf(d); return `${xS(idx)},${yS(d.prix)}`
          }).join(' ')
          return (
            <div key={produit} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">{produit}</h3>
                <div className="flex gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block" /> FAO</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> Terrain</span>
                </div>
              </div>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
                {/* Grille */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                  <line key={t} x1={15} x2={W - 15} y1={yS(minV + t * range)} y2={yS(minV + t * range)}
                    stroke="#f0f0f0" strokeWidth="1" />
                ))}
                {/* Labels Y */}
                {[0, 0.5, 1].map(t => (
                  <text key={t} x={13} y={yS(minV + t * range) + 3} textAnchor="end" fontSize={8} fill="#9ca3af">
                    {Math.round(minV + t * range)}
                  </text>
                ))}
                {/* Courbe FAO */}
                {faoPoints.length >= 2 && <polyline points={polyFao} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />}
                {faoPoints.length >= 2 && faoPoints.map((d, i) => {
                  const idx = donnees.indexOf(d)
                  return <circle key={i} cx={xS(idx)} cy={yS(d.prix)} r={2} fill="#3b82f6" />
                })}
                {/* Courbe Terrain */}
                {terrainPoints.length >= 2 && <polyline points={polyTerrain} fill="none" stroke="#16a34a" strokeWidth="2" strokeLinejoin="round" />}
                {terrainPoints.length >= 2 && terrainPoints.map((d, i) => {
                  const idx = donnees.indexOf(d)
                  return <circle key={i} cx={xS(idx)} cy={yS(d.prix)} r={2} fill="#16a34a" />
                })}
              </svg>
              <div className="flex justify-between text-xs text-gray-400 mt-1 px-3">
                <span>{donnees[0] ? new Date(donnees[0].created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : ''}</span>
                <span className="font-semibold text-gray-600">FCFA/{donnees[0]?.unite || 'kg'}</span>
                <span>{donnees[donnees.length - 1] ? new Date(donnees[donnees.length - 1].created_at).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }) : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tableau comparatif FAO vs Terrain */}
      {statsComparatif.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">Comparatif FAO vs Terrain (prix moyens FCFA/kg)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Écart : différence entre prix signalés sur le terrain et prix officiels FAO</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Produit</th>
                  <th className="px-4 py-3 text-right">Prix FAO</th>
                  <th className="px-4 py-3 text-right">Prix Terrain</th>
                  <th className="px-4 py-3 text-right">Écart</th>
                  <th className="px-4 py-3 text-right">Nb mesures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {statsComparatif.map(s => (
                  <tr key={s.produit} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.produit}</td>
                    <td className="px-4 py-3 text-right">
                      {s.moyFao ? <span className="text-blue-700 font-medium">{s.moyFao.toLocaleString()} F</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.moyTerrain ? <span className="text-green-700 font-medium">{s.moyTerrain.toLocaleString()} F</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.diff !== null ? (
                        <span className={`font-bold ${s.diff > 0 ? 'text-red-600' : s.diff < 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {s.diff > 0 ? '+' : ''}{s.diff}%
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {s.faoCount} FAO · {s.terrainCount} terrain
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tableau brut des prix */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Données brutes ({filtered.length} entrées)</h3>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left">Produit</th>
                <th className="px-4 py-3 text-left">Prix</th>
                <th className="px-4 py-3 text-left">Ville</th>
                <th className="px-4 py-3 text-left">Pays</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Aucune donnée</td></tr>}
              {filtered.slice(0, 200).map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{p.produit}</td>
                  <td className="px-4 py-2.5 text-gray-700">{p.prix?.toLocaleString()} F/{p.unite}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.ville || '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.pays || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.source === 'FAO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {p.source || 'Terrain'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 text-xs">{p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
