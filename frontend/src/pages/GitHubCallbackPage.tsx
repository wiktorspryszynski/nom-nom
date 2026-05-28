import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export const GITHUB_PENDING_KEY = 'nomnom_github_pending'

export default function GitHubCallbackPage() {
  const [searchParams] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code) return null
    const ghError = params.get('error')
    if (ghError === 'access_denied') return 'Access denied — you cancelled the GitHub login.'
    if (ghError === 'redirect_uri_mismatch') return 'OAuth redirect URI mismatch — check GitHub app settings.'
    if (ghError) return `GitHub error: ${ghError}`
    return 'GitHub login failed'
  })
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code) return

    ;(async () => {
      try {
        const res = await fetch('/api/auth/github/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.detail || 'GitHub login failed')
        }
        const data = await res.json()

        if (data.needs_signup) {
          // New GitHub user — redirect to signup wizard with pre-filled data
          sessionStorage.setItem(GITHUB_PENDING_KEY, JSON.stringify({
            email: data.email,
            name: data.name,
            github_id: data.github_id,
          }))
          navigate('/register?via=github', { replace: true })
        } else {
          // Existing user — log in directly
          await loginWithToken(data.access_token)
          navigate('/', { replace: true })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'GitHub login failed')
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-dvh bg-primary flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-4 text-lily">
        {error ? (
          <>
            <p className="text-lg font-bold text-center">{error}</p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="mt-2 text-sm font-bold underline underline-offset-2 opacity-60 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <svg className="animate-spin w-10 h-10 opacity-70" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-base font-semibold opacity-70">Logging in with GitHub…</p>
          </>
        )}
      </div>
    </div>
  )
}
