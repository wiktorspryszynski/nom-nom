import { useEffect, useRef, useState } from 'react'
import { Bookmark, Dumbbell, Loader2, Sparkles, Utensils } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { library, mealPlanner, tracker, type DailyEntry, type MealPlanItem, type SavedItem } from '../lib/api'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other'

export default function EntryFormSheet({
  entry,
  savedItem,
  planItem,
  defaultMealType,
  context = 'dashboard',
  planId,
  dayNumber,
  onClose,
  onSaved,
}: {
  entry?: DailyEntry
  savedItem?: SavedItem
  planItem?: MealPlanItem
  defaultMealType?: MealType
  context?: 'dashboard' | 'planner' | 'library'
  planId?: number
  dayNumber?: number
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const isEdit = Boolean(entry)
  const isLibraryEdit = Boolean(savedItem)
  const isPlanItemEdit = Boolean(planItem)
  const isLibraryContext = context === 'library'

  const [type, setType] = useState<'food' | 'exercise'>(
    savedItem?.item_type === 'exercise' ? 'exercise' : entry?.type ?? 'food'
  )
  const [mealType, setMealType] = useState<MealType>(defaultMealType ?? 'other')
  const [name, setName] = useState(
    planItem ? (planItem.description ?? planItem.meal_name) : savedItem?.name ?? entry?.name ?? ''
  )
  const [kcal, setKcal] = useState(
    planItem ? (planItem.kcal != null ? String(planItem.kcal) : '')
    : savedItem ? (savedItem.kcal != null ? String(savedItem.kcal) : '') : entry ? String(Math.abs(entry.kcal)) : ''
  )
  const [protein, setProtein] = useState(
    planItem?.protein != null ? String(planItem.protein)
    : savedItem?.protein != null ? String(savedItem.protein) : entry?.protein != null ? String(entry.protein) : ''
  )
  const [fat, setFat] = useState(
    planItem?.fat != null ? String(planItem.fat)
    : savedItem?.fat != null ? String(savedItem.fat) : entry?.fat != null ? String(entry.fat) : ''
  )
  const [carbs, setCarbs] = useState(
    planItem?.carbs != null ? String(planItem.carbs)
    : savedItem?.carbs != null ? String(savedItem.carbs) : entry?.carbs != null ? String(entry.carbs) : ''
  )
  const [saveToLibrary, setSaveToLibrary] = useState(true)
  const [saving, setSaving] = useState(false)
  const [guessing, setGuessing] = useState(false)
  const [guessError, setGuessError] = useState('')

  // Library search
  const [libraryItems, setLibraryItems] = useState<SavedItem[]>([])
  const [suggestions, setSuggestions] = useState<SavedItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const libraryFetched = useRef(false)

  useEffect(() => {
    if (libraryFetched.current) return
    libraryFetched.current = true
    library.list().then(setLibraryItems).catch(() => {})
  }, [])

  const handleNameChange = (val: string) => {
    setName(val)
    if (guessError) setGuessError('')
    if (val.length >= 2) {
      const q = val.toLowerCase()
      const matches = libraryItems.filter(i =>
        i.name.toLowerCase().includes(q) && i.item_type === (type === 'exercise' ? 'exercise' : 'food')
      )
      setSuggestions(matches.slice(0, 5))
      setShowSuggestions(matches.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  const applySuggestion = (item: SavedItem) => {
    setName(item.name)
    if (item.kcal != null) setKcal(String(item.kcal))
    if (item.protein != null) setProtein(String(item.protein))
    if (item.fat != null) setFat(String(item.fat))
    if (item.carbs != null) setCarbs(String(item.carbs))
    setSaveToLibrary(false)
    setShowSuggestions(false)
  }

  const handleAiGuess = async () => {
    if (!name.trim()) return
    setGuessing(true)
    setGuessError('')
    try {
      const parsed = await tracker.logText(name.trim())
      setKcal(String(parsed.kcal))
      if (parsed.protein != null) setProtein(String(parsed.protein))
      if (parsed.fat != null) setFat(String(parsed.fat))
      if (parsed.carbs != null) setCarbs(String(parsed.carbs))
    } catch {
      setGuessError(t('entryFormAiGuessError'))
    } finally {
      setGuessing(false)
    }
  }

  const sanitizeNumeric = (val: string) =>
    val.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')

  const blockInvalidNumericKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
  }

  const mealTypeLabel = (mt: MealType) => {
    const map: Record<MealType, string> = {
      breakfast: t('entryFormMealTypeBreakfast'),
      lunch: t('entryFormMealTypeLunch'),
      dinner: t('entryFormMealTypeDinner'),
      snack: t('entryFormMealTypeSnack'),
      other: t('entryFormMealTypeOther'),
    }
    return map[mt]
  }

  const handleSave = async () => {
    if (!name.trim() || (!kcal && !isLibraryContext && !isLibraryEdit && !isPlanItemEdit)) return
    setSaving(true)
    try {
      if (isPlanItemEdit && planItem) {
        await mealPlanner.updateItem(planItem.id, {
          description: name.trim(),
          kcal: kcal ? Number(kcal) : undefined,
          protein: protein ? Number(protein) : undefined,
          fat: fat ? Number(fat) : undefined,
          carbs: carbs ? Number(carbs) : undefined,
        })
      } else if (isLibraryEdit && savedItem) {
        await library.update(savedItem.id, {
          name: name.trim(),
          item_type: type,
          kcal: kcal ? Number(kcal) : undefined,
          protein: protein ? Number(protein) : undefined,
          fat: fat ? Number(fat) : undefined,
          carbs: carbs ? Number(carbs) : undefined,
          duration_min: savedItem.duration_min,
        })
      } else if (isLibraryContext) {
        await library.create({
          name: name.trim(),
          item_type: type,
          kcal: kcal ? Number(kcal) : undefined,
          protein: protein ? Number(protein) : undefined,
          fat: fat ? Number(fat) : undefined,
          carbs: carbs ? Number(carbs) : undefined,
        })
      } else if (isEdit && entry) {
        await tracker.updateLog(entry.id, {
          description: name.trim(),
          kcal: Number(kcal),
          protein: protein ? Number(protein) : 0,
          fat: fat ? Number(fat) : 0,
          carbs: carbs ? Number(carbs) : 0,
        })
      } else if (context === 'planner' && planId != null && dayNumber != null) {
        await mealPlanner.addItem(planId, {
          day_number: dayNumber,
          meal_name: mealType,
          description: name.trim(),
          kcal: kcal ? Number(kcal) : undefined,
          protein: protein ? Number(protein) : undefined,
          fat: fat ? Number(fat) : undefined,
          carbs: carbs ? Number(carbs) : undefined,
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
        if (saveToLibrary && !isLibraryContext) {
          library.create({
            name: name.trim(),
            item_type: 'food',
            kcal: Number(kcal),
            protein: protein ? Number(protein) : undefined,
            fat: fat ? Number(fat) : undefined,
            carbs: carbs ? Number(carbs) : undefined,
          }).catch(() => {})
        }
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

  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other']

  const canSave = isLibraryContext || isLibraryEdit || isPlanItemEdit
    ? Boolean(name.trim())
    : Boolean(name.trim() && kcal)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl w-full max-w-lg p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-extrabold text-lily">
          {isLibraryEdit || isEdit || isPlanItemEdit
            ? t('entryFormEditTitle')
            : isLibraryContext ? t('plannerLibraryAdd')
            : context === 'planner' ? t('plannerSaveItem')
            : t('dashboardAddEntry')}
        </h2>

        {!isEdit && !isLibraryEdit && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setType('food'); setShowSuggestions(false) }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold border-[2px] transition-colors cursor-pointer ${
                type === 'food' ? 'bg-primary border-lily text-lily' : 'bg-white border-lily/20 text-lily/40'
              }`}
            >
              <Utensils size={14} /> {t('dashboardMeal')}
            </button>
            <button
              type="button"
              onClick={() => { setType('exercise'); setShowSuggestions(false) }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-extrabold border-[2px] transition-colors cursor-pointer ${
                type === 'exercise' ? 'bg-primary border-lily text-lily' : 'bg-white border-lily/20 text-lily/40'
              }`}
            >
              <Dumbbell size={14} /> {t('dashboardExercise')}
            </button>
          </div>
        )}

        {/* Meal type selector — food only, not in edit/library mode */}
        {!isEdit && !isLibraryEdit && !isLibraryContext && type === 'food' && (
          <div>
            <p className="text-xs font-bold text-lily/50 mb-1.5">{t('entryFormMealType')}</p>
            <div className="flex gap-1.5 flex-wrap">
              {mealTypes.map(mt => (
                <button
                  key={mt}
                  type="button"
                  onClick={() => setMealType(mt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold border-[2px] transition-colors cursor-pointer ${
                    mealType === mt
                      ? 'bg-primary border-lily text-lily'
                      : 'bg-white border-lily/15 text-lily/40 hover:border-lily/30'
                  }`}
                >
                  {mealTypeLabel(mt)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Name input with library suggestions */}
        <div className="relative">
          <input
            type="text"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={t('entryFormNamePlaceholder')}
            className={`w-full bg-ivory border-[2px] border-lily/30 text-lily px-4 py-3 rounded-xl text-sm font-semibold outline-none focus:border-lily/60 transition-colors ${!isLibraryContext && !isEdit && !isLibraryEdit ? 'pr-11' : ''}`}
          />
          {!isLibraryContext && !isEdit && !isLibraryEdit && (
            <button
              type="button"
              onClick={() => setSaveToLibrary(v => !v)}
              title={t('entryFormSaveToLibrary')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer ${
                saveToLibrary ? 'text-lily' : 'text-lily/25 hover:text-lily/50'
              }`}
            >
              <Bookmark size={15} fill={saveToLibrary ? 'currentColor' : 'none'} />
            </button>
          )}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border-[2px] border-lily/20 shadow-lg z-10 overflow-hidden">
              {suggestions.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={() => applySuggestion(item)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-lily/5 transition-colors text-left cursor-pointer"
                >
                  <span className="text-sm font-semibold text-lily">{item.name}</span>
                  {item.kcal != null && (
                    <span className="text-xs font-bold text-lily/40 shrink-0 ml-2">{item.kcal} kcal</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI guess + kcal row */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={kcal}
              onChange={e => setKcal(sanitizeNumeric(e.target.value))}
              onKeyDown={blockInvalidNumericKey}
              placeholder={t('photoLogCalories')}
              min={0}
              className="w-full bg-ivory border-[2px] border-lily/30 text-lily px-4 py-3 pr-16 rounded-xl text-sm font-semibold outline-none focus:border-lily/60 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lily/40 font-bold text-xs pointer-events-none select-none">kcal</span>
          </div>
          <button
            type="button"
            onClick={handleAiGuess}
            disabled={!name.trim() || guessing}
            title={t('entryFormAiGuess')}
            className="w-11 h-11 shrink-0 bg-lily/10 border-[2px] border-lily/20 rounded-xl flex items-center justify-center text-lily/60 hover:bg-lily/20 hover:border-lily/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {guessing
              ? <Loader2 size={15} className="animate-spin" />
              : <Sparkles size={15} />}
          </button>
        </div>

        {guessError && (
          <p className="text-xs font-bold text-orange-500 -mt-2">{guessError}</p>
        )}

        {type === 'food' && (
          <div className="grid grid-cols-3 gap-2">
            {macroFields.map(({ label, value, set }) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xs font-bold text-lily/50">{label}</span>
                <div className="relative">
                  <input
                    type="number"
                    value={value}
                    onChange={e => set(sanitizeNumeric(e.target.value))}
                    onKeyDown={blockInvalidNumericKey}
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
            disabled={!canSave || saving}
            onClick={handleSave}
            className="flex-1 bg-lily text-primary rounded-2xl py-3 text-sm font-extrabold cursor-pointer disabled:opacity-40 disabled:cursor-default"
          >
            {saving ? '…' : (context === 'planner' && !isPlanItemEdit) ? t('plannerSaveItem') : t('photoLogSave')}
          </button>
        </div>
      </div>
    </div>
  )
}
