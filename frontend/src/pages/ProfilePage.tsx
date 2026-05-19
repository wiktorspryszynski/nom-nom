import { useState } from 'react'
import { Target, LogOut, ChevronRight, Pencil, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import BottomNav from '../components/BottomNav'

// ─── Mock user data ────────────────────────────────────────────────────────────
const mockUser = { name: 'Wiktor', email: 'wiktor@spryszynski.pl' }
// ─────────────────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="w-20 h-20 rounded-full bg-lily flex items-center justify-center shadow-md">
      <span className="text-2xl font-extrabold text-primary">{initials}</span>
    </div>
  )
}

function GoalField({ label, value, unit, onChange }: {
  label: string; value: string; unit: string; onChange: (v: string) => void
}) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-lily/10 last:border-0">
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
            <button onClick={() => setEditing(false)} className="text-[#3ec9a7] cursor-pointer">
              <Check size={16} strokeWidth={2.5} />
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-extrabold text-lily">{value} {unit}</span>
            <button onClick={() => setEditing(true)} className="text-lily/30 hover:text-lily/60 transition-colors cursor-pointer">
              <Pencil size={13} />
            </button>
          </>
        )}
      </div>
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

export default function ProfilePage() {
  const { logout } = useAuth()
  const { t, lang, setLang } = useLanguage()
  const [calorieGoal, setCalorieGoal] = useState('2000')
  const [weightGoal, setWeightGoal] = useState('72')
  const [proteinGoal, setProteinGoal] = useState('120')
  const [height, setHeight] = useState('178')

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Header ── */}
      <div className="bg-primary px-5 pt-14 pb-10">
        <h1 className="text-2xl font-extrabold text-lily mb-6">{t('profileTitle')}</h1>
        <div className="flex items-center gap-4">
          <Avatar name={mockUser.name} />
          <div>
            <p className="text-xl font-extrabold text-lily">{mockUser.name}</p>
            <p className="text-sm font-semibold text-lily/60">{mockUser.email}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-28 space-y-4 -mt-4">
        {/* ── Account info ── */}
        <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 px-4">
          <InfoRow label={t('profileName')}  value={mockUser.name} />
          <InfoRow label={t('profileEmail')} value={mockUser.email} />
        </div>

        {/* ── Goals ── */}
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
          <div className="flex items-center gap-2 pt-4 pb-2">
            <Target size={14} className="text-lily/50" />
            <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('profileGoals')}</h2>
          </div>
          <GoalField label={t('profileHeight')}       value={height}       unit="cm"   onChange={setHeight} />
          <GoalField label={t('profileCalorieGoal')}  value={calorieGoal}  unit="kcal" onChange={setCalorieGoal} />
          <GoalField label={t('profileWeightGoal')}   value={weightGoal}   unit="kg"   onChange={setWeightGoal} />
          <GoalField label={t('profileProteinGoal')}  value={proteinGoal}  unit="g"    onChange={setProteinGoal} />
        </div>

        {/* ── App section ── */}
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest pt-4 pb-2">{t('profileApp')}</h2>
          <button className="w-full flex items-center justify-between py-3.5 border-b border-lily/10 cursor-pointer hover:text-lily/80 transition-colors">
            <span className="text-sm font-bold text-lily/70">{t('profileNotifications')}</span>
            <div className="flex items-center gap-1 text-lily/30">
              <span className="text-xs font-bold">{t('profileNotificationsOn')}</span>
              <ChevronRight size={14} />
            </div>
          </button>

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

          <button className="w-full flex items-center justify-between py-3.5 cursor-pointer hover:text-lily/80 transition-colors">
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
    </div>
  )
}
