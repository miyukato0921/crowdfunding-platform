import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import PerformersManagement from "@/components/admin/PerformersManagement"

export default async function PerformersPage() {
  const admin = await getAdminSession()
  if (!admin) redirect("/admin/login")

  const campaigns = await sql`SELECT id FROM campaigns ORDER BY id LIMIT 1`
  const campaign = campaigns[0]
  if (!campaign) return <div className="p-8 text-muted-foreground">キャンペーンが見つかりません</div>

  const performers = await sql`
    SELECT * FROM performers WHERE campaign_id = ${campaign.id} ORDER BY sort_order
  `

  return <PerformersManagement campaignId={campaign.id} initialPerformers={performers as any} />
}
