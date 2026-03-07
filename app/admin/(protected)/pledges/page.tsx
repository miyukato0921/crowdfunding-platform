import sql from "@/lib/db"
import { CreditCard } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PledgesPage() {
  const pledges = await sql`
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-ireland-green" />
            </div>
            <h1 className="text-2xl font-black text-foreground">支援者管理</h1>
          </div>
          <p className="text-muted-foreground mt-1">支援の確認・ステータス変更・発送管理</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2">完了</div>
          <div className="text-3xl font-black text-ireland-green">{stats.count_completed || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2">合計金額</div>
          <div className="text-3xl font-black text-ireland-green">¥{Number(stats.total_completed || 0).toLocaleString("ja-JP")}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2">保留中</div>
          <div className="text-3xl font-black text-amber-600">{stats.count_pending || 0}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-xs text-muted-foreground mb-2">発送待ち</div>
          <div className="text-3xl font-black text-blue-600">{stats.count_shipping || 0}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-bold">宛名</th>
                <th className="text-left px-4 py-3 font-bold">メール</th>
                <th className="text-left px-4 py-3 font-bold">リターン</th>
                <th className="text-left px-4 py-3 font-bold">キャンペーン</th>
                <th className="text-right px-4 py-3 font-bold">金額</th>
                <th className="text-left px-4 py-3 font-bold">決済</th>
                <th className="text-left px-4 py-3 font-bold">配送</th>
                <th className="text-left px-4 py-3 font-bold">日時</th>
              </tr>
            </thead>
            <tbody>
              {pledges.map((p: any) => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                  <td className="px-4 py-3">{p.supporter_name || "匿名"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.supporter_email || "—"}</td>
                  <td className="px-4 py-3 text-xs">{p.reward_title || "—"}</td>
                  <td className="px-4 py-3 text-xs">{p.campaign_title || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">¥{Number(p.amount).toLocaleString("ja-JP")}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${p.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.payment_status === 'completed' ? '完了' : '保留中'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-lg ${p.shipping_status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {p.shipping_status === 'shipped' ? '発送済' : '待機中'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ja-JP")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
