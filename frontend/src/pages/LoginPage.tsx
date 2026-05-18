import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    } catch {
      setError('Nieprawidłowy login lub hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-primary flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <img src="/nomnom-icon-no_bg.png" alt="NomNom" className="w-50 h-50" />
          <h1 className="text-5xl font-extrabold text-lily tracking-tight">NomNom</h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="text"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ borderRadius: '4px 18px 6px 16px / 18px 4px 16px 6px' }}
            className="w-full bg-ivory border-[3px] border-lily text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none focus:border-lily/70"
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ borderRadius: '16px 5px 18px 4px / 5px 16px 4px 18px' }}
            className="w-full bg-ivory border-[3px] border-lily text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none focus:border-lily/70"
          />

          {error && (
            <p className="text-center text-sm font-bold text-lily/80">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-fill mt-2 w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            {loading ? 'Logowanie…' : 'Zaloguj się'}
          </button>
        </form>

        <p className="text-lily/70 text-sm font-semibold">
          Nie masz konta?{' '}
          <button type="button" className="text-lily font-extrabold underline underline-offset-2 hover:text-lily/80 transition-colors cursor-pointer">
            Zarejestruj się
          </button>
        </p>
      </div>
    </div>
  )
}
