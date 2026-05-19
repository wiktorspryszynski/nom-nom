import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NOMNOM_SMILING, NOMNOM_SLIGHT_SMILE, NOMNOM_EATING_SALAD, NOMNOM_HAPPY } from '../assets'
import { useLanguage } from '../context/LanguageContext'

const STEP_ICONS = [NOMNOM_SMILING, NOMNOM_SLIGHT_SMILE, NOMNOM_EATING_SALAD]
import CalorieCalculatorModal from '../components/CalorieCalculatorModal'

interface FormData {
  name: string
  email: string
  birthDate: string
  sex: 'M' | 'F' | ''
  height: string
  weight: string
  targetWeight: string
  currentIntake: string
  targetDate: string
}

type Status = 'idle' | 'loading' | 'error' | 'success'

const STEPS = 3

const preventNegative = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === '-' || e.key === '+' || e.key === 'e') e.preventDefault()
}

function InputWrap({
  r1, r2, r3, borderColor, className = '', children,
}: {
  r1: string; r2: string; r3: string
  borderColor?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`input-wrap ${className}`}
      style={{
        '--r1': r1, '--r2': r2, '--r3': r3,
        '--input-border-color': borderColor,
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

function UnitInput({
  unit, borderRadius, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { unit: string; borderRadius: string }) {
  return (
    <div className="relative flex items-center">
      <input
        {...props}
        type="number"
        onKeyDown={preventNegative}
        style={{ borderRadius }}
        className="w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 pr-14 text-base font-semibold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="absolute right-4 text-lily/40 font-bold text-sm pointer-events-none select-none">
        {unit}
      </span>
    </div>
  )
}

function PlainInput(props: React.InputHTMLAttributes<HTMLInputElement> & { borderRadius: string }) {
  const { borderRadius, ...rest } = props
  return (
    <input
      {...rest}
      style={{ borderRadius }}
      className="w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none"
    />
  )
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex gap-2 items-center">
      {Array.from({ length: STEPS }, (_, i) => (
        <div
          key={i}
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: i + 1 === current ? '24px' : '8px',
            backgroundColor:
              i + 1 <= current
                ? 'var(--color-lily)'
                : 'color-mix(in srgb, var(--color-lily) 20%, transparent)',
          }}
        />
      ))}
    </div>
  )
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>({
    name: '', email: '', birthDate: '',
    sex: '', height: '', weight: '', targetWeight: '',
    currentIntake: '', targetDate: '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [showCalcModal, setShowCalcModal] = useState(false)

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setData(d => ({ ...d, [field]: e.target.value }))

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data.targetDate) {
      setError(t('signupSelectGoal'))
      return
    }
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          birth_date: data.birthDate || null,
          sex: data.sex,
          height_cm: Number(data.height),
          weight_kg: Number(data.weight),
          target_weight_kg: Number(data.targetWeight),
          current_daily_intake: Number(data.currentIntake),
          target_date_preset: data.targetDate,
          language: lang,
        }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
    } catch {
      setStatus('error')
      setError(t('signupError'))
    }
  }

  const TARGET_PRESETS = [
    { label: t('signupGoalPreset3m'),   value: '3m' },
    { label: t('signupGoalPreset6m'),   value: '6m' },
    { label: t('signupGoalPreset12m'),  value: '12m' },
    { label: t('signupGoalPresetNone'), value: 'none' },
  ]

  if (status === 'success') {
    const successLines = t('signupSuccessBody').split('\n')
    return (
      <div className="min-h-dvh bg-primary flex items-center justify-center px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <img src={NOMNOM_HAPPY} alt="NomNom" className="w-36 h-36" />
          <h2 className="text-4xl font-extrabold text-lily">
            {t('signupSuccessTitle').replace('{name}', data.name)}
          </h2>
          <p className="text-lily/70 font-semibold leading-relaxed">
            {successLines.map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < successLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer"
          >
            {t('signupSuccessLogin')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-primary flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm flex flex-col items-center gap-5">

        {/* Header — always visible */}
        <div className="flex flex-col items-center gap-2">
          <img src={STEP_ICONS[step - 1]} alt="NomNom" className="w-36 h-36" />
          <h1 className="text-4xl font-extrabold text-lily tracking-tight">{t('signupTitle')}</h1>
          <p className="text-lily/50 font-semibold text-sm">
            {t('signupStep').replace('{step}', String(step)).replace('{total}', String(STEPS))}
          </p>
        </div>

        <StepDots current={step} />

        {/* ── Step 1: Basic info ── */}
        {step === 1 && (
          <form onSubmit={nextStep} className="w-full flex flex-col gap-3">
            <InputWrap
              r1="4px 18px 6px 16px / 18px 4px 16px 6px"
              r2="6px 14px 10px 20px / 20px 6px 14px 4px"
              r3="2px 22px 4px 14px / 14px 2px 20px 8px"
            >
              <PlainInput
                type="text"
                placeholder={t('signupNamePlaceholder')}
                value={data.name}
                onChange={set('name')}
                required
                borderRadius="4px 18px 6px 16px / 18px 4px 16px 6px"
              />
            </InputWrap>

            <InputWrap
              r1="16px 5px 18px 4px / 5px 16px 4px 18px"
              r2="14px 8px 20px 2px / 8px 18px 2px 16px"
              r3="18px 2px 14px 6px / 2px 14px 6px 20px"
            >
              <PlainInput
                type="email"
                placeholder={t('signupEmailPlaceholder')}
                value={data.email}
                onChange={set('email')}
                required
                borderRadius="16px 5px 18px 4px / 5px 16px 4px 18px"
              />
            </InputWrap>

            <InputWrap
              r1="8px 14px 4px 18px / 14px 8px 18px 4px"
              r2="12px 6px 16px 8px / 6px 14px 8px 16px"
              r3="4px 18px 8px 12px / 18px 4px 12px 8px"
            >
              <PlainInput
                type="date"
                value={data.birthDate}
                onChange={set('birthDate')}
                max={new Date().toISOString().slice(0, 10)}
                min={`${new Date().getFullYear() - 120}-01-01`}
                borderRadius="8px 14px 4px 18px / 14px 8px 18px 4px"
              />
            </InputWrap>

            <button
              type="submit"
              className="btn-fill mt-2 w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer"
            >
              {t('signupNext')}
            </button>
          </form>
        )}

        {/* ── Step 2: Body ── */}
        {step === 2 && (
          <form onSubmit={nextStep} className="w-full flex flex-col gap-3">
            <p className="text-center text-sm font-bold text-lily/50 -mb-1">{t('signupStepBodyLabel')}</p>

            <div className="flex gap-2">
              {(['M', 'F'] as const).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setData(d => ({ ...d, sex: val }))}
                  className={`flex-1 py-4 px-1 rounded-2xl border-[3px] border-lily text-xs font-extrabold text-center leading-snug transition-colors cursor-pointer ${
                    data.sex === val ? 'bg-lily text-primary' : 'bg-transparent text-lily'
                  }`}
                >
                  {val === 'M' ? t('signupMale') : t('signupFemale')}
                </button>
              ))}
            </div>

            <InputWrap
              r1="6px 20px 4px 16px / 20px 6px 16px 4px"
              r2="4px 16px 8px 20px / 16px 4px 20px 8px"
              r3="10px 12px 6px 18px / 12px 10px 18px 6px"
              borderColor="var(--color-ivory)"
            >
              <UnitInput
                placeholder={t('signupHeightPlaceholder')}
                value={data.height}
                onChange={set('height')}
                required
                min={50}
                max={300}
                unit="cm"
                borderRadius="6px 20px 4px 16px / 20px 6px 16px 4px"
              />
            </InputWrap>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <InputWrap
                  r1="18px 4px 16px 6px / 4px 18px 6px 16px"
                  r2="16px 8px 20px 2px / 8px 16px 2px 20px"
                  r3="14px 6px 18px 4px / 6px 14px 4px 18px"
                  borderColor="var(--color-ivory)"
                >
                  <UnitInput
                    placeholder={t('signupWeightPlaceholder')}
                    value={data.weight}
                    onChange={set('weight')}
                    required
                    min={20}
                    max={500}
                    unit="kg"
                    borderRadius="18px 4px 16px 6px / 4px 18px 6px 16px"
                  />
                </InputWrap>
              </div>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-lily/50 shrink-0"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>

              <div className="flex-1">
                <InputWrap
                  r1="10px 16px 8px 14px / 16px 10px 14px 8px"
                  r2="8px 20px 6px 16px / 20px 8px 16px 6px"
                  r3="14px 10px 12px 18px / 10px 14px 18px 12px"
                  borderColor="var(--color-ivory)"
                >
                  <UnitInput
                    placeholder={t('signupTargetPlaceholder')}
                    value={data.targetWeight}
                    onChange={set('targetWeight')}
                    required
                    min={20}
                    max={500}
                    unit="kg"
                    borderRadius="10px 16px 8px 14px / 16px 10px 14px 8px"
                  />
                </InputWrap>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={prevStep}
                className="btn-fill border-[3px] border-lily text-lily rounded-full py-3 px-7 text-base font-extrabold cursor-pointer shrink-0"
              >
                {t('signupBack')}
              </button>
              <button
                type="submit"
                className="btn-fill flex-1 border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer"
              >
                {t('signupNext')}
              </button>
            </div>
          </form>
        )}

        {/* ── Step 3: Goal ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">

            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-lily/50">{t('signupCurrentIntakeLabel')}</p>
              <InputWrap
                r1="14px 6px 16px 4px / 6px 14px 4px 16px"
                r2="12px 10px 18px 6px / 10px 12px 6px 18px"
                r3="16px 4px 12px 8px / 4px 16px 8px 12px"
                borderColor="var(--color-ivory)"
              >
                <UnitInput
                  placeholder={t('signupCurrentIntakePlaceholder')}
                  value={data.currentIntake}
                  onChange={set('currentIntake')}
                  required
                  min={500}
                  max={10000}
                  unit="kcal"
                  borderRadius="14px 6px 16px 4px / 6px 14px 4px 16px"
                />
              </InputWrap>
              <button
                type="button"
                onClick={() => setShowCalcModal(true)}
                className="self-end text-xs font-bold text-lily/50 hover:text-lily/80 transition-colors cursor-pointer"
              >
                {t('signupCalcLink')}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-bold text-lily/50">{t('signupGoalWhenLabel')}</p>
              <div className="flex gap-2">
                {TARGET_PRESETS.map(preset => {
                  const selected = data.targetDate === preset.value
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setData(d => ({ ...d, targetDate: preset.value }))}
                      className={`flex-1 py-4 px-1 rounded-2xl border-[3px] border-lily text-xs font-extrabold text-center leading-snug transition-colors cursor-pointer ${
                        selected ? 'bg-lily text-primary' : 'bg-transparent text-lily'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {error && (
              <p className="text-center text-sm font-bold text-lily/80">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="btn-fill border-[3px] border-lily text-lily rounded-full py-3 px-7 text-base font-extrabold cursor-pointer shrink-0"
              >
                {t('signupBack')}
              </button>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-fill flex-1 border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-default"
              >
                {status === 'loading' ? t('signupCreating') : t('signupCreate')}
              </button>
            </div>
          </form>
        )}

        <p className="text-lily/60 text-sm font-semibold">
          {t('signupHasAccount')}{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-lily font-extrabold underline underline-offset-2 cursor-pointer hover:text-lily/80 transition-colors"
          >
            {t('signupLoginLink')}
          </button>
        </p>

      </div>

      {showCalcModal && (
        <CalorieCalculatorModal
          sex={data.sex || null}
          height={data.height}
          weight={data.weight}
          birthDate={data.birthDate}
          onConfirm={kcal => {
            setData(d => ({ ...d, currentIntake: String(kcal) }))
            setShowCalcModal(false)
          }}
          onClose={() => setShowCalcModal(false)}
        />
      )}

    </div>
  )
}
