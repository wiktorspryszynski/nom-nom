import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Utensils, Dumbbell, ChevronRight, Flame, Droplets, Beef,
  Send, CalendarDays, Camera, Loader2, Trash2,
} from 'lucide-react'
import BottomNav from '../components/BottomNav'
import PhotoLogSheet from '../components/PhotoLogSheet'
import { useLanguage } from '../context/LanguageContext'
import { tracker, type DailyData, type DailyEntry, ApiError } from '../lib/api'
import {
  NOMNOM_SMILING, NOMNOM_HAPPY, NOMNOM_SLIGHT_SMILE,
  NOMNOM_BEHIND, NOMNOM_BEHIND_QUESTION,
  NOMNOM_DRINKING_WATER, NOMNOM_EXCERCISE_AND_SNACK, NOMNOM_EXCERCISING,
} from '../assets'

const HEADER_ICONS = [NOMNOM_SMILING, NOMNOM_HAPPY, NOMNOM_SLIGHT_SMILE]

// ─── Calorie Ring ─────────────────────────────────────────────────────────────
function CalorieRing({ netKcal, goalKcal }: { netKcal: number; goalKcal: number }) {
  const { t } = useLanguage()
  const radius = 54
  const circumference = 2 * Math.PI * radius

  const isNegative = netKcal < 0
  const isExceeded = netKcal > goalKcal

  const mainOffset   = circumference * (1 - (isNegative ? 0 : Math.min(netKcal / goalKcal, 1)))
  const overflowOffset = circumference * (1 - Math.min((netKcal - goalKcal) / goalKcal, 1))
  const deficitOffset  = circumference * (1 - Math.min(Math.abs(netKcal) / goalKcal, 1))

  const centerColor = isNegative ? '#3ec9a7' : isExceeded ? '#f97316' : '#7d3ed0'
  const centerText  = isNegative ? `+${Math.abs(netKcal)}` : String(netKcal)

  const transition = { transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }

  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(90deg) scaleX(-1)' }} viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#7d3ed018" strokeWidth="12" />
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#7d3ed0" strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={mainOffset} style={transition} />
      </svg>
      {isNegative && (
        <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#3ec9a7" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={deficitOffset} style={transition} />
        </svg>
      )}
      {isExceeded && (
        <svg className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }} viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#f97316" strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={overflowOffset} style={transition} />
        </svg>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold leading-none" style={{ color: centerColor }}>{centerText}</span>
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
      <span className="text-xs font-bold text-lily/60 w-18 text-right shrink-0">{eaten} / {goal} g</span>
    </div>
  )
}

function glassColor(glasses: number): string {
  if (glasses <= 2) return '#f97316'
  if (glasses <= 4) return '#f7a84a'
  if (glasses <= 6) return '#3ec9a7'
  return '#3b82f6'
}

function WaterWidget({
  glasses: initial, goal, onSave,
}: { glasses: number; goal: number; onSave: (n: number) => void }) {
  const { t } = useLanguage()
  const [glasses, setGlasses] = useState(initial)

  // Sync with external data (initial load)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setGlasses(initial), [initial])

  const change = (n: number) => {
    const clamped = Math.min(Math.max(n, 0), goal)
    setGlasses(clamped)
    onSave(clamped)
  }

  const color = glassColor(glasses)
  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <img src={NOMNOM_DRINKING_WATER} alt="" aria-hidden className="w-8 h-8 object-contain pointer-events-none select-none" />
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('dashboardWater')}</h2>
        </div>
        <span className="text-xs font-bold text-lily/40">
          {t('dashboardWaterGlasses').replace('{glasses}', String(glasses)).replace('{goal}', String(goal))}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => change(glasses - 1)}
          disabled={glasses === 0}
          className="w-8 h-8 rounded-lg bg-lily/8 flex items-center justify-center text-lily font-extrabold text-base shrink-0
                     cursor-pointer active:scale-95 transition-transform disabled:opacity-25 disabled:cursor-default"
        >−</button>
        <div className="flex-1 flex gap-1">
          {Array.from({ length: goal }).map((_, i) => (
            <button
              key={i}
              onClick={() => change(i < glasses ? i : i + 1)}
              style={{ backgroundColor: i < glasses ? color : undefined }}
              className={`flex-1 h-7 rounded-lg transition-colors cursor-pointer ${i < glasses ? '' : 'bg-lily/10'}`}
              aria-label={t('dashboardWaterGlass').replace('{n}', String(i + 1))}
            />
          ))}
        </div>
        <button
          onClick={() => change(glasses + 1)}
          disabled={glasses === goal}
          className="w-8 h-8 rounded-lg bg-lily/8 flex items-center justify-center text-lily font-extrabold text-base shrink-0
                     cursor-pointer active:scale-95 transition-transform disabled:opacity-25 disabled:cursor-default"
        >+</button>
      </div>
    </div>
  )
}

function QuickLogWidget({
  onCamera, onSend, sending, aiAvailable,
}: {
  onCamera: () => void
  onSend: (text: string, mode: 'food' | 'exercise') => void
  sending: boolean
  aiAvailable: boolean
}) {
  const { t } = useLanguage()
  const [mode, setMode] = useState<'food' | 'exercise'>('food')
  const [text, setText] = useState('')

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text.trim(), mode)
    setText('')
  }

  return (
    <div className="bg-ivory rounded-2xl border-[3px] border-lily p-4 space-y-3">
      <div className="flex items-center gap-2">
        <img src={NOMNOM_EXCERCISE_AND_SNACK} alt="" aria-hidden className="w-8 h-8 object-contain pointer-events-none select-none" />
        <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('dashboardQuickLog')}</h2>
        {!aiAvailable && (
          <span className="ml-auto text-[10px] font-bold text-orange-500 bg-orange-50 rounded-lg px-2 py-0.5">AI offline</span>
        )}
      </div>
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
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={mode === 'food' ? t('dashboardMealPlaceholder') : t('dashboardExercisePlaceholder')}
          style={{ borderRadius: '12px 4px 14px 6px / 4px 12px 6px 14px' }}
          className="flex-1 bg-white border-[2px] border-lily/30 text-lily placeholder:text-lily/35
                     px-3 py-2.5 text-sm font-semibold outline-none focus:border-lily/60 transition-colors"
        />
        <button
          onClick={mode === 'food' ? onCamera : undefined}
          disabled={mode === 'exercise' || !aiAvailable}
          title={!aiAvailable ? 'AI unavailable — use text entry' : undefined}
          className={`w-11 h-11 bg-white border-[2px] rounded-xl flex items-center justify-center shrink-0 transition-all ${
            mode === 'exercise' || !aiAvailable
              ? 'border-lily/10 opacity-30 cursor-not-allowed'
              : 'border-lily/30 hover:border-lily/60 active:scale-95 cursor-pointer'
          }`}
          aria-label={t('dashboardAddPhoto')}
        >
          <Camera size={17} className="text-lily/60" />
        </button>
        <button
          onClick={handleSend}
          disabled={sending || !text.trim()}
          className="w-11 h-11 bg-lily rounded-xl flex items-center justify-center shrink-0
                     active:scale-95 transition-transform cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('dashboardAddEntry')}
        >
          {sending
            ? <Loader2 size={16} className="text-primary animate-spin" />
            : <Send size={16} strokeWidth={2.5} className="text-primary -translate-y-px translate-x-px" />
          }
        </button>
      </div>
    </div>
  )
}

function EntryRow({ entry, onDelete }: { entry: DailyEntry; onDelete?: (id: number) => void }) {
  const isExercise = entry.type === 'exercise'
  return (
    <div className="flex items-center gap-3 py-3 border-b border-lily/10 last:border-0 group">
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
      {onDelete && entry.type === 'food' && (
        <button
          onClick={() => onDelete(entry.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center text-lily/30 hover:text-red-400 cursor-pointer shrink-0"
          aria-label="Delete entry"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

function todayLabel(lang: string) {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(new Date()).replace(/^\w/, c => c.toUpperCase())
}

const EMPTY_DAILY: DailyData = {
  kcal_consumed: 0,
  kcal_burned: 0,
  kcal_goal: 2000,
  macros: {
    protein: { eaten: 0, goal: 120 },
    fat: { eaten: 0, goal: 70 },
    carbs: { eaten: 0, goal: 230 },
  },
  water_glasses: 0,
  water_goal: 8,
  entries: [],
}

export default function DashboardPage() {
  const { t, lang } = useLanguage()
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [headerIcon] = useState(() => HEADER_ICONS[Math.floor(Math.random() * HEADER_ICONS.length)])
  const [nomState, setNomState] = useState<'default' | 'behind' | 'behind_question'>('default')
  const nomTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const [daily, setDaily] = useState<DailyData>(EMPTY_DAILY)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const [sendError, setSendError] = useState('')

  const fetchDaily = useCallback(async () => {
    try {
      const data = await tracker.getDaily()
      setDaily(data)
    } catch {
      // keep empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDaily()
    // Check AI availability
    fetch('/api/health').then(r => r.json()).then(d => setAiAvailable(d.ai_available ?? true)).catch(() => {})
  }, [fetchDaily])

  useEffect(() => () => { nomTimers.current.forEach(clearTimeout) }, [])

  const handleNomClick = () => {
    if (nomState !== 'default') return
    setNomState('behind')
    nomTimers.current.push(setTimeout(() => setNomState('behind_question'), 1500))
    nomTimers.current.push(setTimeout(() => setNomState('default'), 3500))
  }

  const currentHeaderIcon = nomState === 'behind' ? NOMNOM_BEHIND
    : nomState === 'behind_question' ? NOMNOM_BEHIND_QUESTION
    : headerIcon

  const handleCameraClick = () => fileInputRef.current?.click()
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setPhotoFile(f)
    e.target.value = ''
  }

  const handleSend = async (text: string, mode: 'food' | 'exercise') => {
    setSending(true)
    setSendError('')
    try {
      // Ask AI to parse; it returns structured data we can confirm immediately
      const parsed = await tracker.logText(text)
      // Auto-save (no confirmation step for text quick-log)
      await tracker.saveLog({
        description: parsed.name,
        kcal: parsed.kcal,
        protein: parsed.protein,
        fat: parsed.fat,
        carbs: parsed.carbs,
        source_type: mode === 'exercise' ? 'text' : 'text',
        ai_confidence: parsed.confidence,
        ...(parsed.is_exercise ? {
          activity_type: parsed.name,
          kcal_burned: parsed.kcal,
        } : {}),
      })
      fetchDaily()
    } catch (err) {
      if (err instanceof ApiError && (err.detail === 'AI_UNAVAILABLE' || err.status === 503)) {
        setAiAvailable(false)
        setSendError('AI unavailable — try USDA search or enter manually')
      } else if (err instanceof ApiError && (err.detail === 'AI_QUOTA_EXCEEDED' || err.status === 429)) {
        setSendError('Daily AI limit reached — try again tomorrow')
      } else {
        setSendError('Could not parse entry. Try being more specific.')
      }
    } finally {
      setSending(false)
    }
  }

  const handleWater = async (glasses: number) => {
    try {
      await tracker.logWater(glasses)
      setDaily(d => ({ ...d, water_glasses: glasses }))
    } catch { /* silent */ }
  }

  const handleDeleteEntry = async (id: number) => {
    try {
      await tracker.deleteLog(id)
      setDaily(d => ({ ...d, entries: d.entries.filter(e => e.id !== id) }))
    } catch { /* silent */ }
  }

  const handlePhotoSaved = () => {
    setPhotoFile(null)
    fetchDaily()
  }

  const net = daily.kcal_consumed - daily.kcal_burned
  const remaining = daily.kcal_goal - net

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Yellow header ── */}
      <div className="bg-primary px-5 pt-14 pb-8 relative overflow-hidden">
        <p className="text-lily/60 text-xs font-bold uppercase tracking-widest mb-1">{todayLabel(lang)}</p>
        <h1 className="text-2xl font-extrabold text-lily">{t('dashboardGreeting')}</h1>
        <img
          src={currentHeaderIcon}
          alt=""
          onClick={handleNomClick}
          className="absolute bottom-0 right-2 w-24 select-none cursor-pointer transition-transform duration-200 active:scale-95"
        />
      </div>

      <div className="pb-28 mt-4 relative z-10">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 size={32} className="text-lily animate-spin" />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* ── Calorie summary — full width ── */}
            <div className="sm:col-span-2 bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <CalorieRing netKcal={net} goalKcal={daily.kcal_goal} />
                  <span className="text-[10px] font-bold text-lily/30">{t('dashboardDailyGoal')}: {daily.kcal_goal} kcal</span>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-[10px] font-bold text-lily/40 uppercase tracking-wide">{t('dashboardConsumed')}</span>
                    <span className="text-2xl font-extrabold text-[#f7a84a] leading-none">{daily.kcal_consumed} <span className="text-xs font-bold text-[#f7a84a]/50">kcal</span></span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-1">
                    <span className="text-[10px] font-bold text-lily/40 uppercase tracking-wide">{t('dashboardBurned')}</span>
                    <span className="text-2xl font-extrabold text-[#3ec9a7] leading-none">-{daily.kcal_burned} <span className="text-xs font-bold text-[#3ec9a7]/35">kcal</span></span>
                  </div>
                  <div className="h-px bg-lily/15 my-1" />
                  <div className="flex items-center justify-between bg-primary/40 rounded-xl px-3 py-2">
                    <span className="text-[10px] font-extrabold text-lily/50 uppercase tracking-wide">{t('dashboardRemaining')}</span>
                    <span className="text-3xl font-extrabold leading-none" style={{ color: remaining > 200 ? '#3ec9a7' : remaining > 0 ? '#f7a84a' : '#f97316' }}>
                      {remaining} <span className="text-xs font-bold" style={{ opacity: 0.4 }}>kcal</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Macros ── */}
            <div className="bg-white rounded-2xl shadow-md border-[2px] border-lily/15 p-5">
              <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-4">{t('dashboardMacros')}</h2>
              <div className="space-y-3.5">
                <MacroBar label={t('dashboardProtein')} eaten={daily.macros.protein.eaten} goal={daily.macros.protein.goal} color="bg-lily" icon={Beef} />
                <MacroBar label={t('dashboardFat')}     eaten={daily.macros.fat.eaten}     goal={daily.macros.fat.goal}     color="bg-[#f7a84a]" icon={Droplets} />
                <MacroBar label={t('dashboardCarbs')}   eaten={daily.macros.carbs.eaten}   goal={daily.macros.carbs.goal}   color="bg-[#3ec9a7]" icon={Flame} />
              </div>
            </div>

            {/* ── Water ── */}
            <WaterWidget glasses={daily.water_glasses} goal={daily.water_goal} onSave={handleWater} />

            {/* ── Quick log — full width ── */}
            <div className="sm:col-span-2 space-y-2">
              <QuickLogWidget
                onCamera={handleCameraClick}
                onSend={handleSend}
                sending={sending}
                aiAvailable={aiAvailable}
              />
              {sendError && (
                <p className="text-xs font-bold text-orange-500 text-center">{sendError}</p>
              )}
            </div>

            {/* ── Today's plan stub ── */}
            <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-lily/50" />
                  <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('dashboardTodayPlan')}</h2>
                </div>
                <a href="/planner" className="flex items-center gap-0.5 text-xs font-bold text-lily/40 hover:text-lily/70 transition-colors cursor-pointer">
                  {t('dashboardPlannerLink')} <ChevronRight size={12} />
                </a>
              </div>
              <a href="/planner" className="block text-sm font-semibold text-lily/40 hover:text-lily/70 transition-colors text-center py-3">
                {t('dashboardPlannerLink')} →
              </a>
            </div>

            {/* ── Log entries ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <img src={NOMNOM_EXCERCISING} alt="" aria-hidden className="w-7 h-7 object-contain pointer-events-none select-none" />
                  <h2 className="text-sm font-extrabold text-lily/60 uppercase tracking-widest">{t('dashboardTodayEntries')}</h2>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-md border-[2px] border-lily/15 px-4">
                {daily.entries.length === 0 ? (
                  <p className="text-center text-sm font-semibold text-lily/30 py-6">{t('dashboardNoEntries')}</p>
                ) : (
                  daily.entries.map(e => (
                    <EntryRow key={`${e.type}-${e.id}`} entry={e} onDelete={handleDeleteEntry} />
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Hidden file input */}
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
        onClose={handlePhotoSaved}
      />

      <BottomNav />
    </div>
  )
}
