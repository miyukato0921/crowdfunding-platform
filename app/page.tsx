import sql from "@/lib/db"
import type { Campaign, RewardTier } from "@/lib/db"
import Link from "next/link"
import CampaignHero from "@/components/campaign/CampaignHero"
import FundingProgress from "@/components/campaign/FundingProgress"
import RewardTiers from "@/components/campaign/RewardTiers"
import CampaignDescription from "@/components/campaign/CampaignDescription"
import StickySupport from "@/components/campaign/StickySupport"
import CampaignHeader from "@/components/campaign/CampaignHeader"
import { Heart } from "lucide-react"
import { formatYen } from "@/lib/utils"

// SupportersList をインラインで定義（外部ファイルの古いキャッシュ問題を回避）
function SupportersList({ supporters }: {
  supporters: { supporter_name: string | null; amount: number; message: string | null; is_anonymous: boolean; created_at: string }[]
}) {
  if (supporters.length === 0) return null
  const fmt = (d: string) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`
  }
  return (
    <div className="bg-card rounded-2xl border border-border p-6 mt-6">
      <h2 className="font-black text-foreground mb-4 flex items-center gap-2">
        <Heart className="w-4 h-4 text-brand-green" />
        支援者
        <span className="text-sm font-normal text-muted-foreground">（{supporters.length}件）</span>
      </h2>
      <div className="space-y-4">
        {supporters.map((s, i) => (
          <div key={i} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 text-brand-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  {s.is_anonymous ? "匿名" : (s.supporter_name ?? "匿名")}
                </span>
                <span className="text-xs text-muted-foreground">{fmt(s.created_at)}</span>
              </div>
              <p className="text-sm font-bold text-brand-green">{formatYen(s.amount)}</p>
              {s.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.message}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getCampaignData() {
  try {
    const campaigns = await sql<Campaign[]>`
      SELECT * FROM campaigns WHERE status = 'active' ORDER BY id LIMIT 1
    `
    const campaign = campaigns[0]
    if (!campaign) return { campaign: null, rewards: [], supporters: [], gallery: [], performers: [] }

    const rewards = await sql<RewardTier[]>`
      SELECT * FROM reward_tiers
      WHERE campaign_id = ${campaign.id} AND is_active = true
      ORDER BY sort_order
    `
    const supporters = await sql`
      SELECT supporter_name, amount, message, is_anonymous, created_at
      FROM pledges
      WHERE campaign_id = ${campaign.id}
        AND payment_status = 'completed'
        AND (
          is_anonymous = false
          OR (is_anonymous = true AND message IS NOT NULL AND message <> '')
        )
      ORDER BY created_at DESC
      LIMIT 10
    `
    const gallery = await sql`
      SELECT * FROM gallery_photos
      WHERE campaign_id = ${campaign.id} AND is_active = true
      ORDER BY sort_order
    `
    const performers = await sql`
      SELECT * FROM performers
      WHERE campaign_id = ${campaign.id} AND is_active = true
      ORDER BY sort_order
    `
    return { campaign, rewards, supporters, gallery, performers }
  } catch {
    return { campaign: null, rewards: [], supporters: [], gallery: [], performers: [] }
  }
}

export default async function Page() {
  const { campaign, rewards, supporters, gallery, performers } = await getCampaignData()

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">キャンペーンが見つかりませんでした。</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main>
        <CampaignHero campaign={campaign} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left / Main content */}
            <div className="flex-1 min-w-0">
              <FundingProgress campaign={campaign} />
              <CampaignDescription campaign={{
                ...campaign,
                page_blocks: typeof (campaign as any).page_blocks === 'object'
                  ? JSON.stringify((campaign as any).page_blocks)
                  : (campaign as any).page_blocks ?? '[]',
                page_blocks_en: typeof (campaign as any).page_blocks_en === 'object'
                  ? JSON.stringify((campaign as any).page_blocks_en)
                  : (campaign as any).page_blocks_en ?? '[]',
                page_blocks_ko: typeof (campaign as any).page_blocks_ko === 'object'
                  ? JSON.stringify((campaign as any).page_blocks_ko)
                  : (campaign as any).page_blocks_ko ?? '[]',
                page_blocks_zh: typeof (campaign as any).page_blocks_zh === 'object'
                  ? JSON.stringify((campaign as any).page_blocks_zh)
                  : (campaign as any).page_blocks_zh ?? '[]',
              } as any} gallery={gallery as any} performers={performers as any} />
              <SupportersList supporters={supporters.map((s: any) => ({
                ...s,
                created_at: s.created_at instanceof Date
                  ? s.created_at.toISOString()
                  : String(s.created_at),
              }))} />
            </div>
            {/* Right sidebar - rewards */}
            <div className="w-full lg:w-96 shrink-0">
              <div id="rewards-section" className="sticky top-4">
                <RewardTiers rewards={rewards} campaignId={campaign.id} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <StickySupport campaignId={campaign.id} />
      <footer className="border-t border-border mt-8 pb-24 pt-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <Link href="/legal/tokusho" className="hover:text-foreground transition-colors">
              特定商取引法に基づく表記
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              利用規約
            </Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/legal/system" className="hover:text-foreground transition-colors">
              システム提供・決済代行
            </Link>
            <Link href="mailto:m.kato@iris-corp.co.jp" className="hover:text-foreground transition-colors">
              お問い合わせ
            </Link>
          </div>
          <p className="text-xs text-muted-foreground/60 font-mono">
            {(() => {
              const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME
              const sha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_GIT_COMMIT_SHA
              const branch = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF ?? process.env.VERCEL_GIT_COMMIT_REF
              const parts: string[] = []
              if (buildTime) {
                const d = new Date(buildTime)
                parts.push(`Build: ${d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" })}`)
              }
              if (sha) parts.push(`#${sha.slice(0, 7)}`)
              if (branch) parts.push(branch)
              return parts.length > 0 ? parts.join(" · ") : "dev"
            })()}
          </p>
        </div>
      </footer>
    </div>
  )
}
