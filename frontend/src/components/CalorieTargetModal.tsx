import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const RATES = [
  { label: 'Mild',       desc: '~0.25 kg/week', delta: 250 },
  { label: 'Moderate',   desc: '~0.5 kg/week',  delta: 500 },
  { label: 'Aggressive', desc: '~0.75 kg/week', delta: 750 },
]

export default function CalorieTargetModal({
  tdee,
  currentWeight,
  weightTarget,
  onConfirm,
  onClose,
}: {
  tdee: number | null
  currentWeight?: number | null
  weightTarget?: number | null
  onConfirm: (kcal: number) => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  const [selectedDelta, setSelectedDelta] = useState<number | null>(null)

  // Infer direction from weights; default to deficit if unknown
  const direction =
    currentWeight && weightTarget
      ? currentWeight > weightTarget ? -1
      : currentWeight < weightTarget ?  1
      : -1
    : -1

  const target = tdee && selectedDelta !== null
    ? tdee + direction * selectedDelta
    : null

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-sm bg-primary rounded-3xl border-[3px] border-lily/20 shadow-2xl overflow-y-auto max-h-[90dvh]">
        <div className="flex flex-col gap-5 px-6 py-7">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-lily">{t('targetTitle')}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('calcClose')}
              className="text-lily/50 hover:text-lily text-3xl font-bold cursor-pointer transition-colors leading-none"
            >
              ×
            </button>
          </div>

          {!tdee ? (
            <p className="text-lily/60 text-sm font-semibold text-center py-6 px-2">
              {t('targetNoTdee')}
            </p>
          ) : (
            <>
              {/* TDEE display */}
              <div className="flex items-center justify-between bg-lily/10 rounded-2xl px-4 py-3">
                <span className="text-sm font-bold text-lily/60">{t('targetTdeeLabel')}</span>
                <span className="text-lg font-extrabold text-lily">{tdee} kcal</span>
              </div>

              {/* Rate */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-bold text-lily/50">{t('targetRateLabel')}</p>
                <div className="flex flex-col gap-2">
                  {RATES.map(r => {
                    const sel = selectedDelta === r.delta
                    const kcal = direction * r.delta
                    return (
                      <button
                        key={r.delta}
                        type="button"
                        onClick={() => setSelectedDelta(r.delta)}
                        className={`w-full py-3 px-4 rounded-2xl border-[3px] border-lily text-left transition-colors cursor-pointer ${
                          sel ? 'bg-lily' : 'bg-transparent'
                        }`}
                      >
                        <span className={`font-extrabold text-sm block ${sel ? 'text-primary' : 'text-lily'}`}>
                          {r.label}
                        </span>
                        <span className={`text-xs font-semibold ${sel ? 'text-primary/70' : 'text-lily/50'}`}>
                          {kcal > 0 ? '+' : ''}{kcal} kcal · {r.desc}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Result */}
              <div
                className="flex flex-col items-center gap-1 transition-opacity duration-300"
                style={{ opacity: target ? 1 : 0.25 }}
              >
                <p className="text-lily/60 text-sm font-semibold">{t('targetResult')}</p>
                <p className="text-6xl font-extrabold text-lily tabular-nums">
                  {target ?? '—'}
                </p>
                <p className="text-lily/60 text-sm font-semibold">kcal</p>
              </div>

              {/* Confirm */}
              <button
                type="button"
                disabled={!target}
                onClick={() => target && onConfirm(target)}
                className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                {t('calcConfirm')}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
