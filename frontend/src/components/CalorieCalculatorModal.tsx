import React, { useState } from 'react'

const ACTIVITY_LEVELS = [
  { label: 'Siedzący',         desc: 'biuro, mało ruchu',                   multiplier: 1.2   },
  { label: 'Lekko aktywny',    desc: '1-2 treningi w tygodniu',             multiplier: 1.375 },
  { label: 'Aktywny',          desc: '3-5 treningów w tygodniu',            multiplier: 1.55  },
  { label: 'Bardzo aktywny',   desc: 'codziennie lub praca fizyczna',       multiplier: 1.725 },
]

const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault()
}

function ageFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null
  const ms = Date.now() - new Date(birthDate).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25))
}

export default function CalorieCalculatorModal({
  sex,
  height,
  weight,
  birthDate,
  onConfirm,
  onClose,
}: {
  sex: 'M' | 'F' | null
  height: string
  weight: string
  birthDate: string
  onConfirm: (kcal: number) => void
  onClose: () => void
}) {
  const [activityIdx, setActivityIdx] = useState<number | null>(null)
  const [manualAge, setManualAge] = useState('')

  const age = ageFromBirthDate(birthDate) ?? (manualAge ? Number(manualAge) : null)

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

  return (
    <div className="fixed inset-0 bg-primary z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm flex flex-col gap-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-lily">Kalkulator kalorii</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Zamknij"
              className="text-lily/50 hover:text-lily text-3xl font-bold cursor-pointer transition-colors leading-none"
            >
              ×
            </button>
          </div>

          {/* Age — only when no birthDate */}
          {!birthDate && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-lily/50">Wiek</p>
              <div className="relative flex items-center">
                <input
                  type="number"
                  placeholder="Wiek"
                  value={manualAge}
                  onChange={e => setManualAge(e.target.value)}
                  onKeyDown={preventNegative}
                  min={1}
                  max={120}
                  className="w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 pr-14 text-base font-semibold outline-none rounded-xl border-[3px] border-lily [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-4 text-lily/40 font-bold text-sm pointer-events-none select-none">
                  lat
                </span>
              </div>
            </div>
          )}

          {/* Activity level */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-bold text-lily/50">Poziom aktywności</p>
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
            <p className="text-lily/60 text-sm font-semibold">Twoje dzienne zapotrzebowanie</p>
            <p className="text-6xl font-extrabold text-lily tabular-nums">
              {tdee ?? '—'}
            </p>
            <p className="text-lily/60 text-sm font-semibold">kcal</p>
          </div>

          {/* Confirm */}
          <button
            type="button"
            disabled={!tdee}
            onClick={() => tdee && onConfirm(tdee)}
            className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-30 disabled:cursor-default"
          >
            Użyj tej wartości
          </button>

        </div>
      </div>
    </div>
  )
}
