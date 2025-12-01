import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { translations, type Language } from '@/lib/i18n'

const LANGUAGE_STORAGE_KEY = 'baian-language'

interface LanguageContextValue {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function getPreferredLanguage(): Language {
  if (typeof window === 'undefined') return 'en'

  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null
    if (stored === 'en' || stored === 'ar') return stored
  } catch {
    // Ignore read errors
  }

  // Check browser preference if no stored value
  if (window.navigator.language.startsWith('ar')) {
    return 'ar'
  }

  return 'en'
}

function applyLanguage(language: Language) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const dir = language === 'ar' ? 'rtl' : 'ltr'
  root.lang = language
  root.dir = dir
  // Force layout recalculation if needed, but dir attribute usually suffices
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const preferred = getPreferredLanguage()
    applyLanguage(preferred)
    return preferred
  })

  useEffect(() => {
    applyLanguage(language)
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
    } catch {
      // Ignore write errors
    }
  }, [language])

  const value = useMemo(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: translations[language],
      dir: language === 'ar' ? 'rtl' : 'ltr' as 'ltr' | 'rtl',
    }),
    [language],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

