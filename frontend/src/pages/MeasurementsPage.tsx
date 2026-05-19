import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Ruler } from 'lucide-react'
import BottomNav from '../components/BottomNav'

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_HEIGHT_CM = 178

const weightHistory = [
  { date: '19.05', kg: 75.5 },
  { date: '17.05', kg: 75.8 },
  { date: '15.05', kg: 76.1 },
  { date: '12.05', kg: 76.4 },
  { date: '10.05', kg: 76.0 },
  { date: '07.05', kg: 76.8 },
  { date: '05.05', kg: 77.2 },
]

const latestBodyMetrics = { bodyFat: 22.1, water: 54.8, muscle: 41.3 }
// ─────────────────────────────────────────────────────────────────────────────

function WeightTrend() {
  const vals = weightHistory.map(e => e.kg)
  const min = Math.min(...vals) - 0.5
  const max = Math.max(...vals) + 0.5
  const W = 280
  const H = 80
  const toX = (i: number) => (i / (vals.length - 1)) * W
  const toY = (v: number) => H - ((v - min) / (max - min)) * H

  const d = vals
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`)
    .join(' ')

  const trend = vals[0] - vals[vals.length - 1]

  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">Trend wagi</h2>
        <div className={`flex items-center gap-1 text-xs font-extrabold ${trend > 0 ? 'text-[#3ec9a7]' : trend < 0 ? 'text-red-400' : 'text-lily/40'}`}>
          {trend > 0 ? <TrendingDown size={14} /> : trend < 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
          {Math.abs(trend).toFixed(1)} kg
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        {/* Grid lines */}
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={0} x2={W} y1={H * t} y2={H * t} stroke="#7d3ed012" strokeWidth="1" />
        ))}
        {/* Line */}
        <path d={d} fill="none" stroke="#7d3ed0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {vals.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill="#7d3ed0" />
        ))}
        {/* First & last labels */}
        <text x={toX(0)} y={toY(vals[0]) - 8} textAnchor="middle" fontSize="10" fill="#7d3ed0" fontWeight="700">{vals[0]}</text>
        <text x={toX(vals.length - 1)} y={toY(vals[vals.length - 1]) - 8} textAnchor="middle" fontSize="10" fill="#7d3ed099" fontWeight="700">{vals[vals.length - 1]}</text>
      </svg>
      <div className="flex justify-between mt-2">
        {weightHistory.map(e => (
          <span key={e.date} className="text-[9px] font-bold text-lily/30">{e.date}</span>
        ))}
      </div>
    </div>
  )
}

type BmiCategory = { label: string; color: string; range: [number, number] }
const BMI_SCALE: BmiCategory[] = [
  { label: 'Niedowaga',  color: '#3ec9a7', range: [0,    18.5] },
  { label: 'Prawidłowa', color: '#7d3ed0', range: [18.5, 25]   },
  { label: 'Nadwaga',    color: '#f7a84a', range: [25,   30]   },
  { label: 'Otyłość',    color: '#ef4444', range: [30,   45]   },
]

function getBmiCategory(bmi: number): BmiCategory {
  return BMI_SCALE.find(c => bmi < c.range[1]) ?? BMI_SCALE[BMI_SCALE.length - 1]
}

function BmiCard({ weightKg }: { weightKg: number }) {
  const heightM = MOCK_HEIGHT_CM / 100
  const bmi = weightKg / (heightM * heightM)
  const category = getBmiCategory(bmi)

  // Position marker on a 0-45 scale mapped to 0-100%
  const MIN = 14, MAX = 42
  const markerPct = Math.min(Math.max(((bmi - MIN) / (MAX - MIN)) * 100, 2), 98)

  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Ruler size={14} className="text-lily/50" />
        <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">BMI</h2>
        <span className="text-xs font-bold text-lily/30 ml-auto">{MOCK_HEIGHT_CM} cm</span>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-4xl font-extrabold leading-none" style={{ color: category.color }}>
          {bmi.toFixed(1)}
        </span>
        <span className="text-sm font-extrabold pb-0.5" style={{ color: category.color }}>
          {category.label}
        </span>
      </div>

      {/* Scale bar */}
      <div className="relative mb-2">
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {BMI_SCALE.map(c => (
            <div key={c.label} className="flex-1 h-full" style={{ backgroundColor: c.color + '55' }} />
          ))}
        </div>
        {/* Active segment overlay */}
        <div className="absolute inset-0 flex h-3 rounded-full overflow-hidden gap-px pointer-events-none">
          {BMI_SCALE.map(c => (
            <div
              key={c.label}
              className="flex-1 h-full transition-opacity"
              style={{ backgroundColor: c.color, opacity: c.label === category.label ? 1 : 0 }}
            />
          ))}
        </div>
        {/* Marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-[3px] shadow-md transition-all duration-500"
          style={{ left: `calc(${markerPct}% - 8px)`, borderColor: category.color }}
        />
      </div>
      <div className="flex justify-between">
        {BMI_SCALE.map(c => (
          <span key={c.label} className="text-[9px] font-bold" style={{ color: c.color + '99' }}>
            {c.range[0] || ''}
          </span>
        ))}
        <span className="text-[9px] font-bold text-lily/20">30+</span>
      </div>
    </div>
  )
}

function BodyMetricsForm() {
  const [open, setOpen] = useState(false)
  const [fat, setFat] = useState(String(latestBodyMetrics.bodyFat))
  const [water, setWater] = useState(String(latestBodyMetrics.water))
  const [muscle, setMuscle] = useState(String(latestBodyMetrics.muscle))

  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-4 cursor-pointer"
      >
        <span className="text-sm font-extrabold text-lily">Skład ciała</span>
        {open ? <ChevronUp size={16} className="text-lily/50" /> : <ChevronDown size={16} className="text-lily/50" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-lily/10">
          {[
            { label: 'Tkanka tłuszczowa', unit: '%', val: fat, set: setFat },
            { label: 'Woda', unit: '%', val: water, set: setWater },
            { label: 'Masa mięśniowa', unit: '%', val: muscle, set: setMuscle },
          ].map(({ label, unit, val, set }) => (
            <div key={label} className="flex items-center gap-3">
              <label className="flex-1 text-sm font-bold text-lily/70">{label}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={val}
                  onChange={e => set(e.target.value)}
                  step="0.1"
                  style={{ borderRadius: '10px 4px 10px 4px / 4px 10px 4px 10px' }}
                  className="w-20 text-center bg-ivory border-[2px] border-lily/30 text-lily font-extrabold
                             py-2 text-sm outline-none focus:border-lily/60 transition-colors"
                />
                <span className="text-xs font-bold text-lily/40 w-4">{unit}</span>
              </div>
            </div>
          ))}
          <button className="btn-fill w-full border-[3px] border-lily text-lily rounded-full py-3 text-sm font-extrabold cursor-pointer mt-1">
            Zapisz skład ciała
          </button>
        </div>
      )}
    </div>
  )
}

export default function MeasurementsPage() {
  const [weight, setWeight] = useState('75.5')

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Header ── */}
      <div className="bg-primary px-5 pt-14 pb-8">
        <h1 className="text-2xl font-extrabold text-lily mb-1">Pomiary</h1>
        <p className="text-lily/60 text-sm font-semibold">Śledź postępy w czasie</p>
      </div>

      <div className="px-4 pb-28 space-y-4 -mt-4">
        {/* ── Quick weight entry ── */}
        <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={16} className="text-lily/60" />
            <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">Waga dzisiaj</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                step="0.1"
                style={{ borderRadius: '12px 4px 14px 6px / 4px 12px 6px 14px' }}
                className="w-full text-center bg-white border-[3px] border-lily/30 text-lily
                           font-extrabold py-3 text-2xl outline-none focus:border-lily/60 transition-colors"
              />
              <span className="text-lg font-extrabold text-lily/50">kg</span>
            </div>
            <button className="bg-lily text-primary rounded-2xl px-5 py-3 text-sm font-extrabold
                               active:scale-95 transition-transform cursor-pointer shrink-0">
              Zapisz
            </button>
          </div>
          {/* Last entry context */}
          <p className="text-xs font-bold text-lily/40 text-center mt-3">
            Ostatnio: {weightHistory[1].kg} kg ({weightHistory[1].date})
            {' · '}
            <span className="text-[#3ec9a7]">↓ {(weightHistory[1].kg - parseFloat(weight || '0')).toFixed(1)} kg</span>
          </p>
        </div>

        {/* ── Trend chart ── */}
        <WeightTrend />

        {/* ── BMI ── */}
        <BmiCard weightKg={parseFloat(weight) || weightHistory[0].kg} />

        {/* ── Body metrics ── */}
        <BodyMetricsForm />

        {/* ── History list ── */}
        <div>
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-3 px-1">Historia</h2>
          <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
            {weightHistory.map((entry, i) => {
              const prev = weightHistory[i + 1]
              const diff = prev ? entry.kg - prev.kg : null
              return (
                <div key={entry.date} className="flex items-center justify-between py-3 border-b border-lily/10 last:border-0">
                  <span className="text-sm font-bold text-lily/60">{entry.date}</span>
                  <div className="flex items-center gap-3">
                    {diff !== null && (
                      <span className={`text-xs font-extrabold ${diff < 0 ? 'text-[#3ec9a7]' : 'text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                      </span>
                    )}
                    <span className="text-sm font-extrabold text-lily">{entry.kg} kg</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
