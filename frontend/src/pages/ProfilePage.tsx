import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, LogOut, ChevronRight, Pencil, Check, Loader2, Zap } from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useLanguage } from '../context/LanguageContext'
import BottomNav from '../components/BottomNav'
import CalorieCalculatorModal from '../components/CalorieCalculatorModal'
import CalorieTargetModal from '../components/CalorieTargetModal'
import { profile, type UserProfile } from '../lib/api'
import { NOMNOM_HAPPY } from '../assets'

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-20 h-20 rounded-full bg-lily flex items-center justify-center shadow-md">
      <span className="text-2xl font-extrabold text-primary">{initials}</span>
    </div>
  )
}

function GoalField({ label, value, unit, onChange, onSave, hint }: {
  label: string; value: string; unit: string
  onChange: (v: string) => void
  onSave: () => void
  hint?: string
}) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="py-3.5 border-b border-lily/10 last:border-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-lily/70">{label}</span>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <input
                type="number"
                value={value}
                onChange={e => onChange(e.target.value)}
                autoFocus
                className="w-20 text-right bg-ivory border-[2px] border-lily/40 text-lily font-extrabold
                           text-sm px-2 py-1 rounded-lg outline-none focus:border-lily/70"
              />
              <span className="text-xs font-bold text-lily/40">{unit}</span>
              <button onClick={() => { setEditing(false); onSave() }} className="text-[#3ec9a7] cursor-pointer">
                <Check size={16} strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              <span className="text-sm font-extrabold text-lily">{value || '—'} {value ? unit : ''}</span>
              <button onClick={() => setEditing(true)} className="text-lily/30 hover:text-lily/60 transition-colors cursor-pointer">
                <Pencil size={13} />
              </button>
            </>
          )}
        </div>
      </div>
      {hint && <p className="text-xs font-semibold text-lily/35 mt-0.5">{hint}</p>}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-lily/10 last:border-0">
      <span className="text-sm font-bold text-lily/50">{label}</span>
      <span className="text-sm font-bold text-lily/70">{value}</span>
    </div>
  )
}

const DEMO_LIMIT = 15

const PROTEIN_MULTIPLIERS: Record<string, number> = { lose: 2.0, maintain: 1.6, build: 2.2 }

function computeRecommendedProtein(weightKg: number, goalType: string): number {
  return Math.round(weightKg * (PROTEIN_MULTIPLIERS[goalType] ?? 1.6))
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t, lang, setLang } = useLanguage()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [tdee, setTdee] = useState('')
  const [calorieTarget, setCalorieTarget] = useState('')
  const [weightGoal, setWeightGoal] = useState('')
  const [proteinGoal, setProteinGoal] = useState('')
  const [height, setHeight] = useState('')
  const [showCalcModal, setShowCalcModal] = useState(false)
  const [showTargetModal, setShowTargetModal] = useState(false)

  const fetchProfile = useCallback(async () => {
    try {
      const data = await profile.me()
      setUser(data)
      setTdee(String(data.tdee_kcal ?? ''))
      setCalorieTarget(String(data.calorie_target ?? ''))
      setWeightGoal(String(data.weight_target ?? ''))
      setProteinGoal(String(data.protein_target ?? ''))
      setHeight(String(data.height_cm ?? ''))
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProfile() }, [fetchProfile])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await profile.update({
        tdee_kcal: tdee ? Number(tdee) : undefined,
        calorie_target: calorieTarget ? Number(calorieTarget) : undefined,
        weight_target: weightGoal ? Number(weightGoal) : undefined,
        protein_target: proteinGoal ? Number(proteinGoal) : undefined,
        height_cm: height ? Number(height) : undefined,
      })
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const deficit = Number(tdee) - Number(calorieTarget)
  const deficitLabel = deficit > 0
    ? `${t('profileDeficit')}: ${deficit} kcal`
    : deficit < 0
    ? `${t('profileSurplus')}: ${Math.abs(deficit)} kcal`
    : null

  const recommendedProtein = user
    ? computeRecommendedProtein(user.weight_kg ?? 75, user.goal_type ?? 'maintain')
    : null

  if (loading) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-lily animate-spin" />
      </div>
    )
  }

  const displayName = user?.name ?? '…'
  const displayEmail = user?.email ?? '…'

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Header ── */}
      <div className="bg-primary px-5 pt-14 pb-10 relative overflow-hidden">
        <img src={NOMNOM_HAPPY} alt="" aria-hidden className="absolute bottom-0 right-2 w-24 pointer-events-none select-none" />
        <h1 className="text-2xl font-extrabold text-lily mb-6">{t('profileTitle')}</h1>
        <div className="flex items-center gap-4">
          <Avatar name={displayName} />
          <div>
            <p className="text-xl font-extrabold text-lily">{displayName}</p>
            <p className="text-sm font-semibold text-lily/60">{displayEmail}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-4 mt-4 relative z-10">
        {/* ── Account info ── */}
        <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 px-4">
          <InfoRow label={t('profileName')}  value={displayName} />
          <InfoRow label={t('profileEmail')} value={displayEmail} />
        </div>

        {/* ── Demo usage ── */}
        {user?.account_type === 'demo' && (() => {
          const used = user.demo_ai_calls_used
          const pct = Math.min(100, (used / DEMO_LIMIT) * 100)
          const isExhausted = used >= DEMO_LIMIT
          return (
            <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 px-4 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-lily/50" />
                <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('profileDemoAccount')}</h2>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm font-bold text-lily/70">{t('profileDemoCallsLabel')}</span>
                <span className="text-lg font-extrabold text-lily">
                  {used} <span className="text-sm font-semibold text-lily/50">/ {DEMO_LIMIT}</span>
                </span>
              </div>
              <div className="w-full h-2 bg-lily/15 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${isExhausted ? 'bg-red-400' : 'bg-lily'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-lily/50 font-medium">{t('profileDemoCallsNote')}</p>
            </div>
          )
        })()}

        {/* ── Goals ── */}
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
          <div className="flex items-center justify-between pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-lily/50" />
              <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('profileGoals')}</h2>
            </div>
            {saving && <Loader2 size={14} className="text-lily/40 animate-spin" />}
          </div>
          <GoalField label={t('profileHeight')} value={height} unit="cm" onChange={setHeight} onSave={saveProfile} />
          <GoalField label={t('profileTdee')} value={tdee} unit="kcal" onChange={setTdee} onSave={saveProfile} />
          <GoalField
            label={t('profileCalorieTarget')}
            value={calorieTarget}
            unit="kcal"
            onChange={setCalorieTarget}
            onSave={saveProfile}
            hint={deficitLabel ?? undefined}
          />
          <GoalField label={t('profileWeightGoal')} value={weightGoal} unit="kg" onChange={setWeightGoal} onSave={saveProfile} />
          <GoalField
            label={t('profileProteinGoal')}
            value={proteinGoal}
            unit="g"
            onChange={setProteinGoal}
            onSave={saveProfile}
            hint={recommendedProtein ? t('profileProteinRecommended').replace('{g}', String(recommendedProtein)) : undefined}
          />
        </div>

        {/* ── Calculate your calories ── */}
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4 py-4">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-3">
            {t('profileCalcSection')}
          </h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCalcModal(true)}
              className="flex-1 py-3 rounded-2xl border-[2px] border-lily text-sm font-bold text-lily cursor-pointer hover:bg-lily hover:text-primary transition-colors"
            >
              {t('profileCalcCurrent')}
            </button>
            <button
              type="button"
              onClick={() => setShowTargetModal(true)}
              disabled={!tdee}
              className="flex-1 py-3 rounded-2xl border-[2px] border-lily text-sm font-bold text-lily cursor-pointer hover:bg-lily hover:text-primary transition-colors disabled:opacity-30 disabled:cursor-default"
            >
              {t('profileCalcTarget')}
            </button>
          </div>
        </div>

        {/* ── App section ── */}
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest pt-4 pb-2">{t('profileApp')}</h2>

          {/* Language toggle */}
          <div className="flex items-center justify-between py-3.5 border-b border-lily/10">
            <span className="text-sm font-bold text-lily/70">{t('profileLanguage')}</span>
            <div className="flex gap-1 bg-lily/8 rounded-xl p-0.5">
              {(['pl', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                    lang === l ? 'bg-lily text-primary' : 'text-lily/50'
                  }`}
                >
                  {l === 'pl' ? 'PL' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/profile/privacy')}
            className="w-full flex items-center justify-between py-3.5 cursor-pointer hover:text-lily/80 transition-colors"
          >
            <span className="text-sm font-bold text-lily/70">{t('profilePrivacy')}</span>
            <ChevronRight size={14} className="text-lily/30" />
          </button>
        </div>

        {/* ── Logout ── */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 border-[3px] border-red-300 text-red-400
                     rounded-2xl py-4 text-sm font-extrabold hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          {t('profileLogout')}
        </button>
      </div>

      <BottomNav />

      {showTargetModal && (
        <CalorieTargetModal
          tdee={tdee ? Number(tdee) : null}
          currentWeight={user?.weight_kg ?? null}
          weightTarget={weightGoal ? Number(weightGoal) : null}
          onConfirm={async kcal => {
            setCalorieTarget(String(kcal))
            setShowTargetModal(false)
            setSaving(true)
            try {
              await profile.update({
                calorie_target: kcal,
                tdee_kcal: tdee ? Number(tdee) : undefined,
                weight_target: weightGoal ? Number(weightGoal) : undefined,
                protein_target: proteinGoal ? Number(proteinGoal) : undefined,
                height_cm: height ? Number(height) : undefined,
              })
            } catch { /* silent */ } finally {
              setSaving(false)
            }
          }}
          onClose={() => setShowTargetModal(false)}
        />
      )}

      {showCalcModal && (
        <CalorieCalculatorModal
          variant="dialog"
          sex={(user?.sex as 'M' | 'F' | null) ?? null}
          height={String(user?.height_cm ?? '')}
          weight={String(user?.weight_kg ?? '')}
          birthDate={user?.birth_date ?? ''}
          onConfirm={async kcal => {
            setTdee(String(kcal))
            setShowCalcModal(false)
            setSaving(true)
            try {
              await profile.update({
                tdee_kcal: kcal,
                calorie_target: calorieTarget ? Number(calorieTarget) : undefined,
                weight_target: weightGoal ? Number(weightGoal) : undefined,
                protein_target: proteinGoal ? Number(proteinGoal) : undefined,
                height_cm: height ? Number(height) : undefined,
              })
            } catch { /* silent */ } finally {
              setSaving(false)
            }
          }}
          onClose={() => setShowCalcModal(false)}
        />
      )}
    </div>
  )
}
