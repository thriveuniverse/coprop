import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ children }) {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-semibold text-gray-800">Copropriété</span>
          <Link to="/proposals" className="text-sm text-gray-600 hover:text-gray-900">Propositions</Link>
          <Link to="/decisions" className="text-sm text-gray-600 hover:text-gray-900">Décisions</Link>
          {isAdmin && (
            <Link to="/admin" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Admin</Link>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          Déconnexion
        </button>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
