import { createContext, useContext, useState } from 'react'
import { translations, type Lang, type TranslationKey } from '../i18n/translations'

interface LanguageCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
  ta: (key: TranslationKey) => string[]
}

const LanguageContext = createContext<LanguageCtx | null>(null)

function getStored(): Lang {
  const v = localStorage.getItem('nomnom-lang')
  return v === 'en' ? 'en' : 'pl'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getStored)

  const setLang = (l: Lang) => {
    localStorage.setItem('nomnom-lang', l)
    setLangState(l)
  }

  const t = (key: TranslationKey): string => {
    const val = translations[lang][key]
    return Array.isArray(val) ? (val as string[]).join(', ') : (val as string)
  }

  const ta = (key: TranslationKey): string[] => {
    const val = translations[lang][key]
    return Array.isArray(val) ? (val as string[]) : [val as string]
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, ta }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
