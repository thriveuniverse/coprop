import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'

function UsersPanel() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)

  async function loadUsers() {
    const { data } = await supabase.from('profiles').select('*').order('created_at')
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function handleDelete(userId, email) {
    if (!window.confirm(`Supprimer l'utilisateur ${email || userId} ? Cette action est irréversible.`)) return
    setDeleting(userId)
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/.netlify/functions/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error || 'Erreur lors de la suppression.') }
    else { setUsers(prev => prev.filter(u => u.id !== userId)) }
    setDeleting(null)
  }

  if (loading) return <p className="text-sm text-gray-400">Chargement…</p>

  return (
    <div>
      <h2 className="font-medium text-gray-800 mb-4">Utilisateurs</h2>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <ul className="space-y-2">
        {users.map(u => (
          <li key={u.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">{u.full_name || '(sans nom)'}</p>
              <p className="text-xs text-gray-500">{u.email || u.id}</p>
              {u.is_admin && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1 inline-block">Admin</span>
              )}
            </div>
            {!u.is_admin && (
              <button
                onClick={() => handleDelete(u.id, u.email || u.full_name)}
                disabled={deleting === u.id}
                className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
              >
                {deleting === u.id ? 'Suppression…' : 'Supprimer'}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Admin() {
  const [tab, setTab] = useState('overview')

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500 mt-1">Accès réservé au syndic.</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {[['overview', 'Vue d\'ensemble'], ['users', 'Utilisateurs']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-medium text-gray-800 mb-1">Lots & Contacts</h2>
            <p className="text-sm text-gray-500">Gérer les 5 lots et leurs propriétaires.</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-medium text-gray-800 mb-1">Règlement de copropriété</h2>
            <p className="text-sm text-gray-500">Téléverser le PDF et vérifier la conformité des propositions.</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-medium text-gray-800 mb-1">Signatures (Yousign)</h2>
            <p className="text-sm text-gray-500">Suivre les demandes de signature en cours.</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="font-medium text-gray-800 mb-1">Notifications AG</h2>
            <p className="text-sm text-gray-500">Envoyer les convocations aux copropriétaires.</p>
            <button className="mt-3 text-sm text-blue-600 hover:underline">Ouvrir →</button>
          </div>
        </div>
      )}

      {tab === 'users' && <UsersPanel />}
    </Layout>
  )
}
