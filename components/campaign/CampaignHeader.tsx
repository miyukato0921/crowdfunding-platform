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
    <header className="bg-ireland-dark text-white py-2 px-3 sm:px-4 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={title}
              width={28}
              height={28}
              className="rounded-full object-cover shrink-0 sm:w-9 sm:h-9"
              style={{ width: "auto", height: "auto" }}
              unoptimized
            />
          ) : (
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-ireland-gold rounded-full flex items-center justify-center shrink-0">
              <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ireland-dark" />
            </div>
          )}
          <span className="font-bold text-xs sm:text-base tracking-tight truncate">{title}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-white/60 text-sm hidden sm:block">{t("crowdfunding")}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
