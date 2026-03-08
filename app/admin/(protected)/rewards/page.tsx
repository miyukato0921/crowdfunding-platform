import sql from "@/lib/db"
import { formatYen } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Edit, Gift, Users, Copy } from "lucide-react"
import RewardDuplicateButton from "@/components/admin/RewardDuplicateButton"

export default async function RewardsPage() {
  const rewards = await sql`
    SELECT rt.*, c.title as campaign_title
    FROM reward_tiers rt
    JOIN campaigns c ON c.id = rt.campaign_id
    ORDER BY rt.campaign_id, rt.sort_order
  `

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">リターン管理</h1>
          <p className="text-muted-foreground mt-1">支援リターンの作成・編集・管理</p>
        </div>
        <Button className="bg-ireland-green hover:bg-ireland-green/90 text-white rounded-xl" asChild>
          <Link href="/admin/rewards/new">
            <Plus className="w-4 h-4 mr-2" />
            新規リターン
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rewards.map((reward: any) => {
          const remaining = reward.limit_count !== null ? reward.limit_count - reward.claimed_count : null
          const isSoldOut = remaining !== null && remaining <= 0

          return (
            <div key={reward.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Badge variant={reward.is_active ? "default" : "secondary"} className="text-xs mb-2">
                    {reward.is_active ? "公開中" : "非公開"}
                  </Badge>
                  <h3 className="font-bold text-foreground">{reward.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{reward.campaign_title}</p>
                </div>
                <div className="flex items-center gap-1">
                  <RewardDuplicateButton id={reward.id} />
                  <Button variant="ghost" size="icon" className="rounded-xl" asChild>
                    <Link href={`/admin/rewards/${reward.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              <p className="text-2xl font-black text-ireland-green mb-3">{formatYen(reward.amount)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{reward.description}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{reward.claimed_count}人支援中</span>
                </div>
                {remaining !== null ? (
                  <span className={`text-xs font-bold ${isSoldOut ? "text-destructive" : "text-ireland-green"}`}>
                    {isSoldOut ? "完売" : `残り${remaining}個`}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">数量制限なし</span>
                )}
              </div>

              {remaining !== null && (
                <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ireland-green rounded-full"
                    style={{ width: `${Math.min((reward.claimed_count / reward.limit_count) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}

        {rewards.length === 0 && (
          <div className="col-span-full bg-card rounded-2xl border border-dashed border-border p-12 text-center">
            <Gift className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">リターンが登録されていません。</p>
          </div>
        )}
      </div>
    </div>
  )
}
