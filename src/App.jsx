import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Proposals from './pages/Proposals'
import Decisions from './pages/Decisions'
import Admin from './pages/Admin'
import Account from './pages/Account'
import ProposalDetail from './pages/ProposalDetail'

function GuestRoute({ children }) {
  const { session } = useAuth()
  if (session === undefined) return null
  if (session) return <Navigate to="/proposals" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
          <Route path="/decisions" element={<ProtectedRoute><Decisions /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/proposals/:id" element={<ProtectedRoute><ProposalDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/proposals" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
