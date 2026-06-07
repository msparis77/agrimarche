'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MessageSquare, Plus, Eye, ChevronRight, ArrowLeft, Send, X, ImagePlus, Loader2 } from 'lucide-react'
import MicButton from '@/components/MicButton'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

const CATEGORIES = [
  { id: 'General', label: '💬 Général', color: 'bg-gray-100 text-gray-700' },
  { id: 'Prix', label: '💰 Prix du marché', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'Technique', label: '🌱 Technique agricole', color: 'bg-green-100 text-green-700' },
  { id: 'Meteo', label: '🌤 Météo & Saisons', color: 'bg-blue-100 text-blue-700' },
  { id: 'Entraide', label: '🤝 Entraide', color: 'bg-purple-100 text-purple-700' },
]

type Post = {
  id: string
  titre: string
  contenu: string
  categorie: string
  vues: number
  created_at: string
  user_id: string
  profiles?: { nom: string; pays: string; role: string }
  forum_comments?: { count: number }[]
}

type Comment = {
  id: string
  contenu: string
  created_at: string
  profiles?: { nom: string; pays: string }
}

type AIMessage = {
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
}

export default function ForumPage() {
  const { user, profile } = useAuth()
  const router = useRouter()

  // Forum state
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [showNewPost, setShowNewPost] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [submitting, setSubmitting] = useState(false)
  const [postError, setPostError] = useState('')
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [categorie, setCategorie] = useState('General')

  // AgriAssistant state
  const [showAssistant, setShowAssistant] = useState(false)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imageMediaType, setImageMediaType] = useState<string>('image/jpeg')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const aiEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchPosts() }, [activeCategory])
  useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [aiMessages, aiLoading])

  // ── Forum functions ──

  const fetchPosts = async () => {
    setLoading(true)
    let query = supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (activeCategory !== 'all') query = query.eq('categorie', activeCategory)
    const { data, error } = await query
    if (!error) setPosts(data || [])
    setLoading(false)
  }

  const openPost = async (post: Post) => {
    await supabase.from('forum_posts').update({ vues: (post.vues || 0) + 1 }).eq('id', post.id)
    setSelectedPost({ ...post, vues: (post.vues || 0) + 1 })
    const { data } = await supabase
      .from('forum_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  const submitComment = async () => {
    if (!user) { router.push('/login'); return }
    if (!newComment.trim() || !selectedPost) return
    setSubmitting(true)
    const { error } = await supabase
      .from('forum_comments')
      .insert({ post_id: selectedPost.id, user_id: user.id, contenu: newComment.trim() })
    if (!error) {
      setNewComment('')
      const { data } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('post_id', selectedPost.id)
        .order('created_at', { ascending: true })
      setComments(data || [])
    }
    setSubmitting(false)
  }

  const submitPost = async () => {
    if (!user) { router.push('/login'); return }
    if (!titre.trim() || !contenu.trim()) return
    setSubmitting(true)
    setPostError('')
    try {
      const { error } = await supabase
        .from('forum_posts')
        .insert({ user_id: user.id, titre: titre.trim(), contenu: contenu.trim(), categorie })
      if (error) {
        setPostError(error.message || 'Erreur lors de la publication')
      } else {
        setTitre(''); setContenu(''); setCategorie('General'); setShowNewPost(false)
        await fetchPosts()
      }
    } catch (e: any) {
      setPostError(e?.message || 'Erreur inattendue')
    }
    setSubmitting(false)
  }

  // ── AgriAssistant functions ──

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const mediaType = file.type || 'image/jpeg'
    setImageMediaType(mediaType)
    setPreviewUrl(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImageBase64(result.split(',')[1])
    }
    reader.readAsDataURL(file)
    // reset input so same file can be re-selected
    e.target.value = ''
  }

  const removeImage = () => {
    setPreviewUrl(null)
    setImageBase64(null)
  }

  const sendToAI = async () => {
    const textToSend = aiInput.trim()
    const imageToSend = imageBase64
    const imagePreview = previewUrl
    const mediaType = imageMediaType

    if (!textToSend && !imageToSend) return

    // Build user message for display
    const userMsg: AIMessage = {
      role: 'user',
      content: textToSend || 'Analyse cette image et dis-moi ce que tu vois.',
      imageUrl: imagePreview || undefined,
    }

    // Clear inputs immediately
    setAiInput('')
    setPreviewUrl(null)
    setImageBase64(null)
    setAiLoading(true)

    const newMessages = [...aiMessages, userMsg]
    setAiMessages(newMessages)

    // Build messages for API
    const apiMessages = newMessages.map((m) => {
      if (m.imageUrl && m === userMsg && imageToSend) {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageToSend,
              },
            },
            { type: 'text', text: m.content },
          ],
        }
      }
      return { role: m.role, content: m.content }
    })

    try {
      const response = await fetch('/api/agri-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await response.json()
      const reply = data.reply || data.error || "Désolé, je n'ai pas pu répondre. Réessayez."
      setAiMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: "Désolé, une erreur s'est produite. Vérifiez votre connexion et réessayez.",
      }])
    }

    setAiLoading(false)
  }

  // ── Helpers ──

  const getCatStyle = (id: string) =>
    CATEGORIES.find(c => c.id === id)?.color || 'bg-gray-100 text-gray-700'

  const getCatLabel = (id: string) =>
    CATEGORIES.find(c => c.id === id)?.label || id

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `il y a ${mins} min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `il y a ${hrs}h`
    return `il y a ${Math.floor(hrs / 24)}j`
  }

  // ─── AgriAssistant view ────────────────────────────────────────
  if (showAssistant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => setShowAssistant(false)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#0a4a2f] mb-6 text-sm transition"
        >
          <ArrowLeft size={16} /> Retour au forum
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#0a4a2f] to-[#1a7a4f] rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">🤖</div>
            <div>
              <h1 className="text-xl font-bold">AgriAssistant IA</h1>
              <p className="text-green-200 text-sm">Votre expert agricole intelligent</p>
            </div>
          </div>
          <p className="text-green-100 text-sm leading-relaxed">
            Posez vos questions sur l'agriculture ou envoyez une photo de votre plante.
            Je vous donne un diagnostic et des conseils adaptés à l'Afrique de l'Ouest.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {[
              '🌿 Ma plante jaunit',
              '🐛 J\'ai des parasites',
              '💧 Comment arroser ?',
              '🌱 Quel engrais ?',
              '📦 Comment stocker ?',
            ].map((tag, i) => (
              <button
                key={i}
                onClick={() => setAiInput(tag)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1 rounded-full transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-4 min-h-48">
          {aiMessages.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🌾</div>
              <p className="font-medium text-gray-600">Bonjour ! Je suis AgriAssistant.</p>
              <p className="text-sm mt-1">Posez votre question ou envoyez une photo de votre culture.</p>
            </div>
          )}

          {aiMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${msg.role === 'assistant' ? 'w-full' : 'max-w-xs'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 bg-[#0a4a2f] rounded-full flex items-center justify-center text-xs">🤖</div>
                    <span className="text-xs font-medium text-[#0a4a2f]">AgriAssistant</span>
                  </div>
                )}
                {msg.imageUrl && (
                  <img
                    src={msg.imageUrl}
                    alt="Photo envoyée"
                    className="w-full max-w-xs rounded-xl mb-2 object-cover"
                  />
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#0a4a2f] text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[#0a4a2f]" />
                <span className="text-sm text-gray-500">AgriAssistant analyse...</span>
              </div>
            </div>
          )}
          <div ref={aiEndRef} />
        </div>

        {/* Image preview */}
        {previewUrl && (
          <div className="mb-3 relative inline-block">
            <img src={previewUrl} alt="Aperçu" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
          <div className="flex gap-2 items-end">
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-2.5 text-gray-400 hover:text-[#0a4a2f] border border-gray-200 rounded-xl hover:border-[#0a4a2f] transition"
              title="Envoyer une photo de plante"
            >
              <ImagePlus size={18} />
            </button>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendToAI()
                }
              }}
              placeholder="Posez votre question ou envoyez une photo 📸"
              rows={2}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-[#0a4a2f] transition"
            />
            <MicButton
              onResult={text => setAiInput(prev => prev ? prev + ' ' + text : text)}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200"
            />
            <button
              onClick={sendToAI}
              disabled={aiLoading || (!aiInput.trim() && !imageBase64)}
              className="flex-shrink-0 bg-[#0a4a2f] text-white p-2.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            📸 Envoyez une photo de plante malade pour un diagnostic instantané
          </p>
        </div>
      </div>
    )
  }

  // ─── Post detail view ──────────────────────────────────────────
  if (selectedPost) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedPost(null)}
          className="flex items-center gap-2 text-gray-500 hover:text-[#0a4a2f] mb-6 text-sm transition"
        >
          <ArrowLeft size={16} /> Retour au forum
        </button>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-start justify-between mb-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getCatStyle(selectedPost.categorie)}`}>
              {getCatLabel(selectedPost.categorie)}
            </span>
            <span className="text-xs text-gray-400">{timeAgo(selectedPost.created_at)}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-3">{selectedPost.titre}</h1>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedPost.contenu}</p>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white text-sm font-bold">
                {selectedPost.profiles?.nom?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{selectedPost.profiles?.nom || 'Membre'}</p>
                <p className="text-xs text-gray-400">{selectedPost.profiles?.pays} · {selectedPost.profiles?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Eye size={12} /> {selectedPost.vues}</span>
              <span className="flex items-center gap-1"><MessageSquare size={12} /> {comments.length}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {comments.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">Soyez le premier à répondre 👇</div>
          )}
          {comments.map(c => (
            <div key={c.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center text-[#0a4a2f] text-xs font-bold">
                  {c.profiles?.nom?.charAt(0).toUpperCase() || '?'}
                </div>
                <p className="text-sm font-medium text-gray-800">{c.profiles?.nom || 'Membre'}</p>
                <span className="text-xs text-gray-400 ml-auto">{timeAgo(c.created_at)}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed pl-9">{c.contenu}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {!user ? (
            <div className="text-center py-3">
              <p className="text-sm text-gray-500 mb-3">Connectez-vous pour répondre</p>
              <Link href="/login" className="bg-[#0a4a2f] text-white px-5 py-2 rounded-xl text-sm font-medium">
                Se connecter
              </Link>
            </div>
          ) : (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 bg-[#0a4a2f] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {profile?.nom?.charAt(0).toUpperCase() || '?'}
              </div>
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Votre réponse..."
                rows={2}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none outline-none focus:border-[#0a4a2f] transition"
              />
              <MicButton
                onResult={text => setNewComment(prev => prev ? prev + ' ' + text : text)}
                className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200"
              />
              <button
                onClick={submitComment}
                disabled={submitting || !newComment.trim()}
                className="bg-[#0a4a2f] text-white p-2.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50 flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Forum list view ───────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌾 Forum Agri'Culture</h1>
          <p className="text-gray-500 text-sm mt-0.5">Échangez avec les agriculteurs d'Afrique de l'Ouest</p>
        </div>
        <button
          onClick={() => user ? setShowNewPost(true) : router.push('/login')}
          className="flex items-center gap-2 bg-[#0a4a2f] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-900 transition"
        >
          <Plus size={16} /> Nouveau sujet
        </button>
      </div>

      {/* AgriAssistant banner */}
      <button
        onClick={() => setShowAssistant(true)}
        className="w-full bg-gradient-to-r from-[#0a4a2f] to-[#1a7a4f] rounded-2xl p-4 mb-6 text-left hover:opacity-95 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
          <div className="flex-1">
            <p className="font-bold text-white">AgriAssistant IA</p>
            <p className="text-green-200 text-sm">Plante malade ? Question agricole ? Envoyez une photo ou posez votre question !</p>
          </div>
          <ChevronRight size={20} className="text-white flex-shrink-0" />
        </div>
      </button>

      {/* Categories filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
            activeCategory === 'all' ? 'bg-[#0a4a2f] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0a4a2f]'
          }`}
        >
          🌍 Tous
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition ${
              activeCategory === cat.id ? 'bg-[#0a4a2f] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#0a4a2f]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-4">💬</span>
          <p className="font-medium">Aucun sujet pour l'instant</p>
          <p className="text-sm mt-1">Soyez le premier à lancer la discussion !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <button
              key={post.id}
              onClick={() => openPost(post)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-[#166534] hover:shadow-md transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#166534]/10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
                  {getCatLabel(post.categorie).split(' ')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getCatStyle(post.categorie)}`}>
                      {getCatLabel(post.categorie).split(' ').slice(1).join(' ')}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(post.created_at)}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1">{post.titre}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{post.contenu}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#166534] rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {post.profiles?.nom?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{post.profiles?.nom || 'Membre'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                    <MessageSquare size={10} /> {(post.forum_comments as any)?.[0]?.count || 0}
                  </span>
                  <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full">
                    <Eye size={10} /> {post.vues}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New post modal */}
      {showNewPost && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-gray-900">Nouveau sujet</h2>
              <button onClick={() => { setShowNewPost(false); setPostError('') }} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Catégorie</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategorie(cat.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        categorie === cat.id ? 'bg-[#0a4a2f] text-white' : cat.color
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Titre</label>
                <div className="relative">
                  <input
                    type="text"
                    value={titre}
                    onChange={e => setTitre(e.target.value)}
                    placeholder="Ex: Prix du mil à Dakar cette semaine ?"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#0a4a2f] transition"
                  />
                  <MicButton
                    onResult={text => setTitre(prev => prev ? prev + ' ' + text : text)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
                <div className="relative">
                  <textarea
                    value={contenu}
                    onChange={e => setContenu(e.target.value)}
                    placeholder="Décrivez votre sujet..."
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm resize-none outline-none focus:border-[#0a4a2f] transition"
                  />
                  <MicButton
                    onResult={text => setContenu(prev => prev ? prev + ' ' + text : text)}
                    className="absolute right-3 top-3"
                  />
                </div>
              </div>
              {postError && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
                  ⚠️ {postError}
                </div>
              )}
              <button
                onClick={submitPost}
                disabled={submitting || !titre.trim() || !contenu.trim()}
                className="w-full bg-[#0a4a2f] text-white py-3 rounded-xl font-medium text-sm hover:bg-green-900 transition disabled:opacity-50"
              >
                {submitting ? 'Publication...' : 'Publier le sujet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}