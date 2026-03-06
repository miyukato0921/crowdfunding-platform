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
    <header className="bg-ireland-dark text-white py-3 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={title}
              width={36}
              height={36}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-9 h-9 bg-ireland-gold rounded-full flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-ireland-dark" />
            </div>
          )}
          <span className="font-bold text-lg tracking-tight">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm hidden sm:block">{t("crowdfunding")}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
