import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ColorAdjuster from '../components/ColorAdjuster'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <img src="/nomnom-icon-no_bg.png" alt="NomNom mascot" className="w-32 h-32 drop-shadow-lg" />

        <h1 className="text-5xl font-extrabold text-lily tracking-tight">NomNom</h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-ivory border-2 border-lily text-lily placeholder:text-lily/50 rounded-2xl px-4 py-3 text-base font-semibold outline-none focus:border-lily/80"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full bg-ivory border-2 border-lily text-lily placeholder:text-lily/50 rounded-2xl px-4 py-3 text-base font-semibold outline-none focus:border-lily/80"
          />

          {error && (
            <p className="text-center text-sm font-bold text-lily/80">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full border-2 border-lily text-lily rounded-full py-3 text-base font-extrabold hover:bg-lily hover:text-primary transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
      {import.meta.env.DEV && <ColorAdjuster />}
    </div>
  )
}
