import sql from "@/lib/db"
import type { Campaign, RewardTier } from "@/lib/db"
import CampaignHero from "@/components/campaign/CampaignHero"
import FundingProgress from "@/components/campaign/FundingProgress"
import RewardTiers from "@/components/campaign/RewardTiers"
import CampaignDescription from "@/components/campaign/CampaignDescription"
import SupportersList from "@/components/campaign/SupportersList"
import StickySupport from "@/components/campaign/StickySupport"
import CampaignHeader from "@/components/campaign/CampaignHeader"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function getCampaignData() {
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
              <CampaignDescription campaign={campaign} gallery={gallery as any} performers={performers as any} />
              <SupportersList supporters={supporters} />
            </div>
            {/* Right sidebar - rewards */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="sticky top-4">
                <RewardTiers rewards={rewards} campaignId={campaign.id} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <StickySupport campaignId={campaign.id} />
    </div>
  )
}
