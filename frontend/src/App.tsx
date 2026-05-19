import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlannerPage from './pages/PlannerPage'
import MeasurementsPage from './pages/MeasurementsPage'
import ProfilePage from './pages/ProfilePage'
import { ICON_BG } from './assets'

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
  const [dismissed, setDismissed] = useState(false)

  if (isStandalone || dismissed) return null

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 bg-white border border-stone-200 rounded-2xl shadow-lg p-4 flex items-start gap-3">
        <img src={ICON_BG} alt="" className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-900">Add NomNom to Home Screen</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Tap <span className="font-medium">Share</span> then <span className="font-medium">Add to Home Screen</span>
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
          <p className="text-sm font-semibold text-stone-900">Install NomNom</p>
          <p className="text-xs text-stone-500 mt-0.5">Add to your home screen</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-stone-400 hover:text-stone-600 text-lg leading-none shrink-0 mr-1">×</button>
        <button onClick={install} className="bg-primary text-stone-900 text-sm font-semibold px-4 py-1.5 rounded-xl shrink-0">
          Install
        </button>
      </div>
    )
  }

  return null
}

function AppShell() {
  const { token } = useAuth()
  return (
    <>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        {token ? (
          <>
            <Route path="/"             element={<DashboardPage />} />
            <Route path="/planner"      element={<PlannerPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
      <InstallBanner />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
