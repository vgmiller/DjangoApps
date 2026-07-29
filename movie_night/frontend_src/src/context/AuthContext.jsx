import { useState, useEffect } from 'react'
import { getMe, logout as apiLogout } from '../api/auth'
import { AuthContext } from './authContextValue'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // No JWT to inspect client-side anymore -- auth is a Django session
  // cookie, so we determine auth status by asking the "who am I" endpoint.
  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // Called after a successful login/register call, which already set the
  // session cookie via Set-Cookie -- nothing to store client-side, just
  // refresh who the current user is.
  const signIn = () => getMe().then(setUser)

  const signOut = () => {
    apiLogout().catch(() => {}).finally(() => setUser(null))
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
