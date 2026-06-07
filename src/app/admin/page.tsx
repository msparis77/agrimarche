'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Megaphone, TrendingUp, MessageSquare,
  AlertTriangle, LogOut, Download, RefreshCw, CheckCircle,
  XCircle, Eye, BadgeCheck, AlertCircle, Lock, ShieldCheck
} from 'lucide-react'
import { supabase, formatPrice } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

// ── Écran de verrouillage PIN ─────────────────────────────────────
function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim() || checking) return
    setChecking(true)
    setError('')

    const res = await fetch('/api/admin-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      sessionStorage.setItem('admin_unlocked', '1')
      onUnlock()
    } else {
      const att = attempts + 1
      setAttempts(att)
      setError(att >= 3 ? `Code incorrect (${att} tentatives)` : 'Code incorrect')
      setPin('')
      inputRef.current?.focus()
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
          <p className="text-sm text-gray-500 mt-1">🌾 AgriMarché — Accès restreint</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Code d'accès</label>
            <input
              ref={inputRef}
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="••••••••"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-center text-lg tracking-widest font-bold focus:outline-none focus:border-[#0a4a2f] transition"
              autoComplete="off"
              disabled={checking}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl text-center font-medium">
              🔒 {error}
            </div>
          )}

          <button
            type="submit"
            disabled={checking || !pin.trim()}
            className="w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-2xl hover:bg-green-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {checking ? (
              <><RefreshCw size={16} className="animate-spin" /> Vérification...</>
            ) : (
              <><ShieldCheck size={16} /> Accéder au tableau de bord</>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Accès réservé aux administrateurs AgriMarché
        </p>
      </div>
    </div>
  )
}

type Section = 'overview' | 'users' | 'listings' | 'prices' | 'messages' | 'alerts'

// ── CSV export helper ─────────────────────────────────────────────
function exportCSV(data: any[], filename: string) {
  if (!data.length) return
  const headers = Object.keys(data[0]).join(',')
  const rows = data.map(row =>
    Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  )
  const blob = new Blob(['﻿' + [headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Mini bar chart ────────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number; sub?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 text-xs text-gray-600 truncate shrink-0">{d.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
            <div className="h-full bg-[#166534] rounded-full transition-all duration-500"
              style={{ width: `${(d.value / max * 100).toFixed(1)}%` }} />
          </div>
          <span className="w-24 text-right text-xs font-semibold text-gray-700 shrink-0">
            {d.value.toLocaleString('fr-FR')} {d.sub || ''}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-extrabold ${color || 'text-[#166534]'}`}>{value}</div>
      <div className="text-xs font-semibold text-gray-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [unlocked, setUnlocked] = useState(false)
  const [section, setSection] = useState<Section>('overview')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Vérifier si déjà déverrouillé dans cette session
  useEffect(() => {
    if (sessionStorage.getItem('admin_unlocked') === '1') setUnlocked(true)
  }, [])

  // Data
  const [kpis, setKpis] = useState({ users: 0, usersWeek: 0, listings: 0, listingsToday: 0, messages: 0, transactions: 0 })
  const [countryStats, setCountryStats] = useState<{ pays: string; count: number }[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [listings, setListings] = useState<any[]>([])
  const [prix, setPrix] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [verifs, setVerifs] = useState<any[]>([])
  const [msgCount, setMsgCount] = useState(0)
  const [convCount, setConvCount] = useState(0)

  // Filters
  const [userFilter, setUserFilter] = useState({ role: '', pays: '' })
  const [listingFilter, setListingFilter] = useState({ pays: '', type: '' })
  const [selectedVerif, setSelectedVerif] = useState<any>(null)
  const [noteAdmin, setNoteAdmin] = useState('')

  useEffect(() => {
    if (!user && !authLoading) { router.push('/login?next=/admin'); return }
    if (!profile) return
    if (profile.role !== 'admin') { router.push('/login?next=/admin'); return }
    fetchAll()
  }, [profile, user, authLoading])

  const fetchAll = async () => {
    setRefreshing(true)
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [
      { count: totalUsers },
      { count: usersWeek },
      { count: totalListings },
      { count: listingsToday },
      { count: totalMessages },
      { count: totalTx },
      { data: usersData },
      { data: listingsData },
      { data: prixData },
      { data: txData },
      { data: verifsData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', todayStart),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('id, nom, email, role, pays, verifie, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('products').select('id, titre, description, prix, devise, unite, ville, pays, statut, created_at, categories(nom_fr)').order('created_at', { ascending: false }).limit(200),
      supabase.from('prix_marche').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('transactions').select('*, buyer:buyer_id(*), seller:seller_id(*), products(titre)').order('created_at', { ascending: false }).limit(100),
      supabase.from('vendor_verifications').select('*, profiles(nom, email, pays, verifie)').order('created_at', { ascending: false }),
    ])

    setKpis({
      users: totalUsers || 0,
      usersWeek: usersWeek || 0,
      listings: totalListings || 0,
      listingsToday: listingsToday || 0,
      messages: totalMessages || 0,
      transactions: totalTx || 0,
    })

    // Country stats from users
    const byCountry: Record<string, number> = {}
    for (const u of usersData || []) {
      const p = u.pays || 'Inconnu'
      byCountry[p] = (byCountry[p] || 0) + 1
    }
    setCountryStats(Object.entries(byCountry).map(([pays, count]) => ({ pays, count })).sort((a, b) => b.count - a.count))

    setUsers(usersData || [])
    setListings(listingsData || [])
    setPrix(prixData || [])
    setTransactions(txData || [])
    setVerifs(verifsData || [])
    setMsgCount(totalMessages || 0)
    setConvCount(Math.floor((totalMessages || 0) / 3)) // approximation

    setLoading(false)
    setRefreshing(false)
  }

  const updateVerif = async (id: string, statut: string) => {
    await supabase.from('vendor_verifications').update({ statut, note_admin: noteAdmin, examine_par: user?.id, examine_le: new Date().toISOString() }).eq('id', id)
    if (statut === 'approuve' && selectedVerif) await supabase.from('profiles').update({ verifie: true }).eq('id', selectedVerif.user_id)
    if (statut === 'rejete' && selectedVerif) await supabase.from('profiles').update({ verifie: false }).eq('id', selectedVerif.user_id)
    setSelectedVerif(null); setNoteAdmin(''); fetchAll()
  }

  const updateTransaction = async (id: string, statut: string) => {
    await supabase.from('transactions').update({ statut, ...(statut === 'confirme' ? { confirmed_at: new Date().toISOString() } : {}) }).eq('id', id)
    fetchAll()
  }

  // ── Derived data ─────────────────────────────────────────────────
  const filteredUsers = users.filter(u =>
    (!userFilter.role || u.role === userFilter.role) &&
    (!userFilter.pays || u.pays === userFilter.pays)
  )

  const filteredListings = listings.filter(l => {
    const desc = (l.description || '').toLowerCase()
    const typeMatch = !listingFilter.type || (listingFilter.type === 'offre' ? desc.includes('[offre') : desc.includes('[recherche'))
    return (!listingFilter.pays || l.pays === listingFilter.pays) && typeMatch
  })

  // Prix grouped by product for chart
  const prixByProduct: Record<string, { total: number; count: number; villes: string[] }> = {}
  for (const p of prix) {
    if (!prixByProduct[p.produit]) prixByProduct[p.produit] = { total: 0, count: 0, villes: [] }
    prixByProduct[p.produit].total += p.prix
    prixByProduct[p.produit].count++
    if (!prixByProduct[p.produit].villes.includes(p.ville)) prixByProduct[p.produit].villes.push(p.ville)
  }
  const prixChart = Object.entries(prixByProduct)
    .map(([label, d]) => ({ label, value: Math.round(d.total / d.count), sub: 'FCFA/u', count: d.count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Today's new users for alerts
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const newUsersToday = users.filter(u => new Date(u.created_at) >= todayStart)
  const pendingVerifs = verifs.filter(v => v.statut === 'en_attente')
  const blockedTx = transactions.filter(t => t.statut === 'en_cours')

  const txStats = {
    total: transactions.length,
    confirme: transactions.filter(t => t.statut === 'confirme').length,
    en_cours: transactions.filter(t => t.statut === 'en_cours').length,
    volume: transactions.filter(t => t.statut === 'confirme').reduce((s, t) => s + (t.montant || 0), 0),
  }

  const navItems: { id: Section; icon: React.ReactNode; label: string; badge?: number }[] = [
    { id: 'overview',  icon: <LayoutDashboard size={18} />, label: 'Vue générale' },
    { id: 'users',     icon: <Users size={18} />,           label: 'Utilisateurs',      badge: kpis.usersWeek },
    { id: 'listings',  icon: <Megaphone size={18} />,       label: 'Annonces',          badge: kpis.listingsToday },
    { id: 'prices',    icon: <TrendingUp size={18} />,      label: 'Prix du marché' },
    { id: 'messages',  icon: <MessageSquare size={18} />,   label: 'Messages & Tx' },
    { id: 'alerts',    icon: <AlertTriangle size={18} />,   label: 'Alertes',           badge: pendingVerifs.length + newUsersToday.length },
  ]

  if (loading || !profile) return (
    <div className="min-h-screen bg-[#0a4a2f] flex items-center justify-center">
      <div className="text-center text-white">
        <RefreshCw size={32} className="animate-spin mx-auto mb-3 text-green-300" />
        <p className="text-green-300 text-sm">Chargement...</p>
      </div>
    </div>
  )
  if (profile.role !== 'admin') return (
    <div className="min-h-screen bg-[#0a4a2f] flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">🚫</div>
        <p className="font-bold text-gray-900 text-lg">Accès refusé</p>
        <p className="text-sm text-gray-500 mt-1">Votre compte n'a pas les droits admin.</p>
        <button onClick={() => router.push('/')} className="mt-4 text-sm text-[#0a4a2f] font-medium underline">Retour au site</button>
      </div>
    </div>
  )
  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-[#0a4a2f] text-white fixed top-0 left-0 h-full z-40 pt-4">
        <div className="px-5 py-4 border-b border-white/10">
          <p className="text-lg font-extrabold tracking-tight">🌾 AgriMarché</p>
          <p className="text-xs text-green-300 mt-0.5">Admin Dashboard</p>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition text-left
                ${section === item.id ? 'bg-white/15 text-white' : 'text-green-200 hover:bg-white/10 hover:text-white'}`}>
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="bg-[#f5c842] text-[#0a4a2f] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <button onClick={fetchAll} disabled={refreshing}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-300 hover:text-white transition">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Actualiser
          </button>
          <button onClick={() => { sessionStorage.removeItem('admin_unlocked'); setUnlocked(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-300 hover:text-red-100 transition">
            <Lock size={14} /> Verrouiller
          </button>
          <button onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-green-300 hover:text-white transition">
            <LogOut size={14} /> Retour au site
          </button>
        </div>
      </aside>

      {/* ── Mobile top nav ───────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a4a2f] flex overflow-x-auto px-2 py-2 gap-1">
        {navItems.map(item => (
          <button key={item.id} onClick={() => setSection(item.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition
              ${section === item.id ? 'bg-white/20 text-white' : 'text-green-300'}`}>
            {item.icon} {item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="bg-[#f5c842] text-[#0a4a2f] text-[9px] font-bold px-1 rounded-full">{item.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <main className="flex-1 md:ml-56 px-4 md:px-8 py-6 mt-12 md:mt-0">

        {loading ? (
          <div className="flex items-center justify-center py-32 text-gray-400">
            <RefreshCw size={24} className="animate-spin mr-3" /> Chargement...
          </div>
        ) : (

          <>
            {/* ══════════════ PAGE 1 — VUE GÉNÉRALE ══════════════ */}
            {section === 'overview' && (
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Vue générale</h1>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                  <KpiCard icon="👥" label="Utilisateurs" value={kpis.users} sub={`+${kpis.usersWeek} cette semaine`} />
                  <KpiCard icon="📢" label="Annonces" value={kpis.listings} sub={`+${kpis.listingsToday} aujourd'hui`} />
                  <KpiCard icon="💬" label="Messages" value={kpis.messages} />
                  <KpiCard icon="💳" label="Transactions" value={kpis.transactions} />
                  <KpiCard icon="✅" label="Tx confirmées" value={txStats.confirme} color="text-green-600" />
                  <KpiCard icon="💰" label="Volume FCFA" value={formatPrice(txStats.volume, 'XOF')} color="text-[#166534]" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Pays actifs */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">🗺 Utilisateurs par pays</h2>
                    <BarChart data={countryStats.map(c => ({ label: c.pays, value: c.count, sub: 'utilisateurs' }))} />
                    <div className="mt-4 flex gap-3">
                      {['🇸🇳 Sénégal', '🇬🇲 Gambie', '🇬🇳 Guinée'].map((p, i) => (
                        <div key={i} className="flex-1 text-center bg-green-50 rounded-xl p-3">
                          <p className="text-sm font-bold">{p}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {countryStats.find(c => c.pays?.includes(p.split(' ')[1]))?.count || 0} users
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activité récente */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4">⚡ Activité récente</h2>
                    <div className="space-y-3">
                      {users.slice(0, 5).map(u => (
                        <div key={u.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#166534] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {u.nom?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{u.nom}</p>
                            <p className="text-xs text-gray-400">{u.role} · {u.pays}</p>
                          </div>
                          <p className="text-xs text-gray-400 shrink-0">{new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ PAGE 2 — UTILISATEURS ══════════════ */}
            {section === 'users' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-extrabold text-gray-900">Utilisateurs <span className="text-base font-normal text-gray-400">({filteredUsers.length})</span></h1>
                  <button onClick={() => exportCSV(filteredUsers.map(u => ({
                    nom: u.nom, email: u.email, role: u.role, pays: u.pays || '', verifie: u.verifie ? 'oui' : 'non', inscription: new Date(u.created_at).toLocaleDateString('fr-FR')
                  })), 'utilisateurs.csv')}
                    className="flex items-center gap-2 bg-[#166534] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition">
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-5 flex-wrap">
                  <select value={userFilter.role} onChange={e => setUserFilter(f => ({ ...f, role: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#166534]">
                    <option value="">Tous les rôles</option>
                    <option value="vendeur">Vendeur</option>
                    <option value="acheteur">Acheteur</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={userFilter.pays} onChange={e => setUserFilter(f => ({ ...f, pays: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#166534]">
                    <option value="">Tous les pays</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Gambie">Gambie</option>
                    <option value="Guinée">Guinée</option>
                  </select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Nom', 'Email', 'Rôle', 'Pays', 'Vérifié', 'Inscription'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-[#166534] rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {u.nom?.charAt(0).toUpperCase() || '?'}
                              </div>
                              {u.nom}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'vendeur' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>{u.role}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">{u.pays || '—'}</td>
                          <td className="px-4 py-3">
                            {u.verifie ? <BadgeCheck size={16} className="text-blue-500" /> : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-10 text-gray-400">Aucun utilisateur</div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════ PAGE 3 — ANNONCES ══════════════ */}
            {section === 'listings' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-extrabold text-gray-900">Annonces <span className="text-base font-normal text-gray-400">({filteredListings.length})</span></h1>
                  <button onClick={() => exportCSV(filteredListings.map(l => ({
                    titre: l.titre, categorie: l.categories?.nom_fr || '', prix: l.prix, devise: l.devise, unite: l.unite || '', ville: l.ville || '', pays: l.pays || '', statut: l.statut || '', date: new Date(l.created_at).toLocaleDateString('fr-FR')
                  })), 'annonces.csv')}
                    className="flex items-center gap-2 bg-[#166534] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition">
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                <div className="flex gap-3 mb-5 flex-wrap">
                  <select value={listingFilter.pays} onChange={e => setListingFilter(f => ({ ...f, pays: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#166534]">
                    <option value="">Tous les pays</option>
                    <option value="Sénégal">Sénégal</option>
                    <option value="Gambie">Gambie</option>
                    <option value="Guinée">Guinée</option>
                  </select>
                  <select value={listingFilter.type} onChange={e => setListingFilter(f => ({ ...f, type: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#166534]">
                    <option value="">Offres + Recherches</option>
                    <option value="offre">Offres uniquement</option>
                    <option value="recherche">Recherches uniquement</option>
                  </select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {['Titre', 'Catégorie', 'Prix', 'Ville', 'Pays', 'Statut', 'Date'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredListings.map(l => {
                        const isRecherche = (l.description || '').toLowerCase().includes('[recherche')
                        return (
                          <tr key={l.id} className="hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900 truncate max-w-[180px]">{l.titre}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isRecherche ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                {isRecherche ? 'Recherche' : 'Offre'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{l.categories?.nom_fr || '—'}</td>
                            <td className="px-4 py-3 font-semibold text-[#166534]">{formatPrice(l.prix, l.devise)}</td>
                            <td className="px-4 py-3 text-gray-500">{l.ville || '—'}</td>
                            <td className="px-4 py-3 text-gray-500">{l.pays || '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {l.statut || 'actif'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">{new Date(l.created_at).toLocaleDateString('fr-FR')}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredListings.length === 0 && (
                    <div className="text-center py-10 text-gray-400">Aucune annonce</div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════════ PAGE 4 — PRIX DU MARCHÉ ══════════════ */}
            {section === 'prices' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-extrabold text-gray-900">Prix du marché <span className="text-base font-normal text-gray-400">({prix.length} entrées)</span></h1>
                  <button onClick={() => exportCSV(prix.map(p => ({
                    produit: p.produit, prix: p.prix, unite: p.unite, ville: p.ville, vendeur: p.vendeur || '', date: new Date(p.created_at).toLocaleDateString('fr-FR')
                  })), 'prix_marche.csv')}
                    className="flex items-center gap-2 bg-[#166534] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-800 transition">
                    <Download size={15} /> Export CSV
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Bar chart */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4">Prix moyen par produit (FCFA/u)</h2>
                    <BarChart data={prixChart.map(p => ({ label: p.label, value: p.value }))} />
                  </div>

                  {/* Top produits */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-gray-800 mb-4">Produits les plus échangés</h2>
                    <div className="space-y-2">
                      {prixChart.map((p, i) => (
                        <div key={p.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 bg-[#166534] text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                            <span className="font-medium text-gray-800">{p.label}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-[#166534]">{p.value.toLocaleString('fr-FR')} FCFA</p>
                            <p className="text-xs text-gray-400">{p.count} entrées</p>
                          </div>
                        </div>
                      ))}
                      {prixChart.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Aucune donnée</p>}
                    </div>
                  </div>
                </div>

                {/* Table détaillée */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 font-semibold text-gray-700">Dernières entrées</div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Produit', 'Prix', 'Unité', 'Ville', 'Vendeur', 'Date'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {prix.slice(0, 50).map(p => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-medium text-gray-900">{p.produit}</td>
                          <td className="px-4 py-2.5 font-bold text-[#166534]">{p.prix.toLocaleString('fr-FR')}</td>
                          <td className="px-4 py-2.5 text-gray-500">{p.unite}</td>
                          <td className="px-4 py-2.5 text-gray-500">{p.ville}</td>
                          <td className="px-4 py-2.5 text-gray-500">{p.vendeur || '—'}</td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════════════ PAGE 5 — MESSAGES & TRANSACTIONS ══════════════ */}
            {section === 'messages' && (
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Messages & Transactions</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <KpiCard icon="💬" label="Messages totaux" value={msgCount} />
                  <KpiCard icon="🔁" label="Conversations" value={convCount} sub="(estimation)" />
                  <KpiCard icon="💳" label="Transactions" value={txStats.total} />
                  <KpiCard icon="✅" label="Confirmées" value={txStats.confirme} color="text-green-600" sub={`Volume : ${formatPrice(txStats.volume, 'XOF')}`} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-700">Toutes les transactions</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${txStats.en_cours > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                      {txStats.en_cours} en cours
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {transactions.map(tx => (
                      <div key={tx.id} className="px-5 py-4 hover:bg-gray-50 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{tx.products?.titre || 'Produit supprimé'}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {tx.buyer?.nom || '?'} → {tx.seller?.nom || '?'} · {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="font-bold text-[#166534]">{formatPrice(tx.montant || 0, tx.devise || 'XOF')}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              tx.statut === 'confirme' ? 'bg-green-100 text-green-700' :
                              tx.statut === 'en_cours' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                            }`}>{tx.statut?.replace(/_/g, ' ')}</span>
                          </div>
                        </div>
                        {tx.statut === 'en_cours' && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => updateTransaction(tx.id, 'confirme')}
                              className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium hover:bg-green-700 flex items-center justify-center gap-1">
                              <CheckCircle size={13} /> Confirmer
                            </button>
                            <button onClick={() => updateTransaction(tx.id, 'echoue')}
                              className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-xs font-medium hover:bg-red-100 flex items-center justify-center gap-1">
                              <XCircle size={13} /> Marquer échoué
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {transactions.length === 0 && <div className="text-center py-10 text-gray-400">Aucune transaction</div>}
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════ PAGE 6 — ALERTES ══════════════ */}
            {section === 'alerts' && (
              <div>
                <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Alertes</h1>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                  <KpiCard icon="🆕" label="Nouveaux utilisateurs aujourd'hui" value={newUsersToday.length} color={newUsersToday.length > 0 ? 'text-blue-600' : 'text-gray-400'} />
                  <KpiCard icon="⏳" label="Vérifications en attente" value={pendingVerifs.length} color={pendingVerifs.length > 0 ? 'text-amber-600' : 'text-gray-400'} />
                  <KpiCard icon="🔒" label="Transactions bloquées" value={blockedTx.length} color={blockedTx.length > 0 ? 'text-red-600' : 'text-gray-400'} />
                </div>

                {/* Nouveaux utilisateurs */}
                {newUsersToday.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-blue-50">
                      <h2 className="font-bold text-blue-800">🆕 Nouveaux inscrits aujourd'hui</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {newUsersToday.map(u => (
                        <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#166534] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {u.nom?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{u.nom}</p>
                            <p className="text-xs text-gray-400">{u.email} · {u.role} · {u.pays}</p>
                          </div>
                          <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vérifications en attente */}
                {verifs.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-amber-50">
                      <h2 className="font-bold text-amber-800">⏳ Demandes de vérification</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {verifs.map(v => (
                        <div key={v.id} className="px-5 py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold">
                                {v.profiles?.nom?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold flex items-center gap-1">
                                  {v.profiles?.nom}
                                  {v.profiles?.verifie && <BadgeCheck size={13} className="text-blue-500" />}
                                </p>
                                <p className="text-xs text-gray-400">{v.profiles?.email} · {v.type_doc}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                v.statut === 'en_attente' ? 'bg-amber-100 text-amber-700' :
                                v.statut === 'approuve' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                              }`}>{v.statut?.replace(/_/g, ' ')}</span>
                              <button onClick={() => setSelectedVerif(selectedVerif?.id === v.id ? null : v)}
                                className="text-gray-400 hover:text-[#0a4a2f]">
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>

                          {selectedVerif?.id === v.id && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="flex gap-2 mb-3">
                                {v.doc_recto_url && <a href={v.doc_recto_url} target="_blank" rel="noopener noreferrer"><img src={v.doc_recto_url} className="h-24 rounded-lg border" alt="recto" /></a>}
                                {v.doc_verso_url && <a href={v.doc_verso_url} target="_blank" rel="noopener noreferrer"><img src={v.doc_verso_url} className="h-24 rounded-lg border" alt="verso" /></a>}
                                {v.selfie_url && <a href={v.selfie_url} target="_blank" rel="noopener noreferrer"><img src={v.selfie_url} className="h-24 rounded-lg border" alt="selfie" /></a>}
                              </div>
                              <input value={noteAdmin} onChange={e => setNoteAdmin(e.target.value)}
                                placeholder="Note admin (optionnel)" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 outline-none focus:border-[#0a4a2f]" />
                              <div className="flex gap-2">
                                <button onClick={() => updateVerif(v.id, 'approuve')} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-700">
                                  <CheckCircle size={13} /> Approuver
                                </button>
                                <button onClick={() => updateVerif(v.id, 'info_manquante')} className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-orange-600">
                                  <AlertCircle size={13} /> Info manquante
                                </button>
                                <button onClick={() => updateVerif(v.id, 'rejete')} className="flex-1 bg-red-600 text-white py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-700">
                                  <XCircle size={13} /> Rejeter
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions bloquées */}
                {blockedTx.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 bg-red-50">
                      <h2 className="font-bold text-red-800">🔒 Transactions en cours (à débloquer)</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {blockedTx.map(tx => (
                        <div key={tx.id} className="px-5 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold">{tx.products?.titre || '—'}</p>
                              <p className="text-xs text-gray-400">{tx.buyer?.nom || '?'} → {tx.seller?.nom || '?'}</p>
                            </div>
                            <p className="font-bold text-[#166534]">{formatPrice(tx.montant || 0, tx.devise || 'XOF')}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => updateTransaction(tx.id, 'confirme')} className="flex-1 bg-green-600 text-white py-2 rounded-xl text-xs font-medium hover:bg-green-700">✅ Confirmer</button>
                            <button onClick={() => updateTransaction(tx.id, 'echoue')} className="flex-1 bg-red-50 text-red-600 border border-red-200 py-2 rounded-xl text-xs font-medium hover:bg-red-100">❌ Échoué</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {newUsersToday.length === 0 && pendingVerifs.length === 0 && blockedTx.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="font-medium">Aucune alerte en cours</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
