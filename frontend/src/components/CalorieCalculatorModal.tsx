import React, { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import type { TranslationKey } from '../i18n/translations'

const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault()
}

function ageFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null
  const ms = Date.now() - new Date(birthDate).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25))
}

type ActivityLevel = { label: string; desc: string; multiplier: number }

function InnerContent({
  t,
  birthDate,
  manualAge,
  setManualAge,
  activityIdx,
  setActivityIdx,
  ACTIVITY_LEVELS,
  tdee,
  tooLow,
  onConfirm,
  onClose,
}: {
  t: (key: TranslationKey) => string
  birthDate: string
  manualAge: string
  setManualAge: (v: string) => void
  activityIdx: number | null
  setActivityIdx: (i: number) => void
  ACTIVITY_LEVELS: ActivityLevel[]
  tdee: number | null
  tooLow: boolean
  onConfirm: (kcal: number) => void
  onClose: () => void
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold text-lily">{t('calcTitle')}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('calcClose')}
          className="text-lily/50 hover:text-lily text-3xl font-bold cursor-pointer transition-colors leading-none"
        >
          ×
        </button>
      </div>

      {/* Age — only when no birthDate */}
      {!birthDate && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-lily/50">{t('calcAge')}</p>
          <div className="relative flex items-center">
            <input
              type="number"
              placeholder={t('calcAgePlaceholder')}
              value={manualAge}
              onChange={e => setManualAge(e.target.value)}
              onKeyDown={preventNegative}
              min={1}
              max={120}
              className="w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 pr-14 text-base font-semibold outline-none rounded-xl border-[3px] border-lily [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-4 text-lily/40 font-bold text-sm pointer-events-none select-none">
              {t('calcAgeUnit')}
            </span>
          </div>
        </div>
      )}

      {/* Activity level */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-lily/50">{t('calcActivity')}</p>
        <div className="flex flex-col gap-2">
          {ACTIVITY_LEVELS.map((level, i) => {
            const selected = activityIdx === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => setActivityIdx(i)}
                className={`w-full py-3 px-4 rounded-2xl border-[3px] border-lily text-left transition-colors cursor-pointer ${
                  selected ? 'bg-lily' : 'bg-transparent'
                }`}
              >
                <span className={`font-extrabold text-sm block ${selected ? 'text-primary' : 'text-lily'}`}>
                  {level.label}
                </span>
                <span className={`text-xs font-semibold ${selected ? 'text-primary/70' : 'text-lily/50'}`}>
                  {level.desc}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Result */}
      <div
        className="flex flex-col items-center gap-1 transition-opacity duration-300"
        style={{ opacity: tdee ? 1 : 0.25 }}
      >
        <p className="text-lily/60 text-sm font-semibold">{t('calcResult')}</p>
        <p className={`text-6xl font-extrabold tabular-nums ${tooLow ? 'text-red-400' : 'text-lily'}`}>
          {tdee ?? '—'}
        </p>
        <p className="text-lily/60 text-sm font-semibold">kcal</p>
        {tooLow && (
          <p className="text-red-400 text-xs font-semibold text-center mt-1 px-2">
            {t('calcTooLow')}
          </p>
        )}
      </div>

      {/* Confirm */}
      <button
        type="button"
        disabled={!tdee || tooLow}
        onClick={() => tdee && !tooLow && onConfirm(tdee)}
        className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-30 disabled:cursor-default"
      >
        {t('calcConfirm')}
      </button>
    </>
  )
}

export default function CalorieCalculatorModal({
  sex,
  height,
  weight,
  birthDate,
  onConfirm,
  onClose,
  variant = 'fullscreen',
}: {
  sex: 'M' | 'F' | null
  height: string
  weight: string
  birthDate: string
  onConfirm: (kcal: number) => void
  onClose: () => void
  variant?: 'fullscreen' | 'dialog'
}) {
  const { t } = useLanguage()
  const [activityIdx, setActivityIdx] = useState<number | null>(null)
  const [manualAge, setManualAge] = useState('')

  const ACTIVITY_LEVELS: ActivityLevel[] = [
    { label: t('calcActivitySedentary'), desc: t('calcActivitySedentaryDesc'), multiplier: 1.2   },
    { label: t('calcActivityLight'),     desc: t('calcActivityLightDesc'),     multiplier: 1.375 },
    { label: t('calcActivityActive'),    desc: t('calcActivityActiveDesc'),    multiplier: 1.55  },
    { label: t('calcActivityVery'),      desc: t('calcActivityVeryDesc'),      multiplier: 1.725 },
  ]

  const age = ageFromBirthDate(birthDate) ?? (manualAge ? Number(manualAge) : null)
  const MIN_KCAL = sex === 'M' ? 1500 : 1200

  const tdee =
    sex !== null && activityIdx !== null && weight && height && age
      ? Math.round(
          (10 * Number(weight) +
            6.25 * Number(height) -
            5 * age +
            (sex === 'M' ? 5 : -161)) *
            ACTIVITY_LEVELS[activityIdx].multiplier
        )
      : null

  const tooLow = tdee !== null && tdee < MIN_KCAL

  const innerProps = {
    t, birthDate, manualAge, setManualAge,
    activityIdx, setActivityIdx, ACTIVITY_LEVELS,
    tdee, tooLow, onConfirm, onClose,
  }

  if (variant === 'dialog') {
    return (
      <div
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-sm bg-primary rounded-3xl border-[3px] border-lily/20 shadow-2xl overflow-y-auto max-h-[90dvh]">
          <div className="flex flex-col gap-5 px-6 py-7">
            <InnerContent {...innerProps} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-primary z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm flex flex-col gap-5">
          <InnerContent {...innerProps} />
        </div>
      </div>
    </div>
  )
}
