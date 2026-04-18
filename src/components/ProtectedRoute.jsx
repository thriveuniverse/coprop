import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }) {
  const { session } = useAuth()
  if (session === undefined) return null // still loading
  if (!session) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const { session, isAdmin } = useAuth()
  if (session === undefined) return null
  if (!session) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/proposals" replace />
  return children
}
