"use client"

import { formatYen } from "@/lib/utils"
import { Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Locale } from "date-fns"
import { ja, enUS, ko, zhCN } from "date-fns/locale"
import { useLanguage } from "@/components/LanguageProvider"
import { useEffect, useState } from "react"

interface Supporter {
  supporter_name: string | null
  amount: number
  message: string | null
  is_anonymous: boolean
  created_at: string
}

interface Props {
  supporters: Supporter[]
}

const dateLocales: Record<string, Locale> = { ja, en: enUS, ko, zh: zhCN }

function RelativeTime({ dateStr, locale }: { dateStr: string; locale: string }) {
  const dateLocale = dateLocales[locale] ?? ja

  // 静的フォーマット（SSR・ハイドレーション両方で同一の値）
  const d = new Date(dateStr)
  const staticLabel = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`

  const [label, setLabel] = useState(staticLabel)

  useEffect(() => {
    // クライアントのみで相対時間に切り替え
    const update = () =>
      setLabel(formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: dateLocale }))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateStr, locale])

  return <span className="text-xs text-muted-foreground" suppressHydrationWarning>{label}</span>
}

export default function SupportersList({ supporters }: Props) {
  const { t, locale } = useLanguage()

  if (supporters.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">{t("noSupporters")}</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold text-foreground mb-5 pb-4 border-b border-border flex items-center gap-2">
        <Heart className="w-5 h-5 text-ireland-gold fill-ireland-gold" />
        {t("supportersTitle")}
      </h2>
      <div className="space-y-4">
        {supporters.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${s.is_anonymous ? "bg-muted text-muted-foreground" : "bg-ireland-green/20 text-ireland-green"}`}>
              {s.is_anonymous ? "?" : (s.supporter_name?.charAt(0) ?? "?")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className={`font-bold text-sm ${s.is_anonymous ? "text-muted-foreground italic" : "text-foreground"}`}>
                  {s.is_anonymous ? t("anonymous") : (s.supporter_name ?? t("anonymous"))}
                </span>
                <RelativeTime dateStr={s.created_at} locale={locale} />
              </div>
              <span className="text-ireland-green font-bold text-sm">{formatYen(s.amount)}</span>
              {s.message && (
                <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{s.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
