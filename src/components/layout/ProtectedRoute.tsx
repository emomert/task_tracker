import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { LoadingArea } from '../ui/Spinner'

/** Gate for app routes: redirect logged-out users to the login page. */
export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingArea />
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

/** Gate for auth pages: send already-logged-in users into the app. */
export function PublicOnlyRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingArea />
      </div>
    )
  }
  if (session) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
