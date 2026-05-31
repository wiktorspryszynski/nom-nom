import { useEffect, useRef, useState } from 'react'
import { X, RotateCcw, Check, Loader2, AlertCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { tracker } from '../lib/api'

/** Resize an image to at most maxPx on its longest side before uploading. */
async function resizeImage(file: File, maxPx = 1024): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        b => (b ? resolve(b) : reject(new Error('resize failed'))),
        'image/jpeg',
        0.88,
      )
    }
    img.onerror = reject
    img.src = url
  })
}

interface ParsedFood {
  name: string
  description: string
  kcal: number
  protein: number
  fat: number
  carbs: number
  confidence: number
}

interface Props {
  file: File | null
  onClose: () => void
  onSaved?: (food: ParsedFood) => void
}

function MacroChip({ label, value, unit, color, onChange }: {
  label: string; value: number; unit: string; color: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color }}>{label}</span>
      <input
        type="number"
        value={value}
        step="0.1"
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="w-16 text-center font-extrabold text-lily text-sm bg-lily/6 border-[2px] border-lily/20
                   rounded-xl py-1.5 outline-none focus:border-lily/50 transition-colors"
      />
      <span className="text-[10px] font-bold text-lily/40">{unit}</span>
    </div>
  )
}

export default function PhotoLogSheet({ file, onClose, onSaved }: Props) {
  const { t, lang } = useLanguage()
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState<'analyzing' | 'result' | 'error'>('analyzing')
  const [food, setFood] = useState<ParsedFood | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const prevFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (!file || file === prevFileRef.current) return
    prevFileRef.current = file

    const url = URL.createObjectURL(file)
    setPreview(url)
    setStatus('analyzing')
    setFood(null)
    setErrorMsg('')

    const token = localStorage.getItem('nom_token')

    // Resize to ≤1024px before upload to reduce vision token cost
    resizeImage(file)
      .then(resizedBlob => {
        const formData = new FormData()
        formData.append('file', resizedBlob, 'photo.jpg')
        return fetch(`/api/tracker/log/photo?language=${lang}`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        })
      })
      .then(async res => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.detail || 'Błąd analizy zdjęcia')
        }
        return res.json()
      })
      .then((data: ParsedFood) => {
        setFood(data)
        setStatus('result')
      })
      .catch(err => {
        setErrorMsg(err.message)
        setStatus('error')
      })

    return () => URL.revokeObjectURL(url)
  }, [file])

  const handleSave = async () => {
    if (!food) return
    setSaving(true)
    try {
      await tracker.saveLog({
        description: food.name,
        kcal: food.kcal,
        protein: food.protein,
        fat: food.fat,
        carbs: food.carbs,
        source_type: 'photo',
        ai_confidence: food.confidence,
      })
      onSaved?.(food)
      onClose()
    } catch {
      setErrorMsg('Nie udało się zapisać wpisu. Spróbuj ponownie.')
      setStatus('error')
    } finally {
      setSaving(false)
    }
  }

  const open = file !== null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl
                    transition-transform duration-400 ease-out
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '90dvh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-lily/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-lily/10">
          <h2 className="text-base font-extrabold text-lily">{t('photoLogTitle')}</h2>
          <button onClick={onClose} className="text-lily/40 hover:text-lily/70 transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-5 pb-10">
          {/* Photo preview */}
          {preview && (
            <div className="relative rounded-2xl overflow-hidden bg-lily/5 aspect-video">
              <img src={preview} alt={t('photoLogAlt')} className="w-full h-full object-cover" />
              {status === 'analyzing' && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={32} className="text-primary animate-spin" />
                  <span className="text-sm font-extrabold text-white">{t('photoLogAnalyzing')}</span>
                </div>
              )}
            </div>
          )}

          {/* Analyzing */}
          {status === 'analyzing' && (
            <div className="bg-ivory rounded-2xl p-4 text-center">
              <p className="text-sm font-bold text-lily/60">{t('photoLogAnalyzingBody')}</p>
              <p className="text-xs text-lily/40 mt-1">{t('photoLogAnalyzingDetail')}</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="bg-red-50 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-500">{errorMsg}</p>
                <button
                  onClick={() => { prevFileRef.current = null; if (file) { prevFileRef.current = null; setStatus('analyzing'); } }}
                  className="flex items-center gap-1 text-xs font-bold text-red-400 mt-2 cursor-pointer"
                >
                  <RotateCcw size={12} /> {t('photoLogRetry')}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {status === 'result' && food && (
            <>
              {/* Confidence badge */}
              {food.confidence > 0 && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${food.confidence > 0.8 ? 'bg-[#3ec9a7]' : 'bg-[#f7a84a]'}`} />
                  <span className="text-xs font-bold text-lily/50">
                    {t('photoLogConfidence').replace('{pct}', String(Math.round(food.confidence * 100)))}
                    {food.confidence < 0.7 && ` ${t('photoLogConfidenceLow')}`}
                  </span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-[10px] font-extrabold text-lily/40 uppercase tracking-widest">{t('photoLogMealLabel')}</label>
                <input
                  type="text"
                  value={food.name}
                  onChange={e => setFood(f => f ? { ...f, name: e.target.value } : f)}
                  style={{ borderRadius: '12px 4px 14px 6px / 4px 12px 6px 14px' }}
                  className="w-full mt-1 bg-ivory border-[2px] border-lily/25 text-lily font-extrabold
                             text-base px-3 py-2.5 outline-none focus:border-lily/50 transition-colors"
                />
                <p className="text-xs text-lily/40 mt-1.5 font-semibold">{food.description}</p>
              </div>

              {/* Kcal */}
              <div className="bg-primary/30 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-sm font-extrabold text-lily">{t('photoLogCalories')}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={food.kcal}
                    onChange={e => setFood(f => f ? { ...f, kcal: parseInt(e.target.value) || 0 } : f)}
                    className="w-24 text-right font-extrabold text-lily text-xl bg-white/60 border-[2px] border-lily/20
                               rounded-xl px-2 py-1 outline-none focus:border-lily/50 transition-colors"
                  />
                  <span className="text-sm font-bold text-lily/60">kcal</span>
                </div>
              </div>

              {/* Macros */}
              <div className="bg-white rounded-2xl border-[2px] border-lily/15 p-4">
                <p className="text-[10px] font-extrabold text-lily/40 uppercase tracking-widest mb-4">{t('photoLogMacros')}</p>
                <div className="flex justify-around">
                  <MacroChip label={t('photoLogProtein')} value={food.protein} unit="g" color="#7d3ed0"
                    onChange={v => setFood(f => f ? { ...f, protein: v } : f)} />
                  <MacroChip label={t('photoLogFat')} value={food.fat} unit="g" color="#f7a84a"
                    onChange={v => setFood(f => f ? { ...f, fat: v } : f)} />
                  <MacroChip label={t('photoLogCarbs')} value={food.carbs} unit="g" color="#3ec9a7"
                    onChange={v => setFood(f => f ? { ...f, carbs: v } : f)} />
                </div>
              </div>

              {/* Actions */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-lily text-primary rounded-2xl
                           py-4 text-base font-extrabold shadow-md active:scale-[0.98] transition-transform
                           cursor-pointer disabled:opacity-60 disabled:cursor-default"
              >
                {saving
                  ? <><Loader2 size={18} className="animate-spin" /> {t('photoLogSaving')}</>
                  : <><Check size={18} strokeWidth={2.5} /> {t('photoLogSave')}</>}
              </button>

              <button onClick={onClose} className="w-full text-center text-sm font-bold text-lily/40 cursor-pointer hover:text-lily/60 transition-colors">
                {t('photoLogCancel')}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
