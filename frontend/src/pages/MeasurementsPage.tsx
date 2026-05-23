import { useState } from 'react'
import { Scale, TrendingDown, TrendingUp, Minus, ChevronDown, ChevronUp, Ruler } from 'lucide-react'
import BottomNav from '../components/BottomNav'
import { useLanguage } from '../context/LanguageContext'
import { NOMNOM_WEIGHING, NOMNOM_MEASURING } from '../assets'

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
  const { t } = useLanguage()
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
        <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('measurementsWeightTrend')}</h2>
        <div className={`flex items-center gap-1 text-xs font-extrabold ${trend > 0 ? 'text-[#3ec9a7]' : trend < 0 ? 'text-red-400' : 'text-lily/40'}`}>
          {trend > 0 ? <TrendingDown size={14} /> : trend < 0 ? <TrendingUp size={14} /> : <Minus size={14} />}
          {Math.abs(trend).toFixed(1)} kg
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={0} x2={W} y1={H * t} y2={H * t} stroke="#7d3ed012" strokeWidth="1" />
        ))}
        <path d={d} fill="none" stroke="#7d3ed0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {vals.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="4" fill="#7d3ed0" />
        ))}
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

type BmiCategory = { labelKey: 'bmiUnderweight' | 'bmiNormal' | 'bmiOverweight' | 'bmiObese'; color: string; range: [number, number]; w: number }
const BMI_SCALE: BmiCategory[] = [
  { labelKey: 'bmiUnderweight', color: '#3ec9a7', range: [0,  20], w: 1   },
  { labelKey: 'bmiNormal',      color: '#7d3ed0', range: [20, 25], w: 1.5 },
  { labelKey: 'bmiOverweight',  color: '#f7a84a', range: [25, 30], w: 1.5 },
  { labelKey: 'bmiObese',       color: '#ef4444', range: [30, 45], w: 1   },
]

function getBmiCategory(bmi: number): BmiCategory {
  return BMI_SCALE.find(c => bmi < c.range[1]) ?? BMI_SCALE[BMI_SCALE.length - 1]
}

function BmiCard({ weightKg }: { weightKg: number }) {
  const { t } = useLanguage()
  const heightM = MOCK_HEIGHT_CM / 100
  const bmi = weightKg / (heightM * heightM)
  const category = getBmiCategory(bmi)

  const totalW = BMI_SCALE.reduce((s, c) => s + c.w, 0)
  const visualStarts = BMI_SCALE.reduce<number[]>((acc, _, i) => {
    acc.push(i === 0 ? 0 : acc[i - 1] + (BMI_SCALE[i - 1].w / totalW) * 100)
    return acc
  }, [])

  const bmiToMarkerPct = (v: number) => {
    for (let i = 0; i < BMI_SCALE.length; i++) {
      const c = BMI_SCALE[i]
      if (v <= c.range[1] || i === BMI_SCALE.length - 1) {
        const segEnd = visualStarts[i] + (c.w / totalW) * 100
        const t = Math.min(Math.max((v - c.range[0]) / (c.range[1] - c.range[0]), 0), 1)
        return visualStarts[i] + t * (segEnd - visualStarts[i])
      }
    }
    return 98
  }
  const markerPct = Math.min(Math.max(bmiToMarkerPct(bmi), 2), 98)

  return (
    <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Ruler size={14} className="text-lily/50" />
        <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('measurementsBmi')}</h2>
        <span className="text-xs font-bold text-lily/30 ml-auto">{MOCK_HEIGHT_CM} cm</span>
      </div>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-4xl font-extrabold leading-none" style={{ color: category.color }}>
          {bmi.toFixed(1)}
        </span>
        <span className="text-sm font-extrabold pb-0.5" style={{ color: category.color }}>
          {t(category.labelKey)}
        </span>
      </div>

      <div className="relative mb-2">
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          {BMI_SCALE.map(c => (
            <div key={c.labelKey} className="h-full" style={{ width: `${(c.w / totalW) * 100}%`, backgroundColor: c.color + '55' }} />
          ))}
        </div>
        <div className="absolute inset-0 flex h-3 rounded-full overflow-hidden gap-px pointer-events-none">
          {BMI_SCALE.map(c => (
            <div
              key={c.labelKey}
              className="h-full transition-opacity"
              style={{ width: `${(c.w / totalW) * 100}%`, backgroundColor: c.color, opacity: c.labelKey === category.labelKey ? 1 : 0 }}
            />
          ))}
        </div>
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-[3px] shadow-md transition-all duration-500"
          style={{ left: `calc(${markerPct}% - 8px)`, borderColor: category.color }}
        />
      </div>
      <div className="relative h-4">
        {BMI_SCALE.slice(1).map((c, i) => (
          <span
            key={c.labelKey}
            className="absolute text-[9px] font-bold -translate-x-1/2"
            style={{ left: `${visualStarts[i + 1]}%`, color: c.color + '99' }}
          >
            {c.range[0]}
          </span>
        ))}
      </div>
    </div>
  )
}

function BodyMetricsForm() {
  const { t } = useLanguage()
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
        <div className="flex items-center gap-2">
          <img src={NOMNOM_MEASURING} alt="" aria-hidden className="w-8 h-8 object-contain pointer-events-none select-none" />
          <span className="text-sm font-extrabold text-lily">{t('measurementsBodyComposition')}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-lily/50" /> : <ChevronDown size={16} className="text-lily/50" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-lily/10">
          <p className="text-xs font-semibold text-lily/35 pt-1">{t('measurementsBodyCompositionHint')}</p>
          {[
            { label: t('measurementsBodyFat'), unit: '%', val: fat, set: setFat },
            { label: t('measurementsWater'),   unit: '%', val: water, set: setWater },
            { label: t('measurementsMuscle'),  unit: '%', val: muscle, set: setMuscle },
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
            {t('measurementsSaveBody')}
          </button>
        </div>
      )}
    </div>
  )
}

export default function MeasurementsPage() {
  const { t } = useLanguage()
  const [weight, setWeight] = useState('75.5')

  return (
    <div className="min-h-dvh bg-white">
      {/* ── Header ── */}
      <div className="bg-primary px-5 pt-14 pb-8 relative overflow-hidden">
        <h1 className="text-2xl font-extrabold text-lily mb-1">{t('measurementsTitle')}</h1>
        <p className="text-lily/60 text-sm font-semibold">{t('measurementsSubtitle')}</p>
        <img src={NOMNOM_WEIGHING} alt="" aria-hidden className="absolute bottom-0 right-2 w-24 pointer-events-none select-none" />
      </div>

      <div className="px-4 pb-28 space-y-4 mt-4 relative z-10">
        {/* ── Quick weight entry ── */}
        <div className="bg-ivory rounded-2xl shadow-md border-[3px] border-lily/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={16} className="text-lily/60" />
            <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest">{t('measurementsWeightToday')}</h2>
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
              {t('measurementsSave')}
            </button>
          </div>
          <p className="text-xs font-bold text-lily/40 text-center mt-3">
            {t('measurementsLastEntry')
              .replace('{kg}', String(weightHistory[1].kg))
              .replace('{date}', weightHistory[1].date)}
            {' · '}
            {(() => {
              const diff = parseFloat(weight || '0') - weightHistory[1].kg
              const isDown = diff < 0
              return (
                <span className={isDown ? 'text-[#3ec9a7]' : 'text-red-400'}>
                  {isDown ? '↓' : '↑'} {Math.abs(diff).toFixed(1)} kg
                </span>
              )
            })()}
          </p>
        </div>

        <WeightTrend />
        <BmiCard weightKg={parseFloat(weight) || weightHistory[0].kg} />
        <BodyMetricsForm />

        {/* ── History list ── */}
        <div>
          <h2 className="text-xs font-extrabold text-lily/50 uppercase tracking-widest mb-3 px-1">{t('measurementsHistory')}</h2>
          <div className="bg-white rounded-2xl border-[2px] border-lily/15 px-4">
            {weightHistory.map((entry, i) => {
              const prev = weightHistory[i + 1]
              const diff = prev ? entry.kg - prev.kg : null
              return (
                <div key={entry.date} className="flex items-center justify-between py-3 border-b border-lily/10 last:border-0">
                  <span className="text-sm font-bold text-lily/60">{entry.date}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-extrabold w-14 text-right ${diff === null ? '' : diff < 0 ? 'text-[#3ec9a7]' : 'text-red-400'}`}>
                      {diff !== null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} kg` : ''}
                    </span>
                    <span className="text-sm font-extrabold text-lily w-16 text-right">{entry.kg} kg</span>
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
