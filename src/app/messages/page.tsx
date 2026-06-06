'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, Shield, ArrowLeft, Image as ImageIcon, Search, Plus, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const ROLE_ICONS: Record<string, { icon: string; color: string }> = {
  'Producteur / Fermier': { icon: '🌾', color: 'bg-green-100 text-green-700' },
  'Grossiste': { icon: '🏪', color: 'bg-blue-100 text-blue-700' },
  'Transporteur': { icon: '🚛', color: 'bg-orange-100 text-orange-700' },
  'Coopérative': { icon: '🤝', color: 'bg-purple-100 text-purple-700' },
  'Demi-grossiste': { icon: '📦', color: 'bg-yellow-100 text-yellow-700' },
}

function MessagesContent() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [conversations, setConversations] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [offerText, setOfferText] = useState('')
  const [imageError, setImageError] = useState('')

  // New conversation search
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchConversations()
    const toId = searchParams.get('to')
    if (toId) loadUserAndSelect(toId)
  }, [user])

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser.id)
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [showSearch])

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    const t = setTimeout(() => searchUsers(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const loadUserAndSelect = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (data) setSelectedUser(data)
  }

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })

    if (!data) return
    const convMap = new Map()
    data.forEach((msg: any) => {
      const partner = msg.sender_id === user?.id ? msg.receiver : msg.sender
      if (partner && !convMap.has(partner.id)) {
        convMap.set(partner.id, { profile: partner, lastMessage: msg })
      }
    })
    setConversations(Array.from(convMap.values()))
  }

  const fetchMessages = async (partnerId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*)')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    await supabase.from('messages').update({ lu: true })
      .eq('receiver_id', user?.id)
      .eq('sender_id', partnerId)
  }

  const searchUsers = async (q: string) => {
    if (!q.trim()) return
    setSearching(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, nom, role, pays, verifie')
      .ilike('nom', `%${q}%`)
      .neq('id', user?.id)
      .limit(8)
    setSearchResults(data || [])
    setSearching(false)
  }

  const startConversation = (p: any) => {
    setSelectedUser(p)
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const sendMessage = async (text?: string) => {
    const content = text || newMessage
    if (!user || !selectedUser || !content.trim()) return
    setSending(true)
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser.id,
      contenu: content.trim(),
    })
    setNewMessage('')
    setShowOffer(false)
    setOfferText('')
    await fetchMessages(selectedUser.id)
    await fetchConversations()
    setSending(false)
  }

  const sendOffer = async () => {
    if (!offerText.trim()) return
    const offerMessage = `📋 *PROPOSITION D'ACCORD*\n\n${offerText}\n\n_Cet accord est enregistré sur AgriMarché et servira de référence en cas de litige._`
    await sendMessage(offerMessage)
  }

  const compressAndSendImage = (file: File) => {
    setImageError('')
    if (file.size > 10 * 1024 * 1024) { setImageError('Image trop grande (max 10 Mo)'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_DIM = 600
        let { width, height } = img
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height / width) * MAX_DIM); width = MAX_DIM }
          else { width = Math.round((width / height) * MAX_DIM); height = MAX_DIM }
        }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        sendMessage(`[IMG]${canvas.toDataURL('image/jpeg', 0.65)}`)
      }
      img.onerror = () => setImageError("Impossible de lire l'image")
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) compressAndSendImage(file)
    e.target.value = ''
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
  }

  const getRoleInfo = (role: string) => ROLE_ICONS[role] || { icon: '👤', color: 'bg-gray-100 text-gray-600' }

  const previewContent = (contenu: string) => {
    if (!contenu) return ''
    if (contenu.startsWith('[IMG]')) return '📷 Photo'
    if (contenu.startsWith('📋 *PROPOSITION')) return "📋 Proposition d'accord"
    return contenu
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 px-2">💬 Messages</h1>

      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-xs sm:text-sm mx-2">
        <Shield size={14} className="text-amber-600 flex-shrink-0" />
        <p className="text-amber-800">
          <span className="font-semibold">Conseil :</span> Négociez ici pour garder une trace. Utilisez <span className="font-semibold">"Accord"</span> pour formaliser.
        </p>
      </div>

      <div
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        style={{ height: 'calc(100dvh - 200px)', minHeight: '400px', maxHeight: '680px' }}
      >
        <div className="flex h-full min-h-0">

          {/* Sidebar conversations */}
          <div className={`
            relative flex-col border-r border-gray-100
            ${selectedUser ? 'hidden md:flex md:w-64' : 'flex w-full md:w-64'}
            flex-shrink-0
          `}>
            {/* Header sidebar */}
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</p>
              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-1 text-xs bg-[#0a4a2f] text-white px-2 py-1 rounded-lg hover:bg-green-900 transition"
                title="Nouvelle conversation"
              >
                <Plus size={11} /> Nouveau
              </button>
            </div>

            {/* Search modal overlay */}
            {showSearch && (
              <div className="absolute inset-0 bg-white z-10 flex flex-col">
                <div className="p-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                    <Search size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un membre..."
                      className="flex-1 text-sm bg-transparent outline-none"
                    />
                  </div>
                  <button onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]) }}
                    className="p-1.5 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {searching ? (
                    <p className="text-xs text-gray-400 text-center mt-6">Recherche...</p>
                  ) : searchQuery.trim() && searchResults.length === 0 ? (
                    <div className="text-center mt-8 px-4">
                      <p className="text-sm text-gray-500">Aucun membre trouvé</p>
                      <p className="text-xs text-gray-400 mt-1">Essayez un autre prénom</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(p => (
                      <button
                        key={p.id}
                        onClick={() => startConversation(p)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"
                      >
                        <div className="w-9 h-9 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {p.nom?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate flex items-center gap-1">
                            {p.nom}
                            {p.verifie && <span className="text-blue-500 text-xs">✅</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {getRoleInfo(p.role).icon} {p.role || 'Membre'} · {p.pays}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center mt-10 px-4">
                      <div className="text-3xl mb-2">🔍</div>
                      <p className="text-sm text-gray-500">Tapez un prénom pour rechercher</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Liste conversations */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm mt-6">
                  <div className="text-3xl mb-2">💬</div>
                  <p className="font-medium text-gray-600">Aucune conversation</p>
                  <p className="text-xs mt-1 mb-4 text-gray-400">
                    Cliquez <strong className="text-[#0a4a2f]">+ Nouveau</strong> pour écrire à un membre, ou trouvez un vendeur depuis une annonce
                  </p>
                  <Link
                    href="/recherche"
                    className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-xl hover:bg-gray-200 transition"
                  >
                    <Search size={11} /> Voir les annonces
                  </Link>
                </div>
              ) : (
                conversations.map(({ profile: p, lastMessage }) => {
                  const roleInfo = getRoleInfo(p?.role)
                  return (
                    <button
                      key={p?.id}
                      onClick={() => setSelectedUser(p)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left ${selectedUser?.id === p?.id ? 'bg-green-50 border-r-2 border-[#0a4a2f]' : ''}`}
                    >
                      <div className="w-10 h-10 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {p?.nom?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm text-gray-900 truncate">{p?.nom}</p>
                          <span className="text-xs">{roleInfo.icon}</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{previewContent(lastMessage?.contenu)}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div className={`
            flex-1 flex-col min-w-0 min-h-0
            ${!selectedUser ? 'hidden md:flex' : 'flex'}
          `}>
            {selectedUser ? (
              <>
                {/* Header du chat */}
                <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100 transition flex-shrink-0"
                  >
                    <ArrowLeft size={20} className="text-gray-600" />
                  </button>
                  <div className="w-9 h-9 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {selectedUser.nom?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-900 truncate">{selectedUser.nom}</p>
                      {selectedUser.verifie && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex-shrink-0">✅</span>
                      )}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getRoleInfo(selectedUser.role).color}`}>
                      {getRoleInfo(selectedUser.role).icon} {selectedUser.role}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <div className="text-3xl mb-2">👋</div>
                      <p>Commencez la conversation avec <strong>{selectedUser.nom}</strong></p>
                    </div>
                  )}
                  {messages.map((msg: any) => {
                    const isMe = msg.sender_id === user?.id
                    const isOffer = msg.contenu?.startsWith('📋 *PROPOSITION')
                    const isImage = msg.contenu?.startsWith('[IMG]')
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] sm:max-w-sm ${isOffer ? 'w-full max-w-[85%] sm:max-w-sm' : ''}`}>
                          {isImage ? (
                            <div className={`rounded-2xl overflow-hidden ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                              <img src={msg.contenu.slice(5)} alt="Photo" className="max-w-full rounded-2xl" style={{ maxWidth: '200px' }} />
                            </div>
                          ) : isOffer ? (
                            <div className={`rounded-2xl p-3 text-sm border-2 ${isMe ? 'bg-[#0a4a2f] text-white border-[#0a4a2f]' : 'bg-amber-50 text-gray-800 border-amber-300'}`}>
                              <p className="font-bold mb-1 text-xs">📋 Proposition d'accord</p>
                              <p className="whitespace-pre-wrap text-xs leading-relaxed">
                                {msg.contenu.replace("📋 *PROPOSITION D'ACCORD*\n\n", '').replace("\n\n_Cet accord est enregistré sur AgriMarché et servira de référence en cas de litige._", '')}
                              </p>
                              <p className={`text-xs mt-1.5 ${isMe ? 'text-green-200' : 'text-amber-600'}`}>🔒 Enregistré sur AgriMarché</p>
                            </div>
                          ) : (
                            <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-sm ${isMe ? 'bg-[#0a4a2f] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                              {msg.contenu}
                            </div>
                          )}
                          <p className={`text-xs text-gray-400 mt-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Formulaire accord */}
                {showOffer && (
                  <div className="px-3 pb-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs font-semibold text-amber-800 mb-2">📋 Proposer un accord formel</p>
                      <textarea
                        value={offerText}
                        onChange={e => setOfferText(e.target.value)}
                        placeholder="Ex : Je propose 500 kg de mil à 15 000 FCFA. Départ le 10 jan. Paiement Wave à la livraison."
                        rows={3}
                        className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white resize-none outline-none focus:border-[#0a4a2f]"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => setShowOffer(false)} className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
                        <button onClick={sendOffer} disabled={!offerText.trim()} className="flex-1 py-2 text-sm bg-[#0a4a2f] text-white rounded-lg hover:bg-green-900 disabled:opacity-50">Envoyer</button>
                      </div>
                    </div>
                  </div>
                )}

                {imageError && <p className="px-3 text-xs text-red-500">{imageError}</p>}

                {/* Barre d'envoi */}
                <div className="p-3 sm:p-4 border-t border-gray-100">
                  <div className="flex gap-2 items-center">
                    <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                    <button onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-600" type="button">
                      <ImageIcon size={18} />
                    </button>
                    <button onClick={() => setShowOffer(!showOffer)}
                      className="flex-shrink-0 hidden sm:flex items-center bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-amber-100 transition whitespace-nowrap h-10" type="button">
                      📋 Accord
                    </button>
                    <input
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder={`Message à ${selectedUser.nom}...`}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#0a4a2f] min-w-0 h-10"
                    />
                    <button onClick={() => sendMessage()} disabled={sending || !newMessage.trim()}
                      className="bg-[#0a4a2f] text-white w-10 h-10 rounded-xl hover:bg-green-900 transition disabled:opacity-50 flex-shrink-0 flex items-center justify-center" type="button">
                      <Send size={16} />
                    </button>
                  </div>
                  <button onClick={() => setShowOffer(!showOffer)}
                    className="sm:hidden mt-2 w-full flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs font-medium hover:bg-amber-100 transition" type="button">
                    📋 Proposer un accord formel
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center px-8">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="font-medium text-gray-600 mb-1">
                    {conversations.length > 0 ? 'Sélectionnez une conversation' : 'Aucun message encore'}
                  </p>
                  <p className="text-sm text-gray-400 mb-5">
                    Écrivez à n'importe quel membre ou trouvez un vendeur
                  </p>
                  <div className="flex flex-col gap-2 items-center">
                    <button
                      onClick={() => setShowSearch(true)}
                      className="inline-flex items-center gap-2 bg-[#0a4a2f] text-white text-sm px-5 py-2.5 rounded-xl hover:bg-green-900 transition"
                    >
                      <Search size={14} /> Chercher un membre
                    </button>
                    <Link href="/recherche" className="text-xs text-gray-400 hover:text-[#0a4a2f] transition underline">
                      ou parcourir les annonces
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-96 text-gray-400">Chargement...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
