import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth({ roles, children }) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="page-loader" role="status"><span className="page-loader-spinner" /></div>
  if (!session || !profile || profile.is_blocked) return <Navigate to="/login" replace state={{ from: location }} />
  if (profile.must_change_password && location.pathname !== '/change-password') return <Navigate to="/change-password" replace />
  if (roles && !roles.includes(profile.role)) return <Navigate to="/account" replace />
  return children
}
