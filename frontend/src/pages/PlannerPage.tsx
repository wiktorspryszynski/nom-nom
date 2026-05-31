import { useCallback, useEffect, useState } from 'react'
import { Sparkles, Plus, ChevronLeft, ChevronRight, Loader2, Trash2, Dumbbell, Utensils, Pencil, CheckCircle2, Circle } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import EntryFormSheet from '../components/EntryFormSheet'
import { EntryRow } from '../components/EntryRow'
import { useLanguage } from '../context/LanguageContext'
import { mealPlanner, tracker, library, type MealPlan, type MealPlanItem, type DailyData, type DailyEntry, type SavedItem, ApiError } from '../lib/api'
import { NOMNOM_EATING_RAMEN } from '../assets'

type Tab = 'plan' | 'saved'
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`)
}

function formatDateOnly(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getWeekStart(value: Date) {
  const start = new Date(value)
  const day = start.getDay()
  const offset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + offset)
  start.setHours(0, 0, 0, 0)
  return start
}

// Maps slot index in MEALS array → MealType value passed to EntryFormSheet
const SLOT_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

const MEAL_NAME_ALIASES: Record<MealType, string[]> = {
  breakfast: ['breakfast', 'śniadanie', 'drugie śniadanie'],
  lunch: ['lunch', 'obiad'],
  dinner: ['dinner', 'kolacja'],
  snack: ['snack', 'przekąska', 'przekaska'],
  other: ['other', 'inne'],
}

function mealNameMatchesSlot(mealName: string, slotType: MealType): boolean {
  const normalized = mealName.toLowerCase().trim()
  return MEAL_NAME_ALIASES[slotType].some(alias => normalized.includes(alias))
}

function mealTypeFromName(mealName: string): MealType {
  const types: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
  return types.find(t => mealNameMatchesSlot(mealName, t)) ?? 'other'
}

function getSlotCalendarDate(selectedDayIndex: number, referenceDate: Date) {
  const weekStart = getWeekStart(referenceDate)
  const slotDate = new Date(weekStart)
  slotDate.setDate(weekStart.getDate() + selectedDayIndex)
  slotDate.setHours(0, 0, 0, 0)
  return slotDate
}

function getPlanDayNumber(plan: MealPlan, selectedDayIndex: number): number | null {
  const planStart = parseDateOnly(plan.start_date)
  planStart.setHours(0, 0, 0, 0)
  const planEnd = new Date(planStart)
  planEnd.setDate(planStart.getDate() + plan.days_count - 1)
  const slotDate = getSlotCalendarDate(selectedDayIndex, planStart)
  if (slotDate < planStart || slotDate > planEnd) return null
  return Math.round((slotDate.getTime() - planStart.getTime()) / 86_400_000) + 1
}

function getItemsForSelectedDay(plan: MealPlan, selectedDayIndex: number): MealPlanItem[] {
  const dayNumber = getPlanDayNumber(plan, selectedDayIndex)
  if (dayNumber == null) return []
  return plan.items.filter(i => i.day_number === dayNumber)
}

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

function DayView({
  dayItems,
  onAdd,
  onItemDeleted,
  onItemEdited,
  onToggleEaten,
  eatenLogs,
}: {
  dayItems: MealPlanItem[]
  onAdd?: (mealType: MealType) => void
  onItemDeleted?: (itemId: number) => void
  onItemEdited?: (item: MealPlanItem) => void
  onToggleEaten?: (item: MealPlanItem) => void
}) {
  const { t, ta } = useLanguage()
  const MEALS = ta('plannerMeals')
  const totalKcal = dayItems.reduce((s, m) => s + (m.kcal ?? 0), 0)
  const assigned = new Set<number>()

  const slots = MEALS.map((mealLabel, idx) => {
    const mealType = SLOT_MEAL_TYPES[idx] ?? 'other'
    const item = dayItems.find(i => !assigned.has(i.id) && mealNameMatchesSlot(i.meal_name, mealType))
    if (item) assigned.add(item.id)
    return { mealLabel, mealType, item }
  })
  const extraItems = dayItems.filter(i => !assigned.has(i.id))

  const handleDelete = async (itemId: number) => {
    try {
      await mealPlanner.deleteItem(itemId)
      onItemDeleted?.(itemId)
    } catch { /* silent */ }
  }

  const renderItem = (item: MealPlanItem, slotLabel: string) => {
    const isEaten = item.eaten
    return (
      <div key={item.id} className={`bg-white rounded-2xl border-[2px] border-lily/15 p-4 group transition-opacity ${isEaten ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold text-lily/35 uppercase tracking-widest">{slotLabel}</span>
          <div className="flex items-center gap-1">
            {item.kcal != null && <span className="text-xs font-bold text-lily/40 mr-1">{item.kcal} kcal</span>}
            <button
              onClick={() => onToggleEaten?.(item)}
              title={t('plannerMarkEaten')}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isEaten ? 'text-green-500' : 'text-lily/25 hover:text-green-400 active:text-green-400'
              }`}
              aria-label={t('plannerMarkEaten')}
            >
              {isEaten ? <CheckCircle2 size={15} /> : <Circle size={15} />}
            </button>
            <button
              onClick={() => onItemEdited?.(item)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-lily/25 hover:text-lily/60 active:text-lily/60 cursor-pointer"
              aria-label="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-lily/20 hover:text-red-400 active:text-red-400 hover:bg-red-50 cursor-pointer"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        <div>
          <p className={`text-sm font-bold text-lily ${isEaten ? 'line-through' : ''}`}>{item.description ?? item.meal_name}</p>
        </div>
        {(item.protein || item.fat || item.carbs) && (
          <div className="flex gap-3 mt-2">
            {item.protein != null && <span className="text-[10px] font-bold text-lily/30">P: {item.protein}g</span>}
            {item.fat != null && <span className="text-[10px] font-bold text-lily/30">T: {item.fat}g</span>}
            {item.carbs != null && <span className="text-[10px] font-bold text-lily/30">W: {item.carbs}g</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {totalKcal > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-lily/40">{t('plannerTotal')}</span>
          <span className="text-xs font-extrabold text-lily">{totalKcal} kcal</span>
        </div>
      )}

      {slots.map(({ mealLabel, mealType, item }) =>
        item ? renderItem(item, mealLabel) : (
          <div key={mealType} className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-lily/35 uppercase tracking-widest">{mealLabel}</span>
            </div>
            <button
              onClick={() => onAdd?.(mealType)}
              className="flex items-center gap-1.5 text-sm font-bold text-lily/35 hover:text-lily/60 transition-colors cursor-pointer"
            >
              <Plus size={14} /> {t('plannerAddMeal')}
            </button>
          </div>
        )
      )}

      {extraItems.map(item => renderItem(item, item.meal_name))}

      <button
        onClick={() => onAdd?.('other')}
        className="w-full flex items-center justify-center gap-1.5 text-sm font-bold text-lily/35 hover:text-lily/60 transition-colors cursor-pointer py-2"
      >
        <Plus size={14} /> {t('plannerAddMeal')}
      </button>
    </div>
  )
}

function LibraryTab() {
  const { t } = useLanguage()
  const [items, setItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<SavedItem | undefined>()

  const fetchItems = useCallback(async () => {
    try {
      const data = await library.list()
      setItems(data)
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { ;(async () => { await fetchItems() })() }, [fetchItems])

  const handleDelete = async (id: number) => {
    try {
      await library.delete(id)
      setItems(prev => prev.filter(i => i.id !== id))
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={28} className="text-lily animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => { setEditItem(undefined); setShowForm(true) }}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold border-[2px] border-lily/30 text-lily/60 hover:border-lily/50 hover:text-lily transition-colors cursor-pointer"
      >
        <Plus size={16} /> {t('plannerLibraryAdd')}
      </button>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-6 text-center">
          <p className="text-sm font-semibold text-lily/30">{t('plannerSavedEmpty')}</p>
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border-[2px] border-lily/15 p-4 group">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {item.item_type === 'exercise'
                  ? <Dumbbell size={15} className="text-lily/40 shrink-0" />
                  : <Utensils size={15} className="text-lily/40 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-lily truncate">{item.name}</p>
                  <p className="text-[10px] font-bold text-lily/40 uppercase tracking-wider">
                    {item.item_type === 'exercise' ? t('plannerLibraryExercise') : t('plannerLibraryFood')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.kcal != null && <span className="text-xs font-bold text-lily/50 mr-1">{item.kcal} kcal</span>}
                <button
                  onClick={() => { setEditItem(item); setShowForm(true) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-lily/25 hover:text-lily/60 active:text-lily/60 cursor-pointer"
                  aria-label="Edit"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-lily/20 hover:text-red-400 active:text-red-400 hover:bg-red-50 cursor-pointer"
                  aria-label="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            {item.item_type === 'food' && (item.protein || item.fat || item.carbs) && (
              <div className="flex gap-3 mt-2">
                {item.protein != null && <span className="text-[10px] font-bold text-lily/30">P: {item.protein}g</span>}
                {item.fat != null && <span className="text-[10px] font-bold text-lily/30">T: {item.fat}g</span>}
                {item.carbs != null && <span className="text-[10px] font-bold text-lily/30">W: {item.carbs}g</span>}
              </div>
            )}
          </div>
        ))
      )}

      {showForm && (
        <EntryFormSheet
          context="library"
          savedItem={editItem}
          onClose={() => { setShowForm(false); setEditItem(undefined) }}
          onSaved={() => { setShowForm(false); setEditItem(undefined); fetchItems() }}
        />
      )}
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
  return `${fmt.format(startDate)} - ${fmt.format(end)}`
}

export default function PlannerPage() {
  const { t } = useLanguage()
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
  const [dailyData, setDailyData] = useState<DailyData | null>(null)
  const [showEntryForm, setShowEntryForm] = useState(false)
  const [editEntry, setEditEntry] = useState<DailyEntry | undefined>()
  const [pendingMealType, setPendingMealType] = useState<MealType>('other')
  const [addingToPlan, setAddingToPlan] = useState(false)
  const [editingPlanItem, setEditingPlanItem] = useState<MealPlanItem | undefined>()

  const fetchPlans = useCallback(async () => {
    try {
      const data = await mealPlanner.list()
      setPlans(data)
      setActivePlan(prev => {
        if (data.length === 0) return null
        if (prev) {
          const updated = data.find(p => p.id === prev.id)
          if (updated) return updated
        }
        return data[0]
      })
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  const fetchDaily = useCallback(async () => {
    try {
      const data = await tracker.getDaily()
      setDailyData(data)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    ;(async () => {
      await fetchPlans()
      fetchDaily()
      fetch('/api/health').then(r => r.json()).then(d => setAiAvailable(d.ai_available ?? true)).catch(() => {})
    })()
  }, [fetchPlans, fetchDaily])

  const handleGenerate = async (preferences: string) => {
    setGenerating(true)
    setError('')
    try {
      const baseDate = activePlan
        ? getWeekStart(parseDateOnly(activePlan.start_date))
        : getWeekStart(new Date())
      const planStartDate = new Date(baseDate)
      planStartDate.setDate(baseDate.getDate() + selectedDay)
      const daysRemaining = Math.max(1, 7 - selectedDay)

      const plan = await mealPlanner.generate({
        days: daysRemaining,
        meals_per_day: 3,
        preferences,
        start_date: formatDateOnly(planStartDate),
      })
      setActivePlan(plan)
      setPlans(p => [plan, ...p])
    } catch (err) {
      if (err instanceof ApiError && (err.detail === 'AI_UNAVAILABLE' || err.status === 503)) {
        setAiAvailable(false)
        setError('AI service unavailable')
      } else if (err instanceof ApiError && (err.detail === 'AI_QUOTA_EXCEEDED' || err.status === 429)) {
        setError('Daily AI limit reached - try again tomorrow')
      } else {
        setError('Generation failed. Try again.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handlePlanItemDeleted = (itemId: number) => {
    if (!activePlan) return
    setActivePlan(p => p ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p)
    setPlans(ps => ps.map(p =>
      p.id === activePlan.id ? { ...p, items: p.items.filter(i => i.id !== itemId) } : p
    ))
  }

  const handleDeleteDailyEntry = async (id: number, type: 'food' | 'exercise') => {
    try {
      if (type === 'exercise') await tracker.deleteExercise(id)
      else await tracker.deleteLog(id)
      setDailyData(d => d ? { ...d, entries: d.entries.filter(e => e.id !== id) } : d)
    } catch { /* silent */ }
  }

  const openPlanAddForm = async (mealType: MealType) => {
    setEditEntry(undefined)
    setEditingPlanItem(undefined)
    setPendingMealType(mealType)
    setAddingToPlan(true)

    if (!activePlan) {
      try {
        const weekStart = getWeekStart(new Date())
        const plan = await mealPlanner.createPlan({
          start_date: formatDateOnly(weekStart),
          days_count: 7,
        })
        setActivePlan(plan)
        setPlans(p => [plan, ...p])
      } catch {
        return
      }
    }

    setShowEntryForm(true)
  }

  const handleToggleEaten = async (item: MealPlanItem) => {
    try {
      if (item.eaten) {
        await mealPlanner.unmarkEaten(item.id)
      } else {
        await mealPlanner.markEaten(item.id)
      }
      fetchPlans()
      fetchDaily()
    } catch { /* silent */ }
  }

  const openEditPlanItem = (item: MealPlanItem) => {
    setEditingPlanItem(item)
    setPendingMealType(mealTypeFromName(item.meal_name))
    setAddingToPlan(false)
    setShowEntryForm(true)
  }

  const openAddForm = (mealType: MealType) => {
    setEditEntry(undefined)
    setEditingPlanItem(undefined)
    setPendingMealType(mealType)
    setAddingToPlan(false)
    setShowEntryForm(true)
  }

  const selectedDayItems = activePlan ? getItemsForSelectedDay(activePlan, selectedDay) : []
  const selectedPlanDayNumber = activePlan ? getPlanDayNumber(activePlan, selectedDay) : null
  const weekDisplayStart = activePlan
    ? getWeekStart(parseDateOnly(activePlan.start_date))
    : getWeekStart(new Date())

  return (
    <div className="min-h-dvh bg-white">
      <div className="bg-primary px-5 pt-14 pb-6 relative overflow-hidden">
        <img src={NOMNOM_EATING_RAMEN} alt="" aria-hidden className="absolute bottom-0 right-2 w-24 pointer-events-none select-none" />
        <h1 className="text-2xl font-extrabold text-lily mb-4">{t('plannerTitle')}</h1>

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
          <span className="text-sm font-extrabold text-lily">{weekLabel(weekDisplayStart)}</span>
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

        <div className="flex bg-lily/8 rounded-2xl p-1">
          {(['plan', 'saved'] as const).map(tabKey => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-colors cursor-pointer ${
                tab === tabKey ? 'bg-white text-lily shadow-sm' : 'text-lily/40'
              }`}
            >
              {tabKey === 'plan' ? t('plannerTabPlan') : t('plannerTabSaved')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="text-lily animate-spin" />
          </div>
        ) : tab === 'plan' ? (
          <DayView
            dayItems={selectedDayItems}
            onAdd={openPlanAddForm}
            onItemDeleted={handlePlanItemDeleted}
            onItemEdited={openEditPlanItem}
            onToggleEaten={handleToggleEaten}
          />
        ) : (
          <LibraryTab />
        )}

        {/* Today's log */}
        {tab === 'plan' && dailyData && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-extrabold text-lily/60 uppercase tracking-widest">{t('dashboardTodayEntries')}</h2>
              <button
                onClick={() => openAddForm('other')}
                className="w-8 h-8 rounded-xl bg-lily/10 flex items-center justify-center text-lily/60 hover:bg-lily/20 transition-colors cursor-pointer"
                aria-label={t('dashboardAddEntry')}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
              {dailyData.entries.length === 0 ? (
                <p className="text-center text-sm font-semibold text-lily/30 py-6">{t('dashboardNoEntries')}</p>
              ) : (
                dailyData.entries.map(e => (
                  <EntryRow
                    key={`${e.type}-${e.id}`}
                    entry={e}
                    onDelete={id => handleDeleteDailyEntry(id, e.type)}
                    onEdit={entry => { setEditEntry(entry); setPendingMealType('other'); setShowEntryForm(true) }}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <GenerateModal open={showModal} onClose={() => setShowModal(false)} onGenerate={handleGenerate} />

      {showEntryForm && (
        <EntryFormSheet
          entry={editEntry}
          planItem={editingPlanItem}
          defaultMealType={pendingMealType}
          context={editingPlanItem ? 'planner' : addingToPlan ? 'planner' : 'dashboard'}
          planId={addingToPlan && !editingPlanItem ? activePlan?.id : undefined}
          dayNumber={addingToPlan && !editingPlanItem && selectedPlanDayNumber != null ? selectedPlanDayNumber : undefined}
          onClose={() => { setShowEntryForm(false); setEditingPlanItem(undefined) }}
          onSaved={() => {
            setShowEntryForm(false)
            setEditingPlanItem(undefined)
            if (editingPlanItem || addingToPlan) fetchPlans()
            else fetchDaily()
          }}
        />
      )}

      <BottomNav />
    </div>
  )
}
