'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, Eye, Package, User, BadgeCheck, ShieldCheck, CreditCard } from 'lucide-react'
import { supabase, formatPrice, Product } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'

type Tab = 'products' | 'transactions' | 'profile'

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [verif, setVerif] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalViews, setTotalViews] = useState(0)

  useEffect(() => {
    if (!user) router.push('/login')
    else { fetchProducts(); fetchTransactions(); fetchVerif() }
  }, [user])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*, categories(*)')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
    if (data) {
      setProducts(data)
      setTotalViews(data.reduce((sum, p) => sum + (p.vues || 0), 0))
    }
    setLoading(false)
  }

  const fetchTransactions = async () => {
    const { data } = await supabase.from('transactions')
      .select('*, products(*), seller:seller_id(*)')
      .eq('buyer_id', user?.id)
      .order('created_at', { ascending: false })
    setTransactions(data || [])
  }

  const fetchVerif = async () => {
    const { data } = await supabase.from('vendor_verifications')
      .select('*').eq('user_id', user?.id).single()
    setVerif(data)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('Supprimer cette annonce ?')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'products', label: t.dashboard.my_products, icon: <Package size={16} /> },
    { id: 'transactions', label: 'Commandes', icon: <CreditCard size={16} /> },
    { id: 'profile', label: t.dashboard.profile, icon: <User size={16} /> },
  ]

  const txStatusColor: Record<string, string> = {
    en_attente: 'bg-amber-100 text-amber-700',
    en_cours: 'bg-blue-100 text-blue-700',
    confirme: 'bg-green-100 text-green-700',
    echoue: 'bg-red-100 text-red-700',
    rembourse: 'bg-purple-100 text-purple-700',
    annule: 'bg-gray-100 text-gray-600',
  }

  const verifStatusBanner = () => {
    if (!verif) return (
      <Link href="/verification" className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 hover:bg-amber-100 transition">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">Faites vérifier votre compte</p>
            <p className="text-xs text-amber-600">Obtenez le badge certifié et accédez au paiement sécurisé</p>
          </div>
        </div>
        <span className="text-amber-600 text-sm font-medium">→</span>
      </Link>
    )

    if (verif.statut === 'approuve') return (
      <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <BadgeCheck size={22} className="text-blue-500" />
        <div>
          <p className="font-semibold text-green-800 text-sm">Compte certifié ✅</p>
          <p className="text-xs text-green-600">Votre badge est visible sur toutes vos annonces</p>
        </div>
      </div>
    )

    if (verif.statut === 'en_attente') return (
      <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <ShieldCheck size={22} className="text-blue-500" />
        <div>
          <p className="font-semibold text-blue-800 text-sm">Vérification en cours ⏳</p>
          <p className="text-xs text-blue-600">Délai d'examen : 24-48h</p>
        </div>
      </div>
    )

    if (verif.statut === 'rejete') return (
      <Link href="/verification" className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4 mb-6 hover:bg-red-100 transition">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} className="text-red-500" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Vérification rejetée</p>
            <p className="text-xs text-red-600">{verif.note_admin || 'Cliquez pour soumettre à nouveau'}</p>
          </div>
        </div>
        <span className="text-red-600 text-sm font-medium">Réessayer →</span>
      </Link>
    )

    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Bienvenue, {profile?.nom?.split(' ')[0] || user?.email}
            {profile?.verifie && <span className="ml-2 text-blue-500 inline-flex items-center gap-0.5"><BadgeCheck size={14} /> Certifié</span>}
          </p>
        </div>
        <Link href="/vendre" className="flex items-center gap-2 bg-[#0a4a2f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-900 transition">
          <PlusCircle size={16} />
          {t.dashboard.add_product}
        </Link>
      </div>

      {/* Verification banner */}
      {verifStatusBanner()}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Annonces', value: products.length, icon: '📦' },
          { label: 'Vues totales', value: totalViews, icon: '👁' },
          { label: 'Commandes', value: transactions.length, icon: '🛒' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition ${tab === tb.id ? 'bg-white text-[#0a4a2f] shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {/* Products tab */}
      {tab === 'products' && (
        <div>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-xl h-20 animate-pulse" />)}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <span className="text-5xl block mb-4">📭</span>
              <p className="font-medium">{t.dashboard.no_products}</p>
              <Link href="/vendre" className="mt-4 inline-block bg-[#0a4a2f] text-white px-5 py-2 rounded-xl text-sm">Publier une annonce</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <span className="text-2xl">{(p as any).categories?.icone || '🌾'}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{p.titre}</p>
                    <p className="text-[#0a4a2f] font-bold">{formatPrice(p.prix, p.devise)}<span className="text-gray-400 font-normal text-sm">/{p.unite}</span></p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Eye size={12} /> {p.vues} vues · {p.pays} · {p.ville}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${p.disponible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.disponible ? 'Actif' : 'Inactif'}
                  </span>
                  <div className="flex gap-2">
                    <Link href={`/produits/${p.id}`} className="p-2 text-gray-400 hover:text-[#0a4a2f] transition"><Eye size={18} /></Link>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transactions tab */}
      {tab === 'transactions' && (
        <div>
          {transactions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <span className="text-5xl block mb-4">🛒</span>
              <p className="font-medium">Aucune commande pour l'instant</p>
              <Link href="/annonces" className="mt-4 inline-block bg-[#0a4a2f] text-white px-5 py-2 rounded-xl text-sm">Parcourir les produits</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{tx.products?.titre || 'Produit'}</p>
                      <p className="text-xs text-gray-400">Vendeur : {tx.seller?.nom}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">Réf: {tx.reference_interne}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0a4a2f]">{formatPrice(tx.montant, tx.devise)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${txStatusColor[tx.statut] || 'bg-gray-100 text-gray-600'}`}>
                        {tx.statut.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{tx.methode?.replace(/_/g, ' ')} · {tx.quantite} {tx.unite}</span>
                    <span>{new Date(tx.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile tab */}
      {tab === 'profile' && profile && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.nom?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-1">
                  {profile.nom}
                  {profile.verifie && <BadgeCheck size={18} className="text-blue-500" />}
                </h3>
                <p className="text-gray-500 text-sm">{profile.email}</p>
                <p className="text-xs text-gray-400">{profile.role} · {profile.pays}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Téléphone', value: profile.telephone },
                { label: 'WhatsApp', value: profile.whatsapp },
                { label: 'Pays', value: profile.pays },
                { label: 'Statut', value: profile.verifie ? '✅ Certifié' : '⏳ Non certifié' },
              ].map((field, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">{field.label}</p>
                  <p className="font-medium mt-0.5">{field.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          <Link href="/verification"
            className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-[#0a4a2f] transition">
            <div className="flex items-center gap-3">
              <ShieldCheck size={20} className="text-[#0a4a2f]" />
              <div>
                <p className="font-medium text-sm">Vérification d'identité</p>
                <p className="text-xs text-gray-500">
                  {verif ? `Statut : ${verif.statut.replace(/_/g, ' ')}` : 'Non soumis'}
                </p>
              </div>
            </div>
            <span className="text-gray-400">→</span>
          </Link>
        </div>
      )}
    </div>
  )
}
