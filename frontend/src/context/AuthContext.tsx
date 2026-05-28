import { useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './authTypes'

async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nom_token'))
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showDemoModal, setShowDemoModal] = useState(false)

  const _applyToken = async (newToken: string, triggerDemoModal = false) => {
    localStorage.setItem('nom_token', newToken)
    setToken(newToken)
    const me = await fetchMe(newToken)
    setUser(me)
    if (triggerDemoModal && me.account_type === 'demo') {
      if (!sessionStorage.getItem('nomnom_demo_banner_seen')) {
        setShowDemoModal(true)
      }
    }
  }

  const login = async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password })
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    if (!res.ok) throw new Error('Invalid email or password')
    const data = await res.json()
    await _applyToken(data.access_token, true)
  }

  const loginWithToken = async (newToken: string) => {
    await _applyToken(newToken, true)
  }

  const logout = () => {
    localStorage.removeItem('nom_token')
    sessionStorage.removeItem('nomnom_demo_banner_seen')
    setToken(null)
    setUser(null)
    setShowDemoModal(false)
  }

  const refreshUser = async () => {
    if (!token) return
    const me = await fetchMe(token)
    setUser(me)
  }

  return (
    <AuthContext.Provider value={{ token, user, showDemoModal, setShowDemoModal, login, loginWithToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}
