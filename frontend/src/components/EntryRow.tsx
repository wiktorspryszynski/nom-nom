import { Pencil, Trash2, Utensils, Dumbbell } from 'lucide-react'
import { type DailyEntry } from '../lib/api'

export function EntryRow({ entry, onDelete, onEdit }: {
  entry: DailyEntry
  onDelete?: (id: number) => void
  onEdit?: (entry: DailyEntry) => void
}) {
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
      {onEdit && entry.type === 'food' && (
        <button
          onClick={() => onEdit(entry)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-lily/30 hover:text-lily/60 active:text-lily/60 cursor-pointer shrink-0"
          aria-label="Edit entry"
        >
          <Pencil size={13} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(entry.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-lily/20 hover:text-red-400 active:text-red-400 cursor-pointer shrink-0"
          aria-label="Delete entry"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
