import { useRef, useState } from 'react'
import {
  Utensils, Dumbbell, ChevronRight, Flame, Droplets, Beef,
  Droplet, Send, CalendarDays, Camera,
} from 'lucide-react'
import BottomNav from '../components/BottomNav'
import PhotoLogSheet from '../components/PhotoLogSheet'
import { useLanguage } from '../context/LanguageContext'
import { NOMNOM_SMILING, NOMNOM_DRINKING_WATER, NOMNOM_EXCERCISE_AND_SNACK, NOMNOM_EXCERCISING } from '../assets'

// ─── Mock data ────────────────────────────────────────────────────────────────
const GOAL_KCAL = 2000
const CONSUMED_KCAL = 1340
const BURNED_KCAL = 210
const NET_KCAL = CONSUMED_KCAL - BURNED_KCAL
const WATER_GLASSES = 5
const WATER_GOAL = 8

const macros = {
  protein: { eaten: 72,  goal: 120, color: 'bg-lily' },
  fat:     { eaten: 44,  goal: 70,  color: 'bg-[#f7a84a]' },
  carbs:   { eaten: 163, goal: 230, color: 'bg-[#3ec9a7]' },
}

const todayPlan = [
  { meal: 'Śniadanie', name: 'Owsianka z owocami', kcal: 380 },
  { meal: 'Obiad',     name: 'Kurczak z ryżem',    kcal: 620 },
  { meal: 'Kolacja',   name: 'Sałatka grecka',      kcal: 310 },
]

const entries = [
  { id: 1, type: 'food',     name: 'Owsianka z bananem', time: '08:15', kcal:  380 },
  { id: 2, type: 'exercise', name: 'Bieganie 30 min',     time: '09:00', kcal: -210 },
  { id: 3, type: 'food',     name: 'Kurczak z ryżem',     time: '13:00', kcal:  620 },
  { id: 4, type: 'food',     name: 'Jabłko',              time: '16:30', kcal:   80 },
  { id: 5, type: 'food',     name: 'Jogurt naturalny',    time: '17:45', kcal:  260 },
]
// ─────────────────────────────────────────────────────────────────────────────

function CalorieRing() {
  const { t } = useLanguage()
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(NET_KCAL / GOAL_KCAL, 1))
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#7d3ed018" strokeWidth="12" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#7d3ed0" strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-lily leading-none">{NET_KCAL}</span>
        <span className="text-[10px] font-bold text-lily/50 uppercase tracking-wider mt-0.5">{t('dashboardNetKcal')}</span>
      </div>
    </div>
  )
}

function MacroBar({ label, eaten, goal, color, icon: Icon }: {
  label: string; eaten: number; goal: number; color: string; icon: React.ElementType
}) {
  const pct = Math.min(Math.round((eaten / goal) * 100), 100)
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-24 shrink-0">
        <Icon size={14} className="text-lily/60 shrink-0" />
        <span className="text-xs font-bold text-lily/70">{label}</span>
      </div>
      <div className="flex-1 h-3 bg-lily/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-lily/60 w-16 text-right shrink-0">{eaten} / {goal} g</span>
    </div>
  )
}

function QuickLogWidget({ onCamera }: { onCamera: () => void }) {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'food' | 'exercise'>('food')
  const [text, setText] = useState('')
  return (
    <div className="bg-ivory rounded-2xl border-[3px] border-lily p-4 space-y-3 relative overflow-hidden">
      <img src={NOMNOM_EXCERCISE_AND_SNACK} alt="" aria-hidden className="absolute -right-2 -bottom-2 w-20 opacity-60 pointer-events-none select-none" />
      <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('dashboardQuickLog')}</h2>
      <div className="flex gap-2">
        <button
          onClick={() => setMode('food')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold border-[2px] transition-colors cursor-pointer ${
            mode === 'food' ? 'bg-primary border-lily text-lily' : 'bg-white border-lily/20 text-lily/40'
          }`}
        >
          <Utensils size={14} /> {t('dashboardMeal')}
        </button>
        <button
          onClick={() => setMode('exercise')}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold border-[2px] transition-colors cursor-pointer ${
            mode === 'exercise' ? 'bg-primary border-lily text-lily' : 'bg-white border-lily/20 text-lily/40'
          }`}
        >
          <Dumbbell size={14} /> {t('dashboardExercise')}
        </button>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={mode === 'food' ? t('dashboardMealPlaceholder') : t('dashboardExercisePlaceholder')}
          style={{ borderRadius: '12px 4px 14px 6px / 4px 12px 6px 14px' }}
          className="flex-1 bg-white border-[2px] border-lily/30 text-lily placeholder:text-lily/35
                     px-3 py-2.5 text-sm font-semibold outline-none focus:border-lily/60 transition-colors"
        />
        <button
          onClick={onCamera}
          className="w-11 h-11 bg-white border-[2px] border-lily/30 rounded-xl flex items-center justify-center shrink-0
                     hover:border-lily/60 active:scale-95 transition-all cursor-pointer"
          aria-label={t('dashboardAddPhoto')}
        >
          <Camera size={17} className="text-lily/60" />
        </button>
        <button
          className="w-11 h-11 bg-lily rounded-xl flex items-center justify-center shrink-0
                     active:scale-95 transition-transform cursor-pointer"
          aria-label={t('dashboardAddEntry')}
        >
          <Send size={16} strokeWidth={2.5} className="text-primary -translate-y-px translate-x-px" />
        </button>
      </div>
    </div>
  )
}

function WaterWidget() {
  const { t } = useLanguage()
  const [glasses, setGlasses] = useState(WATER_GLASSES)
  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4 relative overflow-hidden">
      <img src={NOMNOM_DRINKING_WATER} alt="" aria-hidden className="absolute -right-2 -bottom-2 w-16 opacity-70 pointer-events-none select-none" />
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Droplet size={14} className="text-[#3ec9a7]" fill="#3ec9a7" />
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('dashboardWater')}</h2>
        </div>
        <span className="text-xs font-bold text-lily/40">
          {t('dashboardWaterGlasses').replace('{glasses}', String(glasses)).replace('{goal}', String(WATER_GOAL))}
        </span>
      </div>
      <div className="flex gap-1.5 pr-10">
        {Array.from({ length: WATER_GOAL }).map((_, i) => (
          <button
            key={i}
            onClick={() => setGlasses(i < glasses ? i : i + 1)}
            className={`flex-1 h-7 rounded-lg transition-colors cursor-pointer ${
              i < glasses ? 'bg-[#3ec9a7]' : 'bg-lily/10'
            }`}
            aria-label={t('dashboardWaterGlass').replace('{n}', String(i + 1))}
          />
        ))}
      </div>
    </div>
  )
}

function TodayPlanWidget() {
  const { t } = useLanguage()
  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <CalendarDays size={14} className="text-lily/50" />
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('dashboardTodayPlan')}</h2>
        </div>
        <button className="flex items-center gap-0.5 text-xs font-bold text-lily/40 hover:text-lily/70 transition-colors cursor-pointer">
          {t('dashboardPlannerLink')} <ChevronRight size={12} />
        </button>
      </div>
      <div className="space-y-2">
        {todayPlan.map(item => (
          <div key={item.meal} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-lily/30 uppercase w-16">{item.meal}</span>
              <span className="text-sm font-bold text-lily">{item.name}</span>
            </div>
            <span className="text-xs font-bold text-lily/40">{item.kcal} kcal</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EntryRow({ entry }: { entry: typeof entries[number] }) {
  const isExercise = entry.type === 'exercise'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-lily/10 last:border-0">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isExercise ? 'bg-[#3ec9a7]/15' : 'bg-primary/30'}`}>
        {isExercise
          ? <Dumbbell size={17} className="text-[#3ec9a7]" strokeWidth={2} />
          : <Utensils size={17} className="text-lily" strokeWidth={2} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-lily truncate">{entry.name}</p>
        <p className="text-xs font-semibold text-lily/40">{entry.time}</p>
      </div>
      <span className={`text-sm font-extrabold shrink-0 ${entry.kcal < 0 ? 'text-[#3ec9a7]' : 'text-lily'}`}>
        {entry.kcal > 0 ? '+' : ''}{entry.kcal} kcal
      </span>
    </div>
  )
}

function todayLabel(lang: string) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date()).replace(/^\w/, c => c.toUpperCase())
}

export default function DashboardPage() {
  const { t, lang } = useLanguage()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCameraClick = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPhotoFile(f)
    e.target.value = ''
  }

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Yellow header ── */}
      <div className="bg-primary px-5 pt-14 pb-8 relative overflow-hidden">
        <p className="text-lily/60 text-xs font-bold uppercase tracking-widest mb-1">{todayLabel(lang)}</p>
        <h1 className="text-2xl font-extrabold text-lily">{t('dashboardGreeting')}</h1>
        <img src={NOMNOM_SMILING} alt="" aria-hidden className="absolute bottom-0 right-2 w-24 pointer-events-none select-none" />
      </div>

      <div className="px-4 pb-28 space-y-4 mt-4 relative z-10">
        {/* ── Calorie summary ── */}
        <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <CalorieRing />
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Utensils size={13} className="text-lily/50" />
                  <span className="text-xs font-bold text-lily/60">{t('dashboardConsumed')}</span>
                </div>
                <span className="text-sm font-extrabold text-lily">{CONSUMED_KCAL} kcal</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Flame size={13} className="text-[#3ec9a7]" />
                  <span className="text-xs font-bold text-lily/60">{t('dashboardBurned')}</span>
                </div>
                <span className="text-sm font-extrabold text-[#3ec9a7]">−{BURNED_KCAL} kcal</span>
              </div>
              <div className="h-px bg-lily/10" />
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-lily/50">{t('dashboardDailyGoal')}</span>
                <span className="text-sm font-extrabold text-lily/50">{GOAL_KCAL} kcal</span>
              </div>
              <div className="bg-primary/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
                <span className="text-xs font-bold text-lily">{t('dashboardRemaining')}</span>
                <span className="text-sm font-extrabold text-lily">{GOAL_KCAL - NET_KCAL} kcal</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Macros ── */}
        <div className="bg-white rounded-2xl shadow-md border-[2px] border-lily/15 p-5">
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-4">{t('dashboardMacros')}</h2>
          <div className="space-y-3.5">
            <MacroBar label={t('dashboardProtein')} eaten={macros.protein.eaten} goal={macros.protein.goal} color={macros.protein.color} icon={Beef} />
            <MacroBar label={t('dashboardFat')}     eaten={macros.fat.eaten}     goal={macros.fat.goal}     color={macros.fat.color}     icon={Droplets} />
            <MacroBar label={t('dashboardCarbs')}   eaten={macros.carbs.eaten}   goal={macros.carbs.goal}   color={macros.carbs.color}   icon={Flame} />
          </div>
        </div>

        {/* ── Quick log widget ── */}
        <QuickLogWidget onCamera={handleCameraClick} />

        {/* ── Water ── */}
        <WaterWidget />

        {/* ── Today's plan ── */}
        <TodayPlanWidget />

        {/* ── Log entries ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src={NOMNOM_EXCERCISING} alt="" aria-hidden className="w-7 h-7 object-contain pointer-events-none select-none" />
              <h2 className="text-sm font-extrabold text-lily/60 uppercase tracking-widest">{t('dashboardTodayEntries')}</h2>
            </div>
            <button className="flex items-center gap-0.5 text-xs font-bold text-lily/40 hover:text-lily/70 transition-colors cursor-pointer">
              {t('dashboardAllEntries')} <ChevronRight size={13} />
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-md border-[2px] border-lily/15 px-4">
            {entries.map(e => <EntryRow key={e.id} entry={e} />)}
          </div>
        </div>
      </div>

      {/* Hidden file input — opens camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden
      />

      <PhotoLogSheet
        file={photoFile}
        onClose={() => setPhotoFile(null)}
      />

      <BottomNav />
    </div>
  )
}
