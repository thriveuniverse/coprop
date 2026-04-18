import { useState } from 'react'
import { supabase } from '../lib/supabase'

const MODES = {
  login: 'login',
  register: 'register',
  magic: 'magic',
}

export default function Login() {
  const [mode, setMode] = useState(MODES.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  function switchMode(m) {
    setMode(m)
    setError(null)
    setSuccess(null)
    setPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === MODES.login) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      // on success AuthContext picks up the session and App redirects automatically

    } else if (mode === MODES.register) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/proposals`,
        },
      })
      if (error) setError(error.message)
      else setSuccess('Vérifiez votre email pour confirmer votre compte.')

    } else if (mode === MODES.magic) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/proposals` },
      })
      if (error) setError(error.message)
      else setSuccess('Lien envoyé — vérifiez votre boîte email.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Copropriété</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gouvernance & décisions</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <TabButton active={mode === MODES.login} onClick={() => switchMode(MODES.login)}>
            Connexion
          </TabButton>
          <TabButton active={mode === MODES.register} onClick={() => switchMode(MODES.register)}>
            Créer un compte
          </TabButton>
          <TabButton active={mode === MODES.magic} onClick={() => switchMode(MODES.magic)}>
            Lien magique
          </TabButton>
        </div>

        {/* Form */}
        <div className="px-8 py-6">
          {success ? (
            <div className="text-center py-2">
              <p className="text-green-700 text-sm font-medium">{success}</p>
              <button
                onClick={() => { setSuccess(null); setMode(MODES.login) }}
                className="mt-4 text-sm text-blue-600 hover:underline"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">

              {mode === MODES.register && (
                <Field label="Nom complet">
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Prénom Nom"
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className={inputClass}
                />
              </Field>

              {(mode === MODES.login || mode === MODES.register) && (
                <Field label={mode === MODES.register ? 'Mot de passe (min. 8 caractères)' : 'Mot de passe'}>
                  <input
                    type="password"
                    required
                    minLength={mode === MODES.register ? 8 : undefined}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={inputClass}
                  />
                </Field>
              )}

              {mode === MODES.magic && (
                <p className="text-xs text-gray-500">
                  Vous recevrez un lien de connexion par email — utile si vous avez oublié votre mot de passe.
                </p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Chargement…' : {
                  [MODES.login]: 'Se connecter',
                  [MODES.register]: 'Créer le compte',
                  [MODES.magic]: 'Envoyer le lien',
                }[mode]}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
