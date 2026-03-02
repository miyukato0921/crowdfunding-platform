"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Locale } from "@/lib/i18n"

interface LanguageContextType {
  locale: Locale
  lang: Locale
  setLocale: (l: Locale) => void
  t: (key: keyof typeof translations.ja, vars?: Record<string, string | number>) => string
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "ja",
  lang: "ja",
  setLocale: () => {},
  t: (key) => key as string,
})

function detectLocale(): Locale {
  if (typeof window === "undefined") return "ja"
  const saved = localStorage.getItem("locale") as Locale | null
  if (saved && ["ja", "en", "ko"].includes(saved)) return saved
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith("ko")) return "ko"
  if (lang.startsWith("ja")) return "ja"
  return "en"
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ja")

  useEffect(() => {
    setLocaleState(detectLocale())
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("locale", l)
    document.documentElement.lang = l
  }

  const t = (key: keyof typeof translations.ja, vars?: Record<string, string | number>): string => {
    let str: string = (translations[locale] as any)[key] ?? (translations.ja as any)[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }

  return (
    <LanguageContext.Provider value={{ locale, lang: locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
