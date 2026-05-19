import { useState } from 'react'
import { Sparkles, Plus, ChevronLeft, ChevronRight, Utensils, Dumbbell, X } from 'lucide-react'
import BottomNav from '../components/BottomNav'

// ─── Mock data ────────────────────────────────────────────────────────────────
const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const MEALS = ['Śniadanie', 'Obiad', 'Kolacja', 'Przekąska']

type MealEntry = { name: string; kcal: number }
type DayPlan = Partial<Record<string, MealEntry>>

const mockPlan: DayPlan[] = [
  { Śniadanie: { name: 'Owsianka z bananem', kcal: 380 }, Obiad: { name: 'Kurczak z ryżem', kcal: 620 }, Kolacja: { name: 'Sałatka', kcal: 280 } },
  { Śniadanie: { name: 'Jajecznica', kcal: 340 }, Obiad: { name: 'Makaron bolognese', kcal: 580 } },
  { Śniadanie: { name: 'Tost z awokado', kcal: 410 }, Obiad: { name: 'Zupa pomidorowa', kcal: 320 }, Kolacja: { name: 'Ryba z warzywami', kcal: 450 } },
  {},
  { Śniadanie: { name: 'Naleśniki', kcal: 490 }, Obiad: { name: 'Stek z ziemniakami', kcal: 720 } },
  {},
  { Śniadanie: { name: 'Granola z jogurtem', kcal: 360 }, Obiad: { name: 'Pizza domowa', kcal: 680 } },
]

const savedMeals = [
  { id: 1, type: 'food',     name: 'Owsianka proteinowa',   kcal: 420, tags: ['śniadanie', 'zdrowe'] },
  { id: 2, type: 'food',     name: 'Kurczak teriyaki',      kcal: 590, tags: ['obiad', 'białko'] },
  { id: 3, type: 'exercise', name: 'Trening siłowy A',      kcal: 320, tags: ['siłownia'] },
  { id: 4, type: 'food',     name: 'Smoothie owocowe',      kcal: 210, tags: ['przekąska'] },
  { id: 5, type: 'exercise', name: 'Yoga poranna 30 min',   kcal: 120, tags: ['rozciąganie'] },
]
// ─────────────────────────────────────────────────────────────────────────────

type Tab = 'plan' | 'saved'

function DaySelector({ selected, onSelect }: { selected: number; onSelect: (i: number) => void }) {
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

function DayView({ dayIndex }: { dayIndex: number }) {
  const plan = mockPlan[dayIndex]
  const totalKcal = Object.values(plan).reduce((s, m) => s + (m?.kcal ?? 0), 0)

  return (
    <div className="space-y-3">
      {totalKcal > 0 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-lily/40">Łącznie</span>
          <span className="text-xs font-extrabold text-lily">{totalKcal} kcal</span>
        </div>
      )}
      {MEALS.map(meal => {
        const entry = plan[meal]
        return (
          <div key={meal} className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold text-lily/35 uppercase tracking-widest">{meal}</span>
              {entry && <span className="text-xs font-bold text-lily/40">{entry.kcal} kcal</span>}
            </div>
            {entry ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-lily">{entry.name}</span>
                <button className="text-lily/25 hover:text-lily/60 transition-colors cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button className="flex items-center gap-1.5 text-sm font-bold text-lily/35 hover:text-lily/60 transition-colors cursor-pointer">
                <Plus size={14} /> Dodaj posiłek
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SavedList() {
  const [filter, setFilter] = useState<'all' | 'food' | 'exercise'>('all')
  const filtered = savedMeals.filter(m => filter === 'all' || m.type === filter)
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['all', 'food', 'exercise'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border-[2px] transition-colors cursor-pointer ${
              filter === f ? 'bg-lily text-primary border-lily' : 'text-lily/50 border-lily/20'
            }`}
          >
            {f === 'all' && 'Wszystkie'}
            {f === 'food' && <><Utensils size={11} /> Posiłki</>}
            {f === 'exercise' && <><Dumbbell size={11} /> Ćwiczenia</>}
          </button>
        ))}
      </div>

      <button className="w-full flex items-center justify-center gap-2 border-[3px] border-dashed border-lily/30
                         text-lily/50 rounded-2xl py-4 text-sm font-extrabold hover:border-lily/50 hover:text-lily/70
                         transition-colors cursor-pointer">
        <Plus size={16} /> Dodaj własny wpis
      </button>

      {filtered.map(m => (
        <div key={m.id} className="bg-white rounded-2xl border-[2px] border-lily/15 p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            m.type === 'exercise' ? 'bg-[#3ec9a7]/15' : 'bg-primary/30'
          }`}>
            {m.type === 'exercise'
              ? <Dumbbell size={16} className="text-[#3ec9a7]" strokeWidth={2} />
              : <Utensils size={16} className="text-lily" strokeWidth={2} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-lily">{m.name}</p>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {m.tags.map(t => (
                <span key={t} className="text-[10px] font-bold text-lily/40 bg-lily/8 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>
          <span className="text-xs font-bold text-lily/40 shrink-0">{m.kcal} kcal</span>
        </div>
      ))}
    </div>
  )
}

export default function PlannerPage() {
  const [tab, setTab] = useState<Tab>('plan')
  const [selectedDay, setSelectedDay] = useState(() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Header ── */}
      <div className="bg-primary px-5 pt-14 pb-6">
        <h1 className="text-2xl font-extrabold text-lily mb-4">Jadłospis</h1>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-3">
          <button className="p-1 text-lily/50 hover:text-lily cursor-pointer"><ChevronLeft size={20} /></button>
          <span className="text-sm font-extrabold text-lily">19 – 25 maja 2025</span>
          <button className="p-1 text-lily/50 hover:text-lily cursor-pointer"><ChevronRight size={20} /></button>
        </div>

        <DaySelector selected={selectedDay} onSelect={setSelectedDay} />
      </div>

      <div className="px-4 pb-28 space-y-4 mt-4">
        {/* ── AI generate CTA ── */}
        <button className="w-full flex items-center justify-center gap-2 bg-lily text-primary rounded-2xl py-4
                           text-base font-extrabold shadow-md active:scale-[0.98] transition-transform cursor-pointer">
          <Sparkles size={18} strokeWidth={2.5} />
          Wygeneruj plan tygodnia (AI)
        </button>

        {/* ── Tab switcher ── */}
        <div className="flex bg-lily/8 rounded-2xl p-1">
          {(['plan', 'saved'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-extrabold transition-colors cursor-pointer ${
                tab === t ? 'bg-white text-lily shadow-sm' : 'text-lily/40'
              }`}
            >
              {t === 'plan' ? `Plan — ${DAYS[selectedDay]}` : 'Zapisane'}
            </button>
          ))}
        </div>

        {tab === 'plan' ? <DayView dayIndex={selectedDay} /> : <SavedList />}
      </div>

      <BottomNav />
    </div>
  )
}
