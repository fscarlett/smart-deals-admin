import { useAuth } from '@clerk/react'
import { Navigate, Outlet, useLocation } from 'react-router'

function ProtectedRoute() {
  const { isLoaded, isSignedIn } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return null
  }

  if (!isSignedIn) {
    return <Navigate to='/' replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute
