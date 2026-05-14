import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
    setIsIOS(ios)
    setIsStandalone(standalone)

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
        <img src="/nomnom-icon-bg.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
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
        <img src="/nomnom-icon-bg.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
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

function App() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <img src="/nomnom-icon-no_bg.png" alt="NomNom" className="w-32 h-32 mx-auto mb-4" />
        <h1 className="text-4xl font-bold text-stone-950 mb-1">NomNom</h1>
        <p className="text-stone-500">Coming soon</p>
      </div>
      <InstallBanner />
    </div>
  )
}

export default App
