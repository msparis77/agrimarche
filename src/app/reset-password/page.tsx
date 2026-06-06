'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Une erreur est survenue. Réessayez.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 3000)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-yellow-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        {success ? (
          <div className="text-center">
            <span className="text-5xl block mb-4">✅</span>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Mot de passe mis à jour !</h1>
            <p className="text-gray-500 text-sm">Vous allez être redirigé automatiquement...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <span className="text-4xl block mb-2">🔑</span>
              <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
              <p className="text-gray-500 text-sm mt-1">Choisissez un nouveau mot de passe sécurisé</p>
            </div>

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                  placeholder="Minimum 6 caractères"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0a4a2f]"
                  placeholder="Répétez le mot de passe"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0a4a2f] text-white font-bold py-3.5 rounded-xl hover:bg-green-900 transition disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Confirmer le nouveau mot de passe'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
