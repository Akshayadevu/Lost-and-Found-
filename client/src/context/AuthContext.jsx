import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api('/auth/me').then(({ user: currentUser }) => setUser(currentUser)).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(credentials) })
    setUser(data.user)
    return data
  }

  async function register(details) {
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(details) })
    setUser(data.user)
    return data
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
