'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'

export default function LoginPage() {
  const { t } = useLang()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">🌾</span>
          <h1 className="text-2xl font-bold text-gray-900">{t.auth.login_title}</h1>
          <p className="text-gray-500 text-sm mt-1">AgriMarché — Afrique de l'Ouest</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              placeholder="vous@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
          >
            {loading ? 'Connexion...' : t.auth.login_btn}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.no_account}{' '}
          <Link href="/register" className="text-[#0a4a2f] font-semibold hover:underline">
            {t.auth.register_btn}
          </Link>
        </p>
      </div>
    </div>
  )
}
