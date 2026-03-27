import sql from "@/lib/db"
import { formatYen, calcProgress, calcDaysLeft } from "@/lib/utils"
import type { Campaign } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Edit, BarChart2 } from "lucide-react"

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "実施中", className: "bg-green-100 text-green-800 border-green-200" },
  draft: { label: "下書き", className: "bg-gray-100 text-gray-700 border-gray-200" },
  completed: { label: "終了", className: "bg-blue-100 text-blue-800 border-blue-200" },
  cancelled: { label: "中止", className: "bg-red-100 text-red-800 border-red-200" },
}

export default async function CampaignsPage() {
  const campaigns = await sql<(Campaign & { actual_amount: number; actual_supporters: number })[]>`
    SELECT c.*,
      COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'completed'), 0) AS actual_amount,
      COUNT(p.id) FILTER (WHERE p.payment_status = 'completed') AS actual_supporters
    FROM campaigns c
    LEFT JOIN pledges p ON p.campaign_id = c.id
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">クラウドファンディング管理</h1>
          <p className="text-muted-foreground mt-1">キャンペーンの作成・編集・管理</p>
        </div>
        <Button className="bg-ireland-green hover:bg-ireland-green/90 text-white rounded-xl" asChild>
          <Link href="/admin/campaigns/new">
            <Plus className="w-4 h-4 mr-2" />
            新規キャンペーン
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const progress = calcProgress(Number(campaign.actual_amount), campaign.goal_amount)
          const daysLeft = calcDaysLeft(campaign.end_date)
          const status = statusMap[campaign.status] ?? { label: campaign.status, className: "bg-gray-100" }

          return (
            <div key={campaign.id} className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge className={`text-xs border ${status.className}`}>{status.label}</Badge>
                    <span className="text-xs text-muted-foreground">残り{daysLeft}日</span>
                  </div>
                  <h2 className="font-bold text-lg text-foreground mb-1">{campaign.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{campaign.short_description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link href={`/admin/campaigns/${campaign.id}/stats`}>
                      <BarChart2 className="w-4 h-4 mr-1.5" />
                      統計
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" asChild>
                    <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                      <Edit className="w-4 h-4 mr-1.5" />
                      編集
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-black text-ireland-green">{formatYen(Number(campaign.actual_amount))}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">集まった金額</p>
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{Number(campaign.actual_supporters)}人</p>
                  <p className="text-xs text-muted-foreground mt-0.5">支援者数</p>
                </div>
                <div>
                  <p className="text-xl font-black text-foreground">{progress}%</p>
                  <p className="text-xs text-muted-foreground mt-0.5">達成率</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, oklch(0.42 0.15 152), oklch(0.55 0.16 152))",
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{formatYen(Number(campaign.actual_amount))}</span>
                  <span>目標 {formatYen(campaign.goal_amount)}</span>
                </div>
              </div>
            </div>
          )
        })}

        {campaigns.length === 0 && (
          <div className="bg-card rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">キャンペーンがありません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
