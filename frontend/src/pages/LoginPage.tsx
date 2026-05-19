import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SMALL_ICON_NO_BG } from '../assets'

function DemoRequestForm() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'duplicate' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (res.status === 409) { setStatus('duplicate'); return }
      if (!res.ok) throw new Error()
      setStatus('done')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') return (
    <p className="text-center text-sm font-bold text-lily">
      Dzięki, {name}! Odezwiemy się wkrótce. 🎉
    </p>
  )

  if (!open) return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer"
    >
      Poproś o dostęp demo
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <input
        type="text"
        placeholder="Imię"
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={{ borderRadius: '12px 4px 14px 6px / 4px 12px 6px 14px' }}
        className="w-full bg-ivory border-[3px] border-lily text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none focus:border-lily/70"
      />
      <input
        type="text"
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ borderRadius: '6px 14px 4px 12px / 14px 6px 12px 4px' }}
        className="w-full bg-ivory border-[3px] border-lily text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none focus:border-lily/70"
      />
      {status === 'duplicate' && (
        <p className="text-center text-sm font-bold text-lily/80">Ten e-mail już wysłał zgłoszenie.</p>
      )}
      {status === 'error' && (
        <p className="text-center text-sm font-bold text-lily/80">Coś poszło nie tak, spróbuj ponownie.</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-default"
      >
        {status === 'loading' ? 'Wysyłanie…' : 'Poproś o dostęp demo'}
      </button>
    </form>
  )
}

function SignUpExplanation() {
  const [open, setOpen] = useState(false)
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-lily/30" />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-xs font-bold text-lily/50 whitespace-nowrap cursor-pointer hover:text-lily/80 transition-colors"
        >
          informacja o rejestracji {open ? '▲' : '▼'}
        </button>
        <div className="flex-1 h-px bg-lily/30" />
      </div>
      {open && (
        <p className="text-center text-sm font-semibold text-lily/70 leading-relaxed">
          NomNom korzysta z AI, które generuje realne koszty.<br />
          Na razie aplikacja dostępna jest tylko dla zaproszonych osób.
          <br /><br />
          Jeśli chcesz spróbować, skontaktuj się ze mną bezpośrednio.
        </p>
      )}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoActive, setLogoActive] = useState(false)

  // Swap LOGO_ACTIVE in assets.ts when the active variant is ready
  const LOGO_DEFAULT = SMALL_ICON_NO_BG
  const LOGO_ACTIVE = SMALL_ICON_NO_BG
  const optionToDisplay: number | null = null // 1- text link, 2- GitHub, 3- demo form, 4- explanation. Set to null to hide all.

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
          <div className="relative flex justify-center">
            {logoActive && (
              <div className="absolute bottom-full mb-3 w-56 bg-ivory rounded-2xl px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.14)]">
                <p className="text-sm font-semibold text-lily leading-relaxed">
                  Planuję jadłospis, śledzę kalorie i pomagam jeść mądrzej 🥗
                </p>
              </div>
            )}
            <img
              src={logoActive ? LOGO_ACTIVE : LOGO_DEFAULT}
              alt="NomNom"
              className={`w-50 h-50 cursor-pointer select-none transition-transform duration-500 ease-in-out ${
                logoActive ? 'scale-95' : 'scale-100 hover:scale-[1.03]'
              }`}
              onClick={() => setLogoActive(o => !o)}
            />
          </div>
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

        {/* SIGN-UP OPTION 1 — text link. */}
        {optionToDisplay === 1 && (
          <p className="text-lily/70 text-sm font-semibold">
            Nie masz konta?{' '}
            <button type="button" className="text-lily font-extrabold underline underline-offset-2 hover:text-lily/80 transition-colors cursor-pointer">
              Zarejestruj się
            </button>
          </p>
        )}

        {/* SIGN-UP OPTION 2 — divider + GitHub button. */}
        {optionToDisplay === 2 && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-lily/30" />
              <span className="text-xs font-bold text-lily/50 whitespace-nowrap">lub zarejestruj się</span>
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

        {/* SIGN-UP OPTION 3 — demo request form. */}
        {optionToDisplay === 3 && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-lily/30" />
              <span className="text-xs font-bold text-lily/50 whitespace-nowrap">lub zgłoś chęć demo</span>
              <div className="flex-1 h-px bg-lily/30" />
            </div>
            <DemoRequestForm />
          </div>
        )}

        {/* SIGN-UP OPTION 4 — explanation why sign-up is unavailable. */}
        {optionToDisplay === 4 &&
          <SignUpExplanation />
        }
      </div>
    </div>
  )
}
