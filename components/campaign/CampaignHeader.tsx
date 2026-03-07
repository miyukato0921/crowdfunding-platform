"use client"

import Image from "next/image"
import { Leaf } from "lucide-react"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useLanguage } from "@/components/LanguageProvider"
import { useSiteSettings } from "@/components/SiteSettingsProvider"

export default function CampaignHeader() {
  const { t } = useLanguage()
  const { logoUrl, siteTitle } = useSiteSettings()
  const title = siteTitle || "Green Ireland Festival"

  return (
    <header className="bg-ireland-dark text-white py-2 px-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={title}
              width={40}
              height={40}
              className="rounded-full object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 bg-ireland-gold rounded-full flex items-center justify-center shrink-0">
              <Leaf className="w-4.5 h-4.5 text-ireland-dark" />
            </div>
          )}
          <span className="font-bold text-base sm:text-lg tracking-tight truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-white/60 text-xs sm:text-sm hidden sm:block">{t("crowdfunding")}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
