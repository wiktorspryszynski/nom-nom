import { useState } from 'react'
import { Dumbbell, Utensils } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { tracker, type DailyEntry } from '../lib/api'

export default function EntryFormSheet({
  entry,
  onClose,
  onSaved,
}: {
  entry?: DailyEntry
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const isEdit = Boolean(entry)

  const [type, setType] = useState<'food' | 'exercise'>(entry?.type ?? 'food')
  const [name, setName] = useState(entry?.name ?? '')
  const [kcal, setKcal] = useState(entry ? String(Math.abs(entry.kcal)) : '')
  const [protein, setProtein] = useState(entry?.protein != null ? String(entry.protein) : '')
  const [fat, setFat] = useState(entry?.fat != null ? String(entry.fat) : '')
  const [carbs, setCarbs] = useState(entry?.carbs != null ? String(entry.carbs) : '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim() || !kcal) return
    setSaving(true)
    try {
      if (isEdit && entry) {
        await tracker.updateLog(entry.id, {
          description: name.trim(),
          kcal: Number(kcal),
          protein: protein ? Number(protein) : 0,
          fat: fat ? Number(fat) : 0,
          carbs: carbs ? Number(carbs) : 0,
        })
      } else if (type === 'exercise') {
        await tracker.saveLog({
          description: name.trim(),
          kcal: Number(kcal),
          source_type: 'manual',
          activity_type: name.trim(),
          kcal_burned: Number(kcal),
        })
      } else {
        await tracker.saveLog({
          description: name.trim(),
          kcal: Number(kcal),
          protein: protein ? Number(protein) : 0,
          fat: fat ? Number(fat) : 0,
          carbs: carbs ? Number(carbs) : 0,
          source_type: 'manual',
        })
      }
      onSaved()
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }

  const macroFields = [
    { label: t('photoLogProtein'), value: protein, set: setProtein },
    { label: t('photoLogFat'), value: fat, set: setFat },
    { label: t('photoLogCarbs'), value: carbs, set: setCarbs },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold text-lily">
          {isEdit ? t('entryFormEditTitle') : t('dashboardAddEntry')}
        </h2>

        {!isEdit && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('food')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold border-[2px] transition-colors cursor-pointer ${
                type === 'food' ? 'bg-primary border-lily text-lily' : 'bg-white border-lily/20 text-lily/40'
              }`}
            >
              <Utensils size={14} /> {t('dashboardMeal')}
            </button>
            <button
              type="button"
              onClick={() => setType('exercise')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold border-[2px] transition-colors cursor-pointer ${
                type === 'exercise' ? 'bg-primary border-lily text-lily' : 'bg-white border-lily/20 text-lily/40'
              }`}
            >
              <Dumbbell size={14} /> {t('dashboardExercise')}
            </button>
          </div>
        )}

        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('entryFormNamePlaceholder')}
          className="w-full bg-ivory border-[2px] border-lily/30 text-lily px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-lily/60 transition-colors"
        />

        <div className="relative flex items-center">
          <input
            type="number"
            value={kcal}
            onChange={e => setKcal(e.target.value)}
            placeholder={t('photoLogCalories')}
            min={0}
            className="w-full bg-ivory border-[2px] border-lily/30 text-lily px-4 py-3 pr-16 rounded-xl text-sm font-semibold outline-none focus:border-lily/60 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="absolute right-4 text-lily/40 font-bold text-xs pointer-events-none select-none">kcal</span>
        </div>

        {type === 'food' && (
          <div className="grid grid-cols-3 gap-2">
            {macroFields.map(({ label, value, set }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs font-bold text-lily/50">{label}</span>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={e => set(e.target.value)}
                    min={0}
                    className="w-full bg-ivory border-[2px] border-lily/20 text-lily px-3 py-2 pr-6 rounded-lg text-sm font-semibold outline-none focus:border-lily/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-lily/30 font-bold text-[10px] pointer-events-none select-none">g</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-[2px] border-lily/30 text-lily/60 rounded-2xl py-3 text-sm font-extrabold cursor-pointer hover:border-lily/50 transition-colors"
          >
            {t('plannerCancel')}
          </button>
          <button
            type="button"
            disabled={!name.trim() || !kcal || saving}
            onClick={handleSave}
            className="flex-1 bg-lily text-primary rounded-2xl py-3 text-sm font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            {saving ? '…' : t('photoLogSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
