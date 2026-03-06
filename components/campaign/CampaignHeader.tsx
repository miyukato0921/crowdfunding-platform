"use client"

import { Leaf } from "lucide-react"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useLanguage } from "@/components/LanguageProvider"

export default function CampaignHeader() {
  const { t } = useLanguage()

  return (
    <header className="bg-ireland-dark text-white py-3 px-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ireland-gold rounded-full flex items-center justify-center">
            <Leaf className="w-4 h-4 text-ireland-dark" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight leading-none block">Green Ireland Festival</span>
            {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA && (
              <span className="text-white/30 text-[10px] font-mono leading-none">
                {process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA.slice(0, 7)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm hidden sm:block">{t("crowdfunding")}</span>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
