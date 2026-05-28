import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const DEMO_LIMIT = 15

export default function DemoLimitModal() {
  const { user, showDemoModal, setShowDemoModal } = useAuth()
  const { t } = useLanguage()

  if (!showDemoModal || !user || user.account_type !== 'demo') return null

  const used = user.demo_ai_calls_used
  const remaining = Math.max(0, DEMO_LIMIT - used)

  const dismiss = () => {
    sessionStorage.setItem('nomnom_demo_banner_seen', '1')
    setShowDemoModal(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5">
      <div className="bg-ivory rounded-3xl shadow-2xl p-7 flex flex-col gap-4 max-w-sm w-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-lily/40 mb-0.5">
              {t('demoModalLabel')}
            </p>
            <h2 className="text-2xl font-extrabold text-lily leading-tight">
              {t('demoModalTitle')}
            </h2>
          </div>
          <button
            onClick={dismiss}
            aria-label="Close"
            className="text-lily/30 hover:text-lily/60 text-2xl leading-none mt-0.5 cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* AI call meter */}
        <div className="bg-primary/10 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-bold text-lily/70">{t('demoModalCallsLabel')}</span>
            <span className="text-lg font-extrabold text-lily">
              {remaining} <span className="text-sm font-semibold text-lily/50">/ {DEMO_LIMIT}</span>
            </span>
          </div>
          <div className="w-full h-2 bg-lily/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-lily rounded-full transition-all"
              style={{ width: `${Math.min(100, (used / DEMO_LIMIT) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-lily/50 font-medium">{t('demoModalCallsNote')}</p>
        </div>

        {/* Body */}
        <p className="text-sm text-lily/70 font-medium leading-relaxed">
          {t('demoModalBody')}
        </p>

        {/* Single dismiss action */}
        <button
          onClick={dismiss}
          className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-sm font-extrabold cursor-pointer mt-1"
        >
          {t('demoModalDismiss')}
        </button>
      </div>
    </div>
  )
}
