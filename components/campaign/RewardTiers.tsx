"use client"

import Image from "next/image"
import type { RewardTier } from "@/lib/db"
import { formatYen } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Users, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  rewards: RewardTier[]
  campaignId: number
}

function getTierColor(index: number) {
  const colors = [
    { bg: "bg-amber-700/10", border: "border-amber-700/30", badge: "bg-amber-700 text-white" },
    { bg: "bg-slate-400/10", border: "border-slate-400/30", badge: "bg-slate-500 text-white" },
    { bg: "bg-ireland-gold/10", border: "border-ireland-gold/30", badge: "bg-ireland-gold text-ireland-dark" },
  ]
  return colors[index % colors.length]
}

export default function RewardTiers({ rewards, campaignId }: Props) {
  const router = useRouter()

  const handleSupport = (rewardId: number, amount: number) => {
    router.push(`/checkout?campaign_id=${campaignId}&reward_id=${rewardId}&amount=${amount}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">リターンを選ぶ</h2>

      {rewards.map((reward, index) => {
        const color = getTierColor(index)
        const isSoldOut = reward.limit_count !== null && reward.claimed_count >= reward.limit_count
        const remaining = reward.limit_count !== null ? reward.limit_count - reward.claimed_count : null

        return (
          <div
            key={reward.id}
            className={`rounded-2xl border-2 p-5 transition-shadow hover:shadow-md ${color.bg} ${color.border} ${isSoldOut ? "opacity-60" : ""}`}
          >
            {reward.image_url && (
              <div className="relative h-36 w-full rounded-xl overflow-hidden mb-4">
                <Image
                  src={reward.image_url}
                  alt={reward.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <Badge className={`text-xs mb-1.5 ${color.badge} border-0`}>
                  {reward.title}
                </Badge>
                <p className="text-2xl font-black text-foreground">
                  {formatYen(reward.amount)}
                </p>
              </div>
              {isSoldOut && (
                <Badge variant="secondary" className="shrink-0 text-xs">完売</Badge>
              )}
            </div>

            <p className="text-sm text-foreground/75 leading-relaxed mb-4">
              {reward.description}
            </p>

            <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
              {reward.delivery_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>お届け：{reward.delivery_date}</span>
                </div>
              )}
              {remaining !== null && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>残り{remaining}個</span>
                </div>
              )}
              {reward.claimed_count > 0 && (
                <div className="flex items-center gap-1 text-ireland-green">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{reward.claimed_count}人が支援中</span>
                </div>
              )}
            </div>

            <Button
              className="w-full bg-ireland-green hover:bg-ireland-green/90 text-white font-bold rounded-xl"
              disabled={isSoldOut}
              onClick={() => handleSupport(reward.id, reward.amount)}
            >
              {isSoldOut ? "完売しました" : "このリターンで支援する"}
              {!isSoldOut && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        )
      })}

      {/* Custom amount support */}
      <div className="rounded-2xl border-2 border-dashed border-ireland-green/40 p-5 bg-ireland-green/5">
        <p className="font-bold text-foreground mb-1">金額を自由に決めて支援</p>
        <p className="text-sm text-muted-foreground mb-4">リターンなしで応援することもできます。</p>
        <Button
          variant="outline"
          className="w-full border-ireland-green text-ireland-green hover:bg-ireland-green hover:text-white font-bold rounded-xl"
          onClick={() => window.location.href = `/checkout?campaign_id=${campaignId}&custom=true`}
        >
          応援支援する
        </Button>
      </div>
    </div>
  )
}
