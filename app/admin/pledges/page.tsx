import sql from "@/lib/db"
import { formatYen } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { CreditCard, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "完了", className: "bg-green-100 text-green-800 border-green-200" },
  pending: { label: "保留中", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  failed: { label: "失敗", className: "bg-red-100 text-red-800 border-red-200" },
  refunded: { label: "返金済", className: "bg-gray-100 text-gray-700 border-gray-200" },
}

export default async function PledgesPage() {
  const pledges = await sql`
    SELECT p.*, rt.title as reward_title, c.title as campaign_title
    FROM pledges p
    LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
    LEFT JOIN campaigns c ON c.id = p.campaign_id
    ORDER BY p.created_at DESC
    LIMIT 100
  `

  const stats = await sql`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as total_completed,
      COUNT(*) FILTER (WHERE payment_status = 'completed') as count_completed,
      COUNT(*) FILTER (WHERE payment_status = 'pending') as count_pending
    FROM pledges
  `
  const s = stats[0] as any

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">支援者管理</h1>
          <p className="text-muted-foreground mt-1">すべての支援・決済を管理</p>
        </div>
        <Button variant="outline" className="rounded-xl">
          <Download className="w-4 h-4 mr-2" />
          CSVエクスポート
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-ireland-green">{formatYen(Number(s?.total_completed ?? 0))}</p>
          <p className="text-xs text-muted-foreground mt-1">完了済み総額</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-foreground">{s?.count_completed ?? 0}件</p>
          <p className="text-xs text-muted-foreground mt-1">完了件数</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="text-2xl font-black text-yellow-600">{s?.count_pending ?? 0}件</p>
          <p className="text-xs text-muted-foreground mt-1">保留中</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-ireland-green" />
          <h2 className="font-bold text-foreground">支援一覧</h2>
          <span className="text-sm text-muted-foreground ml-auto">{pledges.length}件</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">支援者</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">リターン</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">金額</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">ステータス</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">日時</th>
              </tr>
            </thead>
            <tbody>
              {pledges.map((pledge: any) => {
                const status = statusConfig[pledge.payment_status] ?? { label: pledge.payment_status, className: "bg-gray-100" }
                return (
                  <tr key={pledge.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">#{pledge.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground">
                        {pledge.is_anonymous ? "匿名" : (pledge.supporter_name || "未設定")}
                      </p>
                      <p className="text-xs text-muted-foreground">{pledge.supporter_email}</p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">
                      {pledge.reward_title ?? "応援支援"}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-ireland-green">
                      {formatYen(pledge.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={`text-xs border ${status.className}`}>{status.label}</Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                      {format(new Date(pledge.created_at), "M/d HH:mm", { locale: ja })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {pledges.length === 0 && (
            <p className="text-center py-10 text-muted-foreground">支援データがありません。</p>
          )}
        </div>
      </div>
    </div>
  )
}
