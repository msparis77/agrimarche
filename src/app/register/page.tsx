'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useLang } from '@/hooks/useLang'

const COUNTRIES = ['Sénégal', 'Gambie', 'Guinée', 'France', 'Autre']

export default function RegisterPage() {
  const { t } = useLang()
  const router = useRouter()
  const [form, setForm] = useState({
    nom: '',
    email: '',
    password: '',
    telephone: '',
    pays: 'Sénégal',
    role: 'acheteur' as 'vendeur' | 'acheteur',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nom: form.nom,
          telephone: form.telephone,
          pays: form.pays,
          role: form.role,
        }
      }
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Update profile after signup
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({
        nom: form.nom,
        telephone: form.telephone,
        pays: form.pays,
        role: form.role,
      }).eq('id', user.id)
    }

    router.push('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <span className="text-4xl block mb-2">🌾</span>
          <h1 className="text-2xl font-bold text-gray-900">{t.auth.register_title}</h1>
          <p className="text-gray-500 text-sm mt-1">AgriMarché — Afrique de l'Ouest</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t.auth.role}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['acheteur', 'vendeur'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition ${
                    form.role === r
                      ? 'border-[#0a4a2f] bg-[#0a4a2f] text-white'
                      : 'border-gray-200 text-gray-700 hover:border-[#0a4a2f]'
                  }`}
                >
                  {r === 'acheteur' ? `🛒 ${t.auth.buyer}` : `🏪 ${t.auth.seller}`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.name}</label>
            <input
              required
              value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              placeholder="Mamadou Diallo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.email}</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              placeholder="vous@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.phone}</label>
            <input
              value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              placeholder="+221 77 000 00 00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.country}</label>
            <select
              value={form.pays}
              onChange={e => setForm({ ...form, pays: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.auth.password}</label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
              placeholder="Min. 6 caractères"
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
            {loading ? 'Création...' : t.auth.register_btn}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {t.auth.has_account}{' '}
          <Link href="/login" className="text-[#0a4a2f] font-semibold hover:underline">
            {t.auth.login_btn}
          </Link>
        </p>
      </div>
    </div>
  )
}
