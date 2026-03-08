import sql from "@/lib/db"
import { CreditCard } from "lucide-react"
import PledgesManagement from "@/components/admin/PledgesManagement"
import PledgesExportButton from "@/components/admin/PledgesExportButton"

export const dynamic = "force-dynamic"

export default async function PledgesPage() {
  let pledges: any[] = []
  let stats: any = {}
  let error: string | null = null

  try {
    const pledgesData = await sql`
      SELECT
        p.*,
        rt.title      AS reward_title,
        rt.requires_shipping,
        c.title       AS campaign_title
      FROM pledges p
      LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
      LEFT JOIN campaigns c    ON c.id  = p.campaign_id
      ORDER BY p.created_at DESC
      LIMIT 200
    `
    pledges = pledgesData

    const statsRows = await sql`
      SELECT
        COALESCE(SUM(amount)  FILTER (WHERE payment_status = 'completed'), 0)       AS total_completed,
        COUNT(*)              FILTER (WHERE payment_status = 'completed')            AS count_completed,
        COUNT(*)              FILTER (WHERE payment_status = 'pending')              AS count_pending,
        COUNT(*)              FILTER (WHERE shipping_status = 'waiting')             AS count_shipping
      FROM pledges
    `
    stats = statsRows[0] || {}
  } catch (err) {
    console.error("[v0] Pledges query error:", err)
    error = "データベースへの接続に失敗しました"
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-ireland-green" />
            </div>
            <h1 className="text-2xl font-black text-foreground">支援者管理</h1>
          </div>
          <p className="text-muted-foreground mt-1">支援の確認・ステータス変更・発送管理</p>
        </div>
        <PledgesExportButton />
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <PledgesManagement pledges={pledges as any} stats={stats} />
    </div>
  )
}
