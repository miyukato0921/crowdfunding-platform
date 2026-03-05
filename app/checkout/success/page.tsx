import CampaignHeader from "@/components/campaign/CampaignHeader"
import SuccessConfirm from "@/components/checkout/SuccessConfirm"
import SuccessPageClient from "@/components/checkout/SuccessPageClient"
import sql from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  // キャンペーンタイトルを取得
  let campaignTitle = "Green Ireland Festival 2026"
  try {
    const campaigns = await sql`SELECT title FROM campaigns WHERE is_active = true ORDER BY id LIMIT 1`
    campaignTitle = campaigns[0]?.title ?? campaignTitle
  } catch {
    // DB取得失敗時はデフォルト値を使用
  }

  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        {session_id && <SuccessConfirm sessionId={session_id} />}
        <SuccessPageClient campaignTitle={campaignTitle} />
      </main>
    </div>
  )
}
