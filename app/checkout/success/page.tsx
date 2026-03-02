import CampaignHeader from "@/components/campaign/CampaignHeader"
import SuccessConfirm from "@/components/checkout/SuccessConfirm"
import SuccessPageClient from "@/components/checkout/SuccessPageClient"

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  return (
    <div className="min-h-screen bg-background">
      <CampaignHeader />
      <main className="max-w-lg mx-auto px-4 py-16 text-center">
        {session_id && <SuccessConfirm sessionId={session_id} />}
        <SuccessPageClient />
      </main>
    </div>
  )
}
