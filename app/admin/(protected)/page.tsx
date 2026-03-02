import sql from "@/lib/db"
import { formatYen, calcProgress, calcDaysLeft } from "@/lib/utils"
import { TrendingUp, Users, Target, Clock, CreditCard, ShoppingBag, CheckCircle2, AlertCircle } from "lucide-react"
import type { Campaign } from "@/lib/db"
import AdminRecentPledges from "@/components/admin/AdminRecentPledges"
import AdminFundingChart from "@/components/admin/AdminFundingChart"

async function getDashboardData() {
  const campaigns = await sql<Campaign[]>`SELECT * FROM campaigns ORDER BY id LIMIT 1`
  const campaign = campaigns[0]

  const pledgeStats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE payment_status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE payment_status = 'pending') as pending_count,
      COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as total_revenue,
      COUNT(*) as total_pledges
    FROM pledges
    WHERE campaign_id = ${campaign?.id ?? 0}
  `
  const productStats = await sql`
    SELECT COUNT(*) as total_products, COUNT(*) FILTER (WHERE is_active = true) as active_products
    FROM products
  `
  const recentPledges = await sql`
    SELECT p.*, rt.title as reward_title
    FROM pledges p
    LEFT JOIN reward_tiers rt ON rt.id = p.reward_tier_id
    WHERE p.campaign_id = ${campaign?.id ?? 0}
    ORDER BY p.created_at DESC
    LIMIT 8
  `
  const dailyStats = await sql`
    SELECT
      DATE(created_at) as date,
      COALESCE(SUM(amount) FILTER (WHERE payment_status = 'completed'), 0) as daily_amount,
      COUNT(*) FILTER (WHERE payment_status = 'completed') as daily_count
    FROM pledges
    WHERE campaign_id = ${campaign?.id ?? 0}
      AND created_at >= NOW() - INTERVAL '14 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `

  return { campaign, pledgeStats: pledgeStats[0], productStats: productStats[0], recentPledges, dailyStats }
}

export default async function AdminDashboard() {
  const { campaign, pledgeStats, productStats, recentPledges, dailyStats } = await getDashboardData()

  if (!campaign) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">キャンペーンが見つかりません。</p>
      </div>
    )
  }

  const progress = calcProgress(campaign.current_amount, campaign.goal_amount)
  const daysLeft = calcDaysLeft(campaign.end_date)

  const stats = [
    {
      label: "総支援額",
      value: formatYen(campaign.current_amount),
      icon: TrendingUp,
      color: "text-ireland-green",
      bg: "bg-ireland-green/10",
      sub: `目標の${progress}%達成`,
    },
    {
      label: "支援者数",
      value: `${campaign.supporter_count}人`,
      icon: Users,
      color: "text-ireland-gold",
      bg: "bg-ireland-gold/10",
      sub: `完了：${pledgeStats?.completed_count ?? 0}件`,
    },
    {
      label: "残り日数",
      value: `${daysLeft}日`,
      icon: Clock,
      color: "text-blue-500",
      bg: "bg-blue-50",
      sub: `目標 ${formatYen(campaign.goal_amount)}`,
    },
    {
      label: "商品数",
      value: `${productStats?.active_products ?? 0}点`,
      icon: ShoppingBag,
      color: "text-purple-500",
      bg: "bg-purple-50",
      sub: `総計 ${productStats?.total_products ?? 0}点`,
    },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">{campaign.title}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-card rounded-2xl border border-border p-5">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Target className="w-5 h-5 text-ireland-green" />
            目標達成状況
          </h2>
          <span className="text-sm font-bold text-ireland-green">{progress}%</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, oklch(0.42 0.15 152), oklch(0.55 0.16 152))",
            }}
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatYen(campaign.current_amount)} 集まっています</span>
          <span>目標 {formatYen(campaign.goal_amount)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4">直近14日間の支援推移</h2>
          <AdminFundingChart data={dailyStats as any[]} />
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-ireland-green" />
            決済状況
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">完了</span>
              </div>
              <span className="font-bold text-green-700">{pledgeStats?.completed_count ?? 0}件</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">保留中</span>
              </div>
              <span className="font-bold text-yellow-700">{pledgeStats?.pending_count ?? 0}件</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card rounded-2xl border border-border p-6">
        <h2 className="font-bold text-foreground mb-4">最近の支援</h2>
        <AdminRecentPledges pledges={recentPledges as any[]} />
      </div>
    </div>
  )
}
