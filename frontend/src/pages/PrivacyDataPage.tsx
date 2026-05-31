import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Loader2, Trash2 } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLanguage } from '../context/LanguageContext'
import { ApiError, profile, type UserProfile } from '../lib/api'
import { NOMNOM_SMART_BOOK } from '../assets'

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map(item => (
        <li key={item} className="flex gap-2 text-sm font-semibold text-lily/70">
          <span className="text-lily/30 shrink-0">•</span>
          {item}
        </li>
      ))}
    </ul>
  )
}

export default function PrivacyDataPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useLanguage()
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    profile.me().then(setUser).catch(() => {})
  }, [])

  const storedItems = [
    t('privacyStoredProfile'),
    t('privacyStoredLogs'),
    t('privacyStoredMeasurements'),
    t('privacyStoredPlans'),
    t('privacyStoredLibrary'),
  ]

  const handleExport = async () => {
    setExporting(true)
    setError('')
    try {
      const data = await profile.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nomnom-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError(t('dashboardParseError'))
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await profile.deleteAccount()
      logout()
      navigate('/login', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.detail === 'DEMO_ACCOUNT_PROTECTED') {
        setError(t('privacyDemoProtected'))
      } else {
        setError(t('dashboardParseError'))
      }
      setShowConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="bg-primary px-5 pt-14 pb-8 relative overflow-hidden">
        <img src={NOMNOM_SMART_BOOK} alt="" aria-hidden className="absolute bottom-0 right-2 w-24 pointer-events-none select-none" />
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 text-lily/60 hover:text-lily text-sm font-bold mb-4 cursor-pointer transition-colors"
        >
          <ArrowLeft size={16} />
          {t('profileTitle')}
        </button>
        <h1 className="text-2xl font-extrabold text-lily">{t('privacyTitle')}</h1>
      </div>

      <div className="px-4 pb-10 space-y-4 mt-4">
        <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 px-4 py-4">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-3">
            {t('privacyDataStoredTitle')}
          </h2>
          <BulletList items={storedItems} />
        </div>

        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4 py-4">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-2">
            {t('privacyAiTitle')}
          </h2>
          <p className="text-sm font-semibold text-lily/70 leading-relaxed">{t('privacyAiBody')}</p>
        </div>

        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4 py-4">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-2">
            {t('privacyExportTitle')}
          </h2>
          <p className="text-sm font-semibold text-lily/70 mb-4">{t('privacyExportBody')}</p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-[2px] border-lily
                       text-sm font-bold text-lily cursor-pointer hover:bg-lily hover:text-primary
                       transition-colors disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? t('privacyExporting') : t('privacyExportButton')}
          </button>
        </div>

        {user?.account_type !== 'demo' && (
        <div className="bg-white rounded-2xl border-[2px] border-red-200 px-4 py-4">
          <h2 className="text-xs font-extrabold text-red-400/80 uppercase tracking-widest mb-2">
            {t('privacyDeleteTitle')}
          </h2>
          <p className="text-sm font-semibold text-red-400/80 mb-2">{t('privacyDeleteBody')}</p>
          <p className="text-xs font-semibold text-red-400/65 mb-4 leading-relaxed">{t('privacyDeleteHardDelete')}</p>
          <button
            type="button"
            onClick={() => { setError(''); setShowConfirm(true) }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-[2px] border-red-300
                       text-sm font-extrabold text-red-400 cursor-pointer hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} />
            {t('privacyDeleteButton')}
          </button>
        </div>
        )}

        {user?.account_type === 'demo' && (
          <p className="text-xs font-semibold text-lily/45 text-center px-2">{t('privacyDemoProtected')}</p>
        )}

        {error && (
          <p className="text-sm font-bold text-red-400 text-center">{error}</p>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-6 sm:pb-0">
          <div className="bg-white rounded-2xl border-[3px] border-lily/20 p-5 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-extrabold text-lily mb-2">{t('privacyDeleteConfirmTitle')}</h3>
            <p className="text-sm font-semibold text-lily/70 mb-5">{t('privacyDeleteConfirmBody')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl border-[2px] border-lily/30 text-sm font-bold text-lily/70 cursor-pointer"
              >
                {t('privacyDeleteCancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-2xl bg-red-400 text-white text-sm font-extrabold cursor-pointer disabled:opacity-50"
              >
                {deleting ? <Loader2 size={16} className="animate-spin mx-auto" /> : t('privacyDeleteConfirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
