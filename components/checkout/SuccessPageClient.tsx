"use client"

import Link from "next/link"
import { CheckCircle, Heart, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/LanguageProvider"

export default function SuccessPageClient() {
  const { t } = useLanguage()
  return (
    <>
      <div className="w-20 h-20 bg-ireland-green/15 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-ireland-green" />
      </div>
      <h1 className="text-3xl font-black text-foreground mb-3">{t("successTitle")}</h1>
      <p className="text-muted-foreground leading-relaxed mb-2">{t("successSubtitle")}</p>
      <p className="text-sm text-muted-foreground mb-8">{t("successEmailNote")}</p>
      <div className="bg-ireland-green/10 border border-ireland-green/20 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-ireland-gold fill-ireland-gold" />
          <span className="font-bold text-foreground">{t("successShare")}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t("successShareDesc")}</p>
      </div>
      <Button
        className="w-full bg-ireland-green hover:bg-ireland-green/90 text-white font-bold rounded-xl"
        asChild
      >
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("backToProjectBtn")}
        </Link>
      </Button>
    </>
  )
}
