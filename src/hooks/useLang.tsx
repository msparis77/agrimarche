'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Lang } from '@/i18n/translations'

type LangContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: typeof translations.fr
}

const LangContext = createContext<LangContextType>({
  lang: 'fr',
  setLang: () => {},
  t: translations.fr,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Lang
    if (saved && ['fr', 'en', 'wo'].includes(saved)) {
      setLangState(saved)
    }
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('lang', l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
