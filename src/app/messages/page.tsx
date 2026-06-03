'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { supabase, Message, Profile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useLang } from '@/hooks/useLang'

export default function MessagesPage() {
  const { user } = useAuth()
  const { t } = useLang()
  const router = useRouter()
  const [conversations, setConversations] = useState<{ profile: Profile; lastMessage: Message }[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) router.push('/login')
    else fetchConversations()
  }, [user])

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser.id)
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    // Get all messages involving this user
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
      .order('created_at', { ascending: false })

    if (!data) return

    // Group by conversation partner
    const convMap = new Map()
    data.forEach((msg: any) => {
      const partner = msg.sender_id === user?.id ? msg.receiver : msg.sender
      if (!convMap.has(partner?.id)) {
        convMap.set(partner?.id, { profile: partner, lastMessage: msg })
      }
    })
    setConversations(Array.from(convMap.values()))
  }

  const fetchMessages = async (partnerId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:sender_id(*), receiver:receiver_id(*)')
      .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user?.id})`)
      .order('created_at', { ascending: true })
    setMessages(data || [])

    // Mark as read
    if (user) {
      await supabase.from('messages').update({ lu: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', partnerId)
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedUser || !newMessage.trim()) return
    await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selectedUser.id,
      contenu: newMessage,
    })
    setNewMessage('')
    fetchMessages(selectedUser.id)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.nav.messages}</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: '70vh' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-100 flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm mt-8">
                  Aucune conversation
                </div>
              ) : (
                conversations.map(({ profile: p, lastMessage }) => (
                  <button
                    key={p?.id}
                    onClick={() => setSelectedUser(p)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left ${selectedUser?.id === p?.id ? 'bg-green-50' : ''}`}
                  >
                    <div className="w-10 h-10 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {p?.nom?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{p?.nom}</p>
                      <p className="text-xs text-gray-400 truncate">{lastMessage.contenu}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedUser.nom?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedUser.nom}</p>
                    <p className="text-xs text-gray-400">{selectedUser.pays}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender_id === user?.id
                          ? 'bg-[#0a4a2f] text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                      }`}>
                        {msg.contenu}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="Écrire un message..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0a4a2f]"
                  />
                  <button
                    onClick={sendMessage}
                    className="bg-[#0a4a2f] text-white p-2.5 rounded-xl hover:bg-green-900 transition"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">💬</div>
                  <p>Sélectionnez une conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
