"use client"

import Image from "next/image"
import { Leaf } from "lucide-react"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { useLanguage } from "@/components/LanguageProvider"

interface CampaignHeaderProps {
  logoUrl?: string
  siteTitle?: string
}

export default function CampaignHeader({ logoUrl, siteTitle }: CampaignHeaderProps) {
  const { t } = useLanguage()
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
            />
          ) : (
            <div className="w-9 h-9 bg-ireland-gold rounded-full flex items-center justify-center shrink-0">
              <Leaf className="w-4 h-4 text-ireland-dark" />
            </div>
          )}
          <div>
            <span className="font-bold text-lg tracking-tight leading-none block">{title}</span>
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
