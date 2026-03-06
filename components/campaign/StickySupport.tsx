"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/components/LanguageProvider"

interface Props {
  campaignId: number
}

export default function StickySupport({ campaignId }: Props) {
  const [visible, setVisible] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-border shadow-2xl py-3 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground truncate">Green Ireland Festival</p>
          <p className="text-xs text-muted-foreground">{t("stickyDesc")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="border-ireland-green text-ireland-green rounded-full px-4"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <ChevronDown className="w-4 h-4 rotate-180 mr-1" />
            {t("viewDetails")}
          </Button>
          <Button
            size="sm"
            className="bg-ireland-green hover:bg-ireland-green/90 text-white font-bold rounded-full px-5"
            onClick={() => {
              const el = document.getElementById("rewards-section")
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
          >
            <Heart className="w-4 h-4 mr-1.5 fill-white" />
            {t("support")}
          </Button>
        </div>
      </div>
    </div>
  )
}
