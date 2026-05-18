import { createContext, useContext, useState, ReactNode } from 'react'

interface AuthContextValue {
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nom_token'))

  const login = async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password })
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) {
      throw new Error('Invalid email or password')
    }
    const data = await res.json()
    localStorage.setItem('nom_token', data.access_token)
    setToken(data.access_token)
  }

  const logout = () => {
    localStorage.removeItem('nom_token')
    setToken(null)
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
