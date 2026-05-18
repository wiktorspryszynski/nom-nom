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

        {/* SIGN-UP OPTION A — text link. Enable by changing false → true */}
        {true && (
          <p className="text-lily/70 text-sm font-semibold">
            Nie masz konta?{' '}
            <button type="button" className="text-lily font-extrabold underline underline-offset-2 hover:text-lily/80 transition-colors cursor-pointer">
              Zarejestruj się
            </button>
          </p>
        )}

        {/* SIGN-UP OPTION B — divider + GitHub button. Enable by changing false → true */}
        {false && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-lily/30" />
              <span className="text-xs font-bold text-lily/50 whitespace-nowrap">nie masz konta?</span>
              <div className="flex-1 h-px bg-lily/30" />
            </div>
            <button
              type="button"
              className="btn-fill-dark w-full flex items-center justify-center gap-2 bg-white border-2 border-black text-black rounded-full py-3 text-base font-extrabold cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Zarejestruj się przez GitHub
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
