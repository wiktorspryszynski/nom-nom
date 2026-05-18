import { useState, useCallback } from 'react'

const TOKENS = [
  { key: 'primary',      label: 'Primary',      var: '--color-primary',      default: '#ffee99' },
  { key: 'primary-dark', label: 'Primary Dark',  var: '--color-primary-dark', default: '#f7d578' },
  { key: 'lily',         label: 'Lily',          var: '--color-lily',         default: '#7d3ed0' },
  { key: 'ivory',        label: 'Ivory',         var: '--color-ivory',        default: '#ffffd1' },
] as const

type TokenKey = typeof TOKENS[number]['key']
type Colors = Record<TokenKey, string>

function buildCSS(colors: Colors) {
  return `@theme {\n${TOKENS.map(t => `  ${t.var}: ${colors[t.key]};`).join('\n')}\n}`
}

export default function ColorAdjuster() {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const [colors, setColors] = useState<Colors>(() =>
    Object.fromEntries(TOKENS.map(t => [t.key, t.default])) as Colors
  )

  const update = useCallback((key: TokenKey, value: string) => {
    document.documentElement.style.setProperty(
      TOKENS.find(t => t.key === key)!.var,
      value
    )
    setColors(prev => ({ ...prev, [key]: value }))
  }, [])

  const reset = () => {
    TOKENS.forEach(t => {
      document.documentElement.style.removeProperty(t.var)
    })
    setColors(Object.fromEntries(TOKENS.map(t => [t.key, t.default])) as Colors)
  }

  const copy = async () => {
    await navigator.clipboard.writeText(buildCSS(colors))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="rounded-2xl shadow-2xl p-4 flex flex-col gap-3 w-52"
          style={{ background: '#1e1e2e', color: '#cdd6f4' }}
        >
          <span className="text-xs font-bold uppercase tracking-widest opacity-50">Colors</span>

          {TOKENS.map(t => (
            <label key={t.key} className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-sm font-semibold">{t.label}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs opacity-60 font-mono">{colors[t.key]}</span>
                <input
                  type="color"
                  value={colors[t.key]}
                  onChange={e => update(t.key, e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
              </div>
            </label>
          ))}

          <div className="flex gap-2 pt-1 border-t border-white/10">
            <button
              onClick={reset}
              className="flex-1 text-xs font-bold py-1.5 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
              style={{ background: '#313244' }}
            >
              Reset
            </button>
            <button
              onClick={copy}
              className="flex-1 text-xs font-bold py-1.5 rounded-xl transition-colors"
              style={{ background: copied ? '#a6e3a1' : '#cba6f7', color: '#1e1e2e' }}
            >
              {copied ? 'Copied!' : 'Copy CSS'}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        className="w-10 h-10 rounded-full shadow-lg text-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ background: '#1e1e2e' }}
        title="Toggle color adjuster"
      >
        🎨
      </button>
    </div>
  )
}
