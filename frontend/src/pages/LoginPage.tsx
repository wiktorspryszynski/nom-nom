import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { SMALL_ICON_NO_BG, NOMNOM_SMILING, ICON_BG } from '../assets'

const APP_URL = 'https://fit.spryszynski.pl'
const APP_URL_QR = `${APP_URL}?ref=qr`
const DESKTOP_DISMISSED_KEY = 'nomnom_desktop_dismissed'

function DesktopQRBanner() {
  const { t } = useLanguage()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const isDesktop = window.matchMedia('(pointer: fine) and (min-width: 768px)').matches
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    const dismissed = localStorage.getItem(DESKTOP_DISMISSED_KEY) === '1'
    if (isDesktop && !isStandalone && !dismissed) setShow(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(DESKTOP_DISMISSED_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#fde68a] px-6">
      <div className="bg-ivory rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-5 max-w-xs w-full relative">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-lily/30 hover:text-lily/70 transition-colors text-2xl leading-none cursor-pointer"
        >
          ×
        </button>

        <img src={ICON_BG} alt="NomNom" className="w-16 h-16 rounded-2xl" />

        <div className="text-center">
          <h2 className="text-xl font-extrabold text-lily">{t('desktopBannerTitle')}</h2>
          <p className="text-sm font-semibold text-lily/60 mt-1">{t('desktopBannerBody')}</p>
        </div>

        <div className="p-3 bg-white rounded-2xl shadow-inner">
          <QRCodeSVG
            value={APP_URL_QR}
            size={180}
            bgColor="#ffffff"
            fgColor="#7d3ed0"
            level="M"
          />
        </div>

        <p className="text-xs font-bold text-lily/40 tracking-wide">{APP_URL.replace('https://', '')}</p>

        <button
          onClick={dismiss}
          className="text-xs font-bold text-lily/40 hover:text-lily/70 transition-colors cursor-pointer underline underline-offset-2"
        >
          {t('desktopBannerContinue')}
        </button>
      </div>
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS] = useState(() => /iPhone|iPad|iPod/.test(navigator.userAgent))
  const [isStandalone] = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  return { deferredPrompt, isIOS, isStandalone, install }
}

function InstallBanner() {
  const { deferredPrompt, isIOS, isStandalone, install } = useInstallPrompt()
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)

  if (isStandalone || dismissed) return null

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border border-stone-200 rounded-2xl shadow-lg p-4 flex items-start gap-3">
        <img src={ICON_BG} alt="" className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900">{t('installIosTitle')}</p>
          <p className="text-xs text-stone-500 mt-0.5">
            {t('installIosBody')} <span className="font-medium">{t('installIosShare')}</span>{t('installIosThen')} <span className="font-medium">{t('installIosAdd')}</span>
          </p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-stone-400 hover:text-stone-600 text-lg leading-none shrink-0">×</button>
      </div>
    )
  }

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border border-stone-200 rounded-2xl shadow-lg p-4 flex items-center gap-3">
        <img src={ICON_BG} alt="" className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900">{t('installTitle')}</p>
          <p className="text-xs text-stone-500 mt-0.5">{t('installSubtitle')}</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-stone-400 hover:text-stone-600 text-lg leading-none shrink-0 mr-1">×</button>
        <button onClick={install} className="bg-primary text-stone-900 text-sm font-semibold px-4 py-1.5 rounded-xl shrink-0">
          {t('installButton')}
        </button>
      </div>
    )
  }

  return null
}

function DemoRequestForm() {
  const { t } = useLanguage()
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
      {t('loginDemoDone').replace('{name}', name)}
    </p>
  )

  if (!open) return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer"
    >
      {t('loginDemoButton')}
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <input
        type="text"
        placeholder={t('loginDemoNamePlaceholder')}
        value={name}
        onChange={e => setName(e.target.value)}
        required
        style={{ borderRadius: '12px 4px 14px 6px / 4px 12px 6px 14px' }}
        className="w-full bg-ivory border-[3px] border-lily text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none focus:border-lily/70"
      />
      <input
        type="text"
        placeholder={t('loginDemoEmailPlaceholder')}
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ borderRadius: '6px 14px 4px 12px / 14px 6px 12px 4px' }}
        className="w-full bg-ivory border-[3px] border-lily text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none focus:border-lily/70"
      />
      {status === 'duplicate' && (
        <p className="text-center text-sm font-bold text-lily/80">{t('loginDemoDuplicate')}</p>
      )}
      {status === 'error' && (
        <p className="text-center text-sm font-bold text-lily/80">{t('loginDemoError')}</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-default"
      >
        {status === 'loading' ? t('loginDemoSending') : t('loginDemoButton')}
      </button>
    </form>
  )
}

function SignUpExplanation() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const lines = t('loginInfoText').split('\n')
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 h-px bg-lily/30" />
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="text-xs font-bold text-lily/50 whitespace-nowrap cursor-pointer hover:text-lily/80 transition-colors"
        >
          {t('loginInfoToggle')} {open ? '▲' : '▼'}
        </button>
        <div className="flex-1 h-px bg-lily/30" />
      </div>
      {open && (
        <p className="text-center text-sm font-semibold text-lily/70 leading-relaxed">
          {lines.map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      )}
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoActive, setLogoActive] = useState(false)
  const [bouncing, setBouncing] = useState(false)

  const handleTitleClick = () => {
    if (bouncing) return
    setBouncing(true)
    setTimeout(() => setBouncing(false), 500 + 'NomNom'.length * 70)
  }

  const LOGO_DEFAULT = SMALL_ICON_NO_BG
  const LOGO_ACTIVE = NOMNOM_SMILING
  const optionToDisplay: number | null = null

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      setError(t('loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-primary flex items-center justify-center px-6">
      <DesktopQRBanner />
      <InstallBanner />
      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4 flex gap-1 bg-lily/10 rounded-xl p-0.5">
        {(['pl', 'en'] as const).map(l => (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
              lang === l ? 'bg-lily text-primary' : 'text-lily/50 hover:text-lily/80'
            }`}
          >
            {l === 'pl' ? 'PL' : 'EN'}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <div className="relative flex justify-center">
            {logoActive && (
              <div className="absolute bottom-[70%] left-[55%] w-50 z-10 bg-ivory rounded-2xl px-4 py-4 shadow-[0_4px_24px_rgba(0,0,0,0.14)]">
                <p className="text-sm font-semibold text-lily leading-relaxed">
                  {t('loginLogoTooltip')}
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
          <h1
            className="text-5xl font-extrabold text-lily tracking-tight cursor-pointer select-none"
            onClick={handleTitleClick}
          >
            {'NomNom'.split('').map((letter, i) => (
              <span
                key={i}
                className="inline-block"
                style={bouncing ? { animation: `letterBounce 0.5s ease both`, animationDelay: `${i * 70}ms` } : undefined}
              >
                {letter}
              </span>
            ))}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div
            className="input-wrap"
            style={{
              '--r1': '4px 18px 6px 16px / 18px 4px 16px 6px',
              '--r2': '6px 14px 10px 20px / 20px 6px 14px 4px',
              '--r3': '2px 22px 4px 14px / 14px 2px 20px 8px',
            } as React.CSSProperties}
          >
            <input
              type="text"
              placeholder={t('loginEmail')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ borderRadius: '4px 18px 6px 16px / 18px 4px 16px 6px' }}
              className="w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none"
            />
          </div>
          <div
            className="input-wrap"
            style={{
              '--r1': '16px 5px 18px 4px / 5px 16px 4px 18px',
              '--r2': '14px 8px 20px 2px / 8px 18px 2px 16px',
              '--r3': '18px 2px 14px 6px / 2px 14px 6px 20px',
            } as React.CSSProperties}
          >
            <input
              type="password"
              placeholder={t('loginPassword')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ borderRadius: '16px 5px 18px 4px / 5px 16px 4px 18px' }}
              className="w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none"
            />
          </div>

          {error && (
            <p className="text-center text-sm font-bold text-lily/80">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-fill mt-2 w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            {loading ? t('loginLoading') : t('loginSubmit')}
          </button>
        </form>

        {/* SIGN-UP OPTION 1 — text link. */}
        {optionToDisplay === 1 && (
          <p className="text-lily/70 text-sm font-semibold">
            {t('loginNoAccount')}{' '}
            <button type="button" className="text-lily font-extrabold underline underline-offset-2 hover:text-lily/80 transition-colors cursor-pointer">
              {t('loginSignUpLink')}
            </button>
          </p>
        )}

        {/* SIGN-UP OPTION 2 — divider + GitHub button. */}
        {optionToDisplay === 2 && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-lily/30" />
              <span className="text-xs font-bold text-lily/50 whitespace-nowrap">{t('loginOrSignUpLabel')}</span>
              <div className="flex-1 h-px bg-lily/30" />
            </div>
            <button
              type="button"
              className="btn-fill-dark w-full flex items-center justify-center gap-2 bg-white border-2 border-black text-black rounded-full py-3 text-base font-extrabold cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              {t('loginGitHub')}
            </button>
          </div>
        )}

        {/* SIGN-UP OPTION 3 — demo request form. */}
        {optionToDisplay === 3 && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-3">
              <div className="flex-1 h-px bg-lily/30" />
              <span className="text-xs font-bold text-lily/50 whitespace-nowrap">{t('loginOrDemoLabel')}</span>
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
