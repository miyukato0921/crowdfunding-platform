import sql from "@/lib/db"
import { CreditCard } from "lucide-react"
import PledgesManagement from "@/components/admin/PledgesManagement"
import PledgesExportButton from "@/components/admin/PledgesExportButton"

export default async function PledgesPage() {
  const pledges = await sql`
    SELECT
      p.*,
      rt.title      AS reward_title,
      rt.requires_shipping,
      c.title       AS campaign_title,
      (SELECT receipt_number FROM receipts WHERE pledge_id = p.id LIMIT 1) as receipt_number,
      (SELECT download_token FROM receipts WHERE pledge_id = p.id LIMIT 1) as receipt_download_token
    FROM pledges p
    LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
    LEFT JOIN campaigns c    ON c.id  = p.campaign_id
    ORDER BY p.created_at DESC
    LIMIT 200
  `

  const statsRows = await sql`
    SELECT
      COALESCE(SUM(amount)  FILTER (WHERE payment_status = 'completed'), 0)       AS total_completed,
      COUNT(*)              FILTER (WHERE payment_status = 'completed')            AS count_completed,
      COUNT(*)              FILTER (WHERE payment_status = 'pending')              AS count_pending,
      COUNT(*)              FILTER (WHERE shipping_status = 'waiting')             AS count_shipping
    FROM pledges
  `
  const stats = statsRows[0] as any

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">支援者管理</h1>
          <p className="text-muted-foreground mt-1">支援の確認・ステータス変更・発送管理</p>
        </div>
        <PledgesExportButton />
      </div>

      <PledgesManagement pledges={pledges as any} stats={stats} />
    </div>
  )
}
