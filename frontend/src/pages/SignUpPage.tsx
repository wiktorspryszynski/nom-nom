import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { NOMNOM_SMILING, NOMNOM_SLIGHT_SMILE, NOMNOM_EATING_SALAD } from '../assets'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { GITHUB_PENDING_KEY } from './GitHubCallbackPage'

const STEP_ICONS = [NOMNOM_SMILING, NOMNOM_SLIGHT_SMILE, NOMNOM_EATING_SALAD]
import CalorieCalculatorModal from '../components/CalorieCalculatorModal'

interface FormData {
  name: string
  email: string
  password: string
  birthDate: string
  sex: 'M' | 'F' | ''
  height: string
  weight: string
  targetWeight: string
  goalType: 'lose' | 'maintain' | 'build' | ''
  currentIntake: string
  targetDate: string
}

type Status = 'idle' | 'loading' | 'error' | 'success'

const STEPS = 3
const PRESET_DAYS: Record<string, number> = { '3m': 91, '6m': 182, '12m': 365, 'none': 182 }

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
  const { borderRadius, readOnly, ...rest } = props
  return (
    <input
      {...rest}
      readOnly={readOnly}
      style={{ borderRadius }}
      className={`w-full bg-ivory text-lily placeholder:text-lily/50 px-4 py-3 text-base font-semibold outline-none ${readOnly ? 'opacity-50 cursor-default select-none' : ''}`}
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

function PasswordStrength({ password }: { password: string }) {
  const { t } = useLanguage()
  const rules = [
    { key: 'min8',    label: t('signupPasswordMin8'),    ok: password.length >= 8 },
    { key: 'upper',   label: t('signupPasswordUpper'),   ok: /[A-Z]/.test(password) },
    { key: 'number',  label: t('signupPasswordNumber'),  ok: /[0-9]/.test(password) },
    { key: 'special', label: t('signupPasswordSpecial'), ok: /[^A-Za-z0-9]/.test(password) },
  ]
  if (!password) return null
  const score = rules.filter(r => r.ok).length
  const barColor = score <= 1 ? '#f97316' : score === 2 ? '#f7a84a' : score === 3 ? '#facc15' : '#3ec9a7'
  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex gap-1">
        {rules.map((_, i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i < score ? barColor : 'color-mix(in srgb, var(--color-lily) 15%, transparent)' }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        {rules.map(r => (
          <span key={r.key} className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${r.ok ? 'text-[#3ec9a7]' : 'text-lily/35'}`}>
            <span className="text-[10px]">{r.ok ? '✓' : '○'}</span>{r.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignUpPage() {
  const navigate = useNavigate()
  const { login, loginWithToken } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const [step, setStep] = useState(1)
  const [data, setData] = useState<FormData>(() => {
    const base: FormData = { name: '', email: '', password: '', birthDate: '', sex: '', height: '', weight: '', targetWeight: '', goalType: '', currentIntake: '', targetDate: '' }
    if (new URLSearchParams(window.location.search).get('via') !== 'github') return base
    try {
      const raw = sessionStorage.getItem(GITHUB_PENDING_KEY)
      if (!raw) return base
      const pending = JSON.parse(raw) as { email: string; name: string; github_id: string }
      return { ...base, email: pending.email, name: pending.name }
    } catch { return base }
  })

  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [showCalcModal, setShowCalcModal] = useState(false)
  const [calorieTarget, setCalorieTarget] = useState<number | null>(null)

  // GitHub OAuth path
  const [githubId] = useState<string | null>(() => {
    if (new URLSearchParams(window.location.search).get('via') !== 'github') return null
    try {
      const raw = sessionStorage.getItem(GITHUB_PENDING_KEY)
      if (!raw) return null
      const pending = JSON.parse(raw) as { email: string; name: string; github_id: string }
      sessionStorage.removeItem(GITHUB_PENDING_KEY)
      return pending.github_id
    } catch { return null }
  })
  const viaGitHub = Boolean(githubId)

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setData(d => ({ ...d, [field]: e.target.value }))

  const isPasswordStrong = (pw: string) =>
    pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw)

  const nextStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (!viaGitHub && !isPasswordStrong(data.password)) {
        setError(t('signupPasswordTooWeak'))
        return
      }
      // Check email availability before proceeding to step 2
      setStatus('loading')
      try {
        const res = await fetch(`/api/register/check-email?email=${encodeURIComponent(data.email)}`)
        const { available } = await res.json()
        if (!available) {
          setError(t('signupEmailTaken'))
          setStatus('idle')
          return
        }
      } catch {
        // Network error — allow proceeding, final submit will catch it
      }
      setStatus('idle')
    }
    // Step 2: require an explicit goal type selection before proceeding.
    if (step === 2 && !data.goalType) {
      setError(t('signupSelectGoal'))
      return
    }
    setError('')
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
    const tdee = Number(data.currentIntake)
    const target = calorieTarget ?? recommendation?.kcal ?? tdee
    try {
      const body: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        birth_date: data.birthDate || null,
        sex: data.sex,
        height_cm: Number(data.height),
        weight_kg: Number(data.weight),
        target_weight_kg: Number(data.targetWeight),
        tdee_kcal: tdee,
        calorie_target: target,
        goal_type: data.goalType || 'maintain',
        language: lang,
      }
      if (viaGitHub) {
        body.github_id = githubId
      } else {
        body.password = data.password
      }

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const result = await res.json()

      if (viaGitHub && result.access_token) {
        // GitHub users: backend returns a token, use it directly
        await loginWithToken(result.access_token)
        navigate('/')
      } else {
        // Email users: log in with password
        await login(data.email, data.password)
        navigate('/')
      }
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

  const GOAL_TYPES = [
    { label: t('signupGoalLose'),     value: 'lose' as const },
    { label: t('signupGoalMaintain'), value: 'maintain' as const },
    { label: t('signupGoalBuild'),    value: 'build' as const },
  ]

  const MIN_KCAL = data.sex === 'F' ? 1200 : 1500

  const tdee = Number(data.currentIntake)
  const w = Number(data.weight)
  const tw = Number(data.targetWeight)
  const recommendation: { kcal: number; delta: number } | null = (() => {
    if (!tdee || !w || !tw || !data.targetDate || data.goalType === 'maintain' || !data.goalType) return null
    const days = PRESET_DAYS[data.targetDate] ?? 182
    const totalDelta = (w - tw) * 7700
    const dailyDelta = Math.round(totalDelta / days)
    const recommended = tdee - dailyDelta
    return { kcal: recommended, delta: dailyDelta }
  })()

  return (
    <div className="min-h-dvh bg-primary flex items-center justify-center px-6 py-10">

      {/* Language toggle — top right */}
      <div className="absolute top-4 right-4">
        <div className="flex gap-1 bg-lily/10 rounded-xl p-0.5">
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
      </div>

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
                readOnly={viaGitHub}
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
                readOnly={viaGitHub}
                borderRadius="16px 5px 18px 4px / 5px 16px 4px 18px"
              />
            </InputWrap>

            {/* Password field — hidden for GitHub signups */}
            {!viaGitHub && (
              <>
                <InputWrap
                  r1="12px 8px 14px 6px / 8px 12px 6px 14px"
                  r2="10px 14px 8px 16px / 14px 10px 16px 8px"
                  r3="16px 6px 12px 10px / 6px 16px 10px 12px"
                >
                  <PlainInput
                    type="password"
                    placeholder={t('signupPasswordPlaceholder')}
                    value={data.password}
                    onChange={set('password')}
                    required
                    borderRadius="12px 8px 14px 6px / 8px 12px 6px 14px"
                  />
                </InputWrap>
                <PasswordStrength password={data.password} />
              </>
            )}

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
              disabled={status === 'loading'}
              className="btn-fill mt-2 w-full border-[3px] border-lily text-lily rounded-full py-3 text-base font-extrabold cursor-pointer disabled:opacity-50 disabled:cursor-default"
            >
              {status === 'loading' ? '…' : t('signupNext')}
            </button>
          </form>
        )}

        {/* ── Step 2: Body ── */}
        {step === 2 && (
          <form onSubmit={nextStep} className="w-full flex flex-col gap-3">
            <p className="text-center text-sm font-bold text-lily/50 -mb-1">{t('signupGoalTypeLabel')}</p>

            <div className="flex gap-2">
              {GOAL_TYPES.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setData(d => ({ ...d, goalType: value }))}
                  className={`flex-1 py-4 px-1 rounded-2xl border-[3px] border-lily text-xs font-extrabold text-center leading-snug transition-colors cursor-pointer ${
                    data.goalType === value ? 'bg-lily text-primary' : 'bg-transparent text-lily'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

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

            {recommendation && (
              <div className="rounded-2xl border-[2px] border-lily/30 bg-lily/5 p-4 flex flex-col gap-2">
                <p className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">
                  {t('signupRecommendedIntakeLabel')}
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-lily leading-none">
                    {recommendation.kcal.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-lily/50 pb-0.5">kcal</span>
                  <span className="text-xs font-bold text-lily/40 pb-0.5 ml-1">
                    {recommendation.delta > 0
                      ? t('signupDeficitNote').replace('{kcal}', String(Math.abs(recommendation.delta)))
                      : t('signupSurplusNote').replace('{kcal}', String(Math.abs(recommendation.delta)))}
                  </span>
                </div>
                {recommendation.kcal < MIN_KCAL && (
                  <p className="text-xs font-bold text-[#f7a84a]">{t('signupWarningTooLow')}</p>
                )}
                {calorieTarget !== recommendation.kcal && (
                  <button
                    type="button"
                    onClick={() => setCalorieTarget(recommendation.kcal)}
                    className="self-start text-xs font-bold text-lily/60 hover:text-lily transition-colors cursor-pointer underline underline-offset-2"
                  >
                    {t('signupAcceptRecommendation')}
                  </button>
                )}
                {calorieTarget === recommendation.kcal && (
                  <p className="text-xs font-bold text-[#3ec9a7]">✓ {t('signupAcceptRecommendation')}</p>
                )}
              </div>
            )}

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
