import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('password') // 'password' | 'magic'
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (mode === 'password') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/proposals` },
      })
      if (error) setError(error.message)
      else setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-semibold text-gray-800 mb-1">Copropriété</h1>
        <p className="text-sm text-gray-500 mb-6">Gouvernance & décisions</p>

        {sent ? (
          <div className="text-center">
            <p className="text-green-700 font-medium">Lien envoyé !</p>
            <p className="text-sm text-gray-500 mt-2">Vérifiez votre boîte email pour vous connecter.</p>
            <button onClick={() => { setSent(false); setMode('password') }} className="mt-4 text-sm text-blue-600 hover:underline">
              Retour
            </button>
          </div>
        ) : (
          <>
            <div className="flex rounded border border-gray-200 mb-5 text-sm overflow-hidden">
              <button
                type="button"
                onClick={() => { setMode('password'); setError(null) }}
                className={`flex-1 py-2 ${mode === 'password' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Mot de passe
              </button>
              <button
                type="button"
                onClick={() => { setMode('magic'); setError(null) }}
                className={`flex-1 py-2 ${mode === 'magic' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Lien magique
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="vous@exemple.fr"
                />
              </div>

              {mode === 'password' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Connexion…' : mode === 'password' ? 'Se connecter' : 'Recevoir un lien'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
