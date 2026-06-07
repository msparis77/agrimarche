'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, Shield, ArrowLeft, Image as ImageIcon, Search, Plus, X, Check, CheckCheck } from 'lucide-react'
import MicButton from '@/components/MicButton'
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

  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const selectedUserRef = useRef<any>(null)

  // Keep ref in sync for realtime callback
  useEffect(() => { selectedUserRef.current = selectedUser }, [selectedUser])

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchConversations()

    const toId = searchParams.get('to')
    if (toId) loadUserAndSelect(toId)
  }, [user])

  // Realtime: listen for new incoming messages
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const msg = payload.new as any
        fetchConversations()
        // If we're currently in this conversation, append + mark read
        if (selectedUserRef.current?.id === msg.sender_id) {
          setMessages(prev => [...prev, msg])
          await supabase.from('messages').update({ lu: true }).eq('id', msg.id)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

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
    if (!user) return
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!data) return

    // Count unread per sender
    const unreadMap: Record<string, number> = {}
    data.forEach((msg: any) => {
      if (msg.receiver_id === user.id && !msg.lu) {
        unreadMap[msg.sender_id] = (unreadMap[msg.sender_id] || 0) + 1
      }
    })

    const convMap = new Map()
    data.forEach((msg: any) => {
      const partner = msg.sender_id === user.id ? msg.receiver : msg.sender
      if (partner && !convMap.has(partner.id)) {
        convMap.set(partner.id, {
          profile: partner,
          lastMessage: msg,
          unread: unreadMap[partner.id] || 0,
        })
      }
    })
    setConversations(Array.from(convMap.values()))
  }

  const fetchMessages = async (partnerId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])
    // Mark all as read
    await supabase.from('messages')
      .update({ lu: true })
      .eq('receiver_id', user?.id)
      .eq('sender_id', partnerId)
      .eq('lu', false)
    // Refresh conversations to update unread count
    fetchConversations()
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

    const optimistic = {
      id: `tmp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: selectedUser.id,
      contenu: content.trim(),
      created_at: new Date().toISOString(),
      lu: false,
    }
    setMessages(prev => [...prev, optimistic])
    setNewMessage('')
    setShowOffer(false)
    setOfferText('')

    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser.id,
      contenu: content.trim(),
    })

    // Refresh to get real IDs
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
    return contenu.length > 35 ? contenu.slice(0, 35) + '…' : contenu
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 56px)' }}>

      {/* Bandeau sécurité — masqué sur mobile pour gagner de l'espace */}
      <div className="hidden sm:flex items-center gap-2 bg-amber-50 border-b border-amber-100 px-4 py-2 text-xs flex-shrink-0">
        <Shield size={13} className="text-amber-600 flex-shrink-0" />
        <p className="text-amber-800">
          <span className="font-semibold">Conseil :</span> Négociez ici pour garder une trace. Utilisez <span className="font-semibold">"Accord"</span> pour formaliser une transaction.
        </p>
      </div>

      <div className="flex flex-1 min-h-0 bg-white">

        {/* ── Sidebar conversations ── */}
        <div className={`
          relative flex-col border-r border-gray-100 bg-white flex-shrink-0
          ${selectedUser ? 'hidden md:flex md:w-72' : 'flex w-full md:w-72'}
        `}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <p className="font-bold text-gray-900 text-base">Messages</p>
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-1.5 text-xs bg-[#166534] text-white px-3 py-1.5 rounded-xl hover:bg-green-800 transition font-medium"
            >
              <Plus size={12} /> Nouveau
            </button>
          </div>

          {/* Search overlay */}
          {showSearch && (
            <div className="absolute inset-0 bg-white z-10 flex flex-col">
              <div className="p-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
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
                  <p className="text-xs text-gray-400 text-center mt-8">Recherche...</p>
                ) : searchQuery.trim() && searchResults.length === 0 ? (
                  <div className="text-center mt-10 px-4">
                    <p className="text-sm text-gray-500">Aucun membre trouvé</p>
                    <p className="text-xs text-gray-400 mt-1">Essayez un autre nom</p>
                  </div>
                ) : searchResults.map(p => (
                  <button key={p.id} onClick={() => startConversation(p)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left">
                    <div className="w-10 h-10 bg-[#166534] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {p.nom?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{p.nom} {p.verifie && '✅'}</p>
                      <p className="text-xs text-gray-400 truncate">{getRoleInfo(p.role).icon} {p.role || 'Membre'} · {p.pays}</p>
                    </div>
                  </button>
                ))}
                {!searchQuery.trim() && (
                  <div className="text-center mt-12 px-4">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="text-sm text-gray-500">Tapez un prénom pour rechercher</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Liste des conversations */}
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-gray-400 mt-4">
                <div className="text-4xl mb-3">💬</div>
                <p className="font-semibold text-gray-600 text-sm mb-1">Aucune conversation</p>
                <p className="text-xs text-gray-400 mb-5">Contactez un vendeur depuis une annonce ou cherchez un membre</p>
                <Link href="/annonces"
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-2 rounded-xl hover:bg-gray-200 transition font-medium">
                  <Search size={11} /> Voir les annonces
                </Link>
              </div>
            ) : (
              conversations.map(({ profile: p, lastMessage, unread: unreadCount }) => {
                const isActive = selectedUser?.id === p?.id
                const isFromMe = lastMessage?.sender_id === user?.id
                return (
                  <button key={p?.id} onClick={() => setSelectedUser(p)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left border-b border-gray-50
                      ${isActive ? 'bg-green-50 border-l-2 border-l-[#166534]' : ''}`}>
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 bg-[#166534] rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {p?.nom?.charAt(0).toUpperCase()}
                      </div>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-800'}`}>
                          {p?.nom}
                        </p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {formatTime(lastMessage?.created_at)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
                        {isFromMe ? <span className="text-gray-400">Vous : </span> : null}
                        {previewContent(lastMessage?.contenu)}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── Zone de chat ── */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-[#f0f2f5] ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Header chat */}
              <div className="bg-white px-3 py-3 border-b border-gray-100 flex items-center gap-3 flex-shrink-0"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <button onClick={() => setSelectedUser(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 transition flex-shrink-0">
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <div className="w-10 h-10 bg-[#166534] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {selectedUser.nom?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate flex items-center gap-1">
                    {selectedUser.nom}
                    {selectedUser.verifie && <span className="text-blue-500 text-xs">✅</span>}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getRoleInfo(selectedUser.role).color}`}>
                    {getRoleInfo(selectedUser.role).icon} {selectedUser.role || 'Membre'}
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {messages.length === 0 && (
                  <div className="text-center py-10 text-gray-400">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-sm">
                      {selectedUser.nom?.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-gray-600 text-sm">{selectedUser.nom}</p>
                    <p className="text-xs mt-1">Commencez la conversation !</p>
                  </div>
                )}
                {messages.map((msg: any, i: number) => {
                  const isMe = msg.sender_id === user?.id
                  const isOffer = msg.contenu?.startsWith('📋 *PROPOSITION')
                  const isImage = msg.contenu?.startsWith('[IMG]')
                  const isTemp = msg.id?.toString().startsWith('tmp-')

                  // Group messages — show time only if > 5 min from previous
                  const prevMsg = messages[i - 1]
                  const showTime = !prevMsg || (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) > 5 * 60 * 1000

                  return (
                    <div key={msg.id}>
                      {showTime && (
                        <div className="text-center my-3">
                          <span className="text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-0.5`}>
                        <div className={`${isOffer ? 'max-w-[85%] sm:max-w-sm' : isImage ? 'max-w-[60%]' : 'max-w-[75%] sm:max-w-sm'}`}>
                          {isImage ? (
                            <img src={msg.contenu.slice(5)} alt="Photo"
                              className={`rounded-2xl max-w-full ${isMe ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                              style={{ maxWidth: '220px' }} />
                          ) : isOffer ? (
                            <div className={`rounded-2xl p-3 border-2 ${isMe ? 'bg-[#166534] text-white border-[#166534] rounded-br-sm' : 'bg-amber-50 text-gray-800 border-amber-300 rounded-bl-sm'}`}>
                              <p className="font-bold text-xs mb-1">📋 Proposition d'accord</p>
                              <p className="whitespace-pre-wrap text-xs leading-relaxed">
                                {msg.contenu.replace("📋 *PROPOSITION D'ACCORD*\n\n", '').replace("\n\n_Cet accord est enregistré sur AgriMarché et servira de référence en cas de litige._", '')}
                              </p>
                              <p className={`text-[10px] mt-2 ${isMe ? 'text-green-200' : 'text-amber-600'}`}>🔒 Enregistré sur AgriMarché</p>
                            </div>
                          ) : (
                            <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? 'bg-[#166534] text-white rounded-br-sm'
                                : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                            }`}>
                              {msg.contenu}
                            </div>
                          )}
                          {isMe && (
                            <div className="flex justify-end mt-0.5">
                              {isTemp
                                ? <Check size={12} className="text-gray-400" />
                                : <CheckCheck size={12} className={msg.lu ? 'text-blue-400' : 'text-gray-400'} />
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Formulaire accord */}
              {showOffer && (
                <div className="px-3 pb-2 bg-white flex-shrink-0">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-2">📋 Proposer un accord formel</p>
                    <textarea
                      value={offerText}
                      onChange={e => setOfferText(e.target.value)}
                      placeholder="Ex : 500 kg de mil à 15 000 FCFA. Départ 10 jan. Paiement Wave à la livraison."
                      rows={3}
                      className="w-full text-sm border border-amber-200 rounded-lg px-3 py-2 bg-white resize-none outline-none focus:border-[#166534]"
                    />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => setShowOffer(false)}
                        className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Annuler
                      </button>
                      <button onClick={sendOffer} disabled={!offerText.trim()}
                        className="flex-1 py-2 text-sm bg-[#166534] text-white rounded-lg hover:bg-green-800 disabled:opacity-50">
                        Envoyer
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {imageError && <p className="px-4 pb-1 text-xs text-red-500 flex-shrink-0">{imageError}</p>}

              {/* Barre d'envoi */}
              <div className="bg-white px-3 py-2 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2 items-center">
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                    className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()}
                    className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition text-gray-500">
                    <ImageIcon size={16} />
                  </button>
                  <button onClick={() => setShowOffer(!showOffer)}
                    className={`hidden sm:flex flex-shrink-0 items-center h-9 bg-amber-50 border border-amber-200 text-amber-700 px-2.5 rounded-xl text-xs font-medium hover:bg-amber-100 transition whitespace-nowrap`}>
                    📋 Accord
                  </button>
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder={`Message à ${selectedUser.nom}...`}
                    className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]/30 min-w-0 h-9"
                  />
                  <MicButton
                    onResult={text => setNewMessage(prev => prev ? prev + ' ' + text : text)}
                    className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200"
                  />
                  <button onClick={() => sendMessage()} disabled={sending || !newMessage.trim()}
                    className="bg-[#166534] text-white w-9 h-9 rounded-full hover:bg-green-800 transition disabled:opacity-40 flex-shrink-0 flex items-center justify-center active:scale-95">
                    <Send size={15} />
                  </button>
                </div>
                <button onClick={() => setShowOffer(!showOffer)}
                  className="sm:hidden mt-1.5 w-full flex items-center justify-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-medium">
                  📋 Proposer un accord
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <div className="text-center px-8">
                <div className="text-6xl mb-4">💬</div>
                <p className="font-bold text-gray-600 mb-1">
                  {conversations.length > 0 ? 'Sélectionnez une conversation' : 'Aucun message'}
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  Contactez un vendeur depuis une annonce ou cherchez un membre
                </p>
                <div className="flex flex-col items-center gap-2">
                  <button onClick={() => setShowSearch(true)}
                    className="inline-flex items-center gap-2 bg-[#166534] text-white text-sm px-6 py-2.5 rounded-xl hover:bg-green-800 transition font-medium">
                    <Search size={14} /> Chercher un membre
                  </button>
                  <Link href="/annonces" className="text-xs text-gray-400 hover:text-[#166534] transition underline">
                    ou parcourir les annonces
                  </Link>
                </div>
              </div>
            </div>
          )}
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
