import { createContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { meApi, logoutApi } from '../api/auth.api'
import Spinner from '../components/ui/Spinner'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      const savedToken = localStorage.getItem('lab_token')
      const savedUser = localStorage.getItem('lab_user')

      if (!savedToken) {
        setLoading(false)
        return
      }

      setToken(savedToken)
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          setUser(null)
        }
      }

      try {
        const { data } = await meApi()
        setUser(data.user)
        localStorage.setItem('lab_user', JSON.stringify(data.user))
      } catch {
        localStorage.removeItem('lab_token')
        localStorage.removeItem('lab_user')
        setUser(null)
        setToken(null)
      } finally {
        setLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const login = (nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
    localStorage.setItem('lab_token', nextToken)
    localStorage.setItem('lab_user', JSON.stringify(nextUser))
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {
      // ignore logout network errors
    }

    localStorage.removeItem('lab_token')
    localStorage.removeItem('lab_user')
    setToken(null)
    setUser(null)
    navigate('/login')
  }

  const value = useMemo(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading],
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4 text-surface-muted">
          <Spinner size="lg" />
          <p>Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
