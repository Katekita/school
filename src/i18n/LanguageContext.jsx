import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { languages, translations } from './translations'

const STORAGE_KEY = 'school68_language'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && languages.some((l) => l.code === saved)) return saved
    } catch {}
    return 'ky'
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {}
    document.documentElement.lang = lang
  }, [lang])

  const resolve = useCallback(
    (key) => {
      const keys = key.split('.')
      let value = translations[lang]
      for (const k of keys) {
        if (value && typeof value === 'object') value = value[k]
        else return undefined
      }
      return value
    },
    [lang],
  )

  const t = useCallback(
    (key) => {
      const value = resolve(key)
      if (typeof value === 'string') return value
      const keys = key.split('.')
      return keys[keys.length - 1]
    },
    [resolve],
  )

  // get возвращает сырое значение (массив или объект) по пути в словаре.
  const get = useCallback((key) => resolve(key), [resolve])

  const value = useMemo(
    () => ({ lang, setLang, languages, t, get }),
    [lang, t, get],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

// oxlint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
