"use client"

import { useState, useEffect, useRef } from "react"
import { useLanguage } from "@/components/LanguageProvider"

// セッション内キャッシュ
const cache = new Map<string, string>()

function cacheKey(text: string, lang: string) {
  return `${lang}:${text}`
}

/**
 * 日本語テキストを現在の言語に自動翻訳するhook。
 * 日本語の場合はそのまま返す。翻訳中は原文を返す。
 * 結果はセッション内でキャッシュされる。
 */
export function useTranslateText(jaText: string): string {
  const { lang } = useLanguage()
  const [translated, setTranslated] = useState(jaText)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!jaText || lang === "ja") {
      setTranslated(jaText)
      return
    }

    const key = cacheKey(jaText, lang)
    const cached = cache.get(key)
    if (cached) {
      setTranslated(cached)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    fetch("/api/translate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: jaText, targetLang: lang }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.translated) {
          cache.set(key, data.translated)
          setTranslated(data.translated)
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[useTranslateText] Failed:", err)
        }
      })

    return () => controller.abort()
  }, [jaText, lang])

  return translated
}

/**
 * 複数テキストを一括翻訳するhook。
 * Record<string, string> を受け取り、翻訳済みの Record<string, string> を返す。
 */
export function useTranslateTexts(jaTexts: Record<string, string>): Record<string, string> {
  const { lang } = useLanguage()
  const [translated, setTranslated] = useState(jaTexts)
  const abortRef = useRef<AbortController | null>(null)
  const textsKey = JSON.stringify(jaTexts)

  useEffect(() => {
    if (lang === "ja") {
      setTranslated(jaTexts)
      return
    }

    // 全てキャッシュにある場合
    const allCached: Record<string, string> = {}
    let allHit = true
    for (const [k, v] of Object.entries(jaTexts)) {
      if (!v) { allCached[k] = v; continue }
      const cached = cache.get(cacheKey(v, lang))
      if (cached) {
        allCached[k] = cached
      } else {
        allHit = false
        break
      }
    }
    if (allHit) {
      setTranslated(allCached)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    fetch("/api/translate-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: jaTexts, targetLang: lang }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.translations) {
          for (const [k, v] of Object.entries(jaTexts)) {
            if (v && (data.translations as Record<string, string>)[k]) {
              cache.set(cacheKey(v, lang), (data.translations as Record<string, string>)[k])
            }
          }
          setTranslated(data.translations)
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.error("[useTranslateTexts] Failed:", err)
        }
      })

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textsKey, lang])

  return translated
}
