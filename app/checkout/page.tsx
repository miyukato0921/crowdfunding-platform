import { Suspense } from "react"
import sql from "@/lib/db"
import type { Campaign, RewardTier } from "@/lib/db"
import CheckoutForm from "@/components/checkout/CheckoutForm"
import CampaignHeader from "@/components/campaign/CampaignHeader"
import { formatYen } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface SearchParams {
  campaign_id?: string
  reward_id?: string
  amount?: string
  custom?: string
}

async function getData(params: SearchParams) {
  const campaignId = params.campaign_id ? parseInt(params.campaign_id) : null
  const rewardId = params.reward_id ? parseInt(params.reward_id) : null

  if (!campaignId) return { campaign: null, reward: null }

  const campaigns = await sql<Campaign[]>`SELECT * FROM campaigns WHERE id = ${campaignId} LIMIT 1`
  const campaign = campaigns[0] ?? null

  let reward: RewardTier | null = null
  if (rewardId) {
    const rewards = await sql<RewardTier[]>`SELECT * FROM reward_tiers WHERE id = ${rewardId} LIMIT 1`
    reward = rewards[0] ?? null
  }

  return { campaign, reward }
}

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const { campaign, reward } = await getData(params)
  const isCustom = params.custom === "true"
  const defaultAmount = params.amount ? parseInt(params.amount) : (isCustom ? 1000 : null)

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <CampaignHeader />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">キャンペーンが見つかりません。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          プロジェクトに戻る
        </Link>

        <h1 className="text-2xl font-black text-foreground mb-6">支援手続き</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-5 sticky top-4">
              <h2 className="font-bold text-foreground mb-4 text-sm">支援内容</h2>
              <div className="relative h-32 w-full rounded-xl overflow-hidden mb-4">
                <Image
                  src={reward?.image_url ?? "/images/hero-festival.jpg"}
                  alt={reward?.title ?? campaign.title}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="font-bold text-foreground text-sm mb-1">{campaign.title}</p>
              {reward ? (
                <>
                  <p className="text-xs text-muted-foreground mb-3">{reward.title}</p>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">支援金額</span>
                      <span className="font-black text-ireland-green text-lg">{formatYen(reward.amount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-3">応援支援（リターンなし）</p>
                  {defaultAmount && (
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">支援金額</span>
                        <span className="font-black text-ireland-green text-lg">{formatYen(defaultAmount)}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Checkout form */}
          <div className="md:col-span-3">
            <Suspense fallback={<div className="bg-card rounded-2xl border border-border p-6 animate-pulse h-64" />}>
              <CheckoutForm
                campaign={campaign}
                reward={reward}
                isCustom={isCustom}
                defaultAmount={defaultAmount}
              />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
