import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Plus, ChevronLeft, ChevronRight, Utensils, X, Loader2 } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useLanguage } from '../context/LanguageContext'
import { mealPlanner, type MealPlan, type MealPlanItem, ApiError } from '../lib/api'
import { NOMNOM_EATING_RAMEN } from '../assets'

type Tab = 'plan' | 'saved'

function DaySelector({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
  const { ta } = useLanguage()
  const DAYS = ta('plannerDays')
  const today = new Date().getDay()
  const todayIndex = today === 0 ? 6 : today - 1
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {DAYS.map((day, i) => {
        const isToday = i === todayIndex
        const isSelected = i === selected
        return (
          <button
            key={day}
            onClick={() => onSelect(i)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl shrink-0 transition-colors cursor-pointer ${
              isSelected ? 'bg-lily text-primary' : isToday ? 'bg-primary/50 text-lily' : 'bg-lily/8 text-lily/50'
            }`}
          >
            <span className="text-[10px] font-extrabold uppercase tracking-wide">{day}</span>
            {isToday && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary' : 'bg-lily'}`} />}
          </button>
        )
      })}
    </div>
  )
}

function DayView({ dayIndex, items }: { dayIndex: number; items: MealPlanItem[] }) {
  const { t, ta } = useLanguage()
  const MEALS = ta('plannerMeals')
  // day_number is 1-based; dayIndex is 0-based (Mon=0)
  const dayItems = items.filter(i => i.day_number === dayIndex + 1)
  const totalKcal = dayItems.reduce((s, m) => s + (m.kcal ?? 0), 0)

  return (
    <div className="space-y-3">
      {totalKcal > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-lily/40">{t('plannerTotal')}</span>
          <span className="text-xs font-extrabold text-lily">{totalKcal} kcal</span>
        </div>
      )}
      {dayItems.length === 0 ? (
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-6 text-center">
          <p className="text-sm font-semibold text-lily/30">{t('plannerNoMeals')}</p>
        </div>
      ) : (
        dayItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-lily/35 uppercase tracking-widest">{item.meal_name}</span>
              {item.kcal && <span className="text-xs font-bold text-lily/40">{item.kcal} kcal</span>}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-lily">{item.meal_name}</p>
                {item.description && <p className="text-xs font-semibold text-lily/40 mt-0.5">{item.description}</p>}
              </div>
            </div>
            {(item.protein || item.fat || item.carbs) && (
              <div className="flex gap-3 mt-2">
                {item.protein && <span className="text-[10px] font-bold text-lily/30">P: {item.protein}g</span>}
                {item.fat && <span className="text-[10px] font-bold text-lily/30">T: {item.fat}g</span>}
                {item.carbs && <span className="text-[10px] font-bold text-lily/30">W: {item.carbs}g</span>}
              </div>
            )}
          </div>
        ))
      )}
      {/* Placeholder slots for empty meal types */}
      {MEALS.slice(dayItems.length).map((meal, idx) => (
        <div key={`empty-${idx}`} className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-lily/35 uppercase tracking-widest">{meal}</span>
          </div>
          <button className="flex items-center gap-1.5 text-sm font-bold text-lily/35 hover:text-lily/60 transition-colors cursor-pointer">
            <Plus size={14} /> {t('plannerAddMeal')}
          </button>
        </div>
      ))}
    </div>
  )
}

function GenerateModal({
  open, onClose, onGenerate,
}: { open: boolean; onClose: () => void; onGenerate: (prefs: string) => void }) {
  const { t } = useLanguage()
  const [prefs, setPrefs] = useState('')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-extrabold text-lily">{t('plannerGenerateAI')}</h2>
        <textarea
          value={prefs}
          onChange={e => setPrefs(e.target.value)}
          placeholder={t('plannerPreferencesPlaceholder')}
          rows={3}
          className="w-full bg-ivory border-[2px] border-lily/30 text-lily text-sm font-semibold
                     px-4 py-3 rounded-xl outline-none focus:border-lily/60 resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-[2px] border-lily/30 text-lily/60 rounded-2xl py-3 text-sm font-extrabold cursor-pointer"
          >
            {t('plannerCancel')}
          </button>
          <button
            onClick={() => { onGenerate(prefs); onClose() }}
            className="flex-1 bg-lily text-primary rounded-2xl py-3 text-sm font-extrabold cursor-pointer"
          >
            {t('plannerGenerate')}
          </button>
        </div>
      </div>
    </div>
  )
}

function weekLabel(startDate: Date) {
  const end = new Date(startDate)
  end.setDate(startDate.getDate() + 6)
  const fmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' })
  return `${fmt.format(startDate)} – ${fmt.format(end)}`
}

export default function PlannerPage() {
  const { t, ta } = useLanguage()
  const DAYS = ta('plannerDays')
  const [tab, setTab] = useState<Tab>('plan')
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })

  const [plans, setPlans] = useState<MealPlan[]>([])
  const [activePlan, setActivePlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const fetchPlans = useCallback(async () => {
    try {
      const data = await mealPlanner.list()
      setPlans(data)
      if (data.length > 0) setActivePlan(data[0])
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPlans()
    fetch('/api/health').then(r => r.json()).then(d => setAiAvailable(d.ai_available ?? true)).catch(() => {})
  }, [fetchPlans])

  const handleGenerate = async (preferences: string) => {
    setGenerating(true)
    setError('')
    try {
      const plan = await mealPlanner.generate({ days: 7, meals_per_day: 3, preferences })
      setActivePlan(plan)
      setPlans(p => [plan, ...p])
    } catch (err) {
      if (err instanceof ApiError && (err.detail === 'AI_UNAVAILABLE' || err.status === 503)) {
        setAiAvailable(false)
        setError('AI service unavailable')
      } else if (err instanceof ApiError && (err.detail === 'AI_QUOTA_EXCEEDED' || err.status === 429)) {
        setError('Daily AI limit reached — try again tomorrow')
      } else {
        setError('Generation failed. Try again.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const currentItems = activePlan?.items ?? []
  const startDate = activePlan ? new Date(activePlan.start_date) : new Date()

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Header ── */}
      <div className="bg-primary px-5 pt-14 pb-6 relative overflow-hidden">
        <img src={NOMNOM_EATING_RAMEN} alt="" aria-hidden className="absolute bottom-0 right-2 w-24 pointer-events-none select-none" />
        <h1 className="text-2xl font-extrabold text-lily mb-4">{t('plannerTitle')}</h1>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-3">
          <button
            disabled={plans.length <= 1}
            onClick={() => {
              const idx = plans.indexOf(activePlan!)
              if (idx < plans.length - 1) setActivePlan(plans[idx + 1])
            }}
            className="p-1 text-lily/50 hover:text-lily cursor-pointer disabled:opacity-25"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-extrabold text-lily">{weekLabel(startDate)}</span>
          <button
            disabled={plans.length <= 1}
            onClick={() => {
              const idx = plans.indexOf(activePlan!)
              if (idx > 0) setActivePlan(plans[idx - 1])
            }}
            className="p-1 text-lily/50 hover:text-lily cursor-pointer disabled:opacity-25"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <DaySelector selected={selectedDay} onSelect={setSelectedDay} />
      </div>

      <div className="px-4 pb-28 space-y-4 mt-4">
        {/* ── AI generate CTA ── */}
        <button
          onClick={() => aiAvailable ? setShowModal(true) : setError('AI unavailable')}
          disabled={generating}
          title={!aiAvailable ? 'AI service unavailable' : undefined}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-extrabold shadow-md active:scale-[0.98] transition-transform cursor-pointer ${
            aiAvailable ? 'bg-lily text-primary' : 'bg-lily/30 text-primary/50 cursor-not-allowed'
          }`}
        >
          {generating
            ? <><Loader2 size={18} className="animate-spin" /> {t('plannerGenerating')}</>
            : <><Sparkles size={18} strokeWidth={2.5} /> {t('plannerGenerateAI')}</>
          }
        </button>

        {error && <p className="text-xs font-bold text-orange-500 text-center">{error}</p>}

        {/* ── Tab switcher ── */}
        <div className="flex bg-lily/8 rounded-2xl p-1">
          {(['plan', 'saved'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-colors cursor-pointer ${
                tab === tabKey ? 'bg-white text-lily shadow-sm' : 'text-lily/40'
              }`}
            >
              {tabKey === 'plan'
                ? t('plannerTabPlan').replace('{day}', DAYS[selectedDay])
                : t('plannerTabSaved')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="text-lily animate-spin" />
          </div>
        ) : tab === 'plan' ? (
          <DayView dayIndex={selectedDay} items={currentItems} />
        ) : (
          <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-6 text-center">
            <p className="text-sm font-semibold text-lily/30">{t('plannerSavedEmpty')}</p>
          </div>
        )}
      </div>

      <GenerateModal open={showModal} onClose={() => setShowModal(false)} onGenerate={handleGenerate} />
      <BottomNav />
    </div>
  )
}
