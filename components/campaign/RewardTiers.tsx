"use client"

import Image from "next/image"
import type { RewardTier } from "@/lib/db"
import { formatYen } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Users, ChevronRight, Clock, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface Props {
  rewards: RewardTier[]
  campaignId: number
}

// リターンタイトルに基づいて特別な注意書きを返す
function getSpecialNote(title: string): string | null {
  if (title.includes("一緒に") || title.includes("ステージ")) {
    return "※3/13（金）12:00までのご支援が必要です"
  }
  if (title.includes("打ち上げ") || title.includes("パーティー")) {
    return "※数量限定：50名"
  }
  return null
}

// ティアのスタイルをインデックスで決める（上位→下位の順）
function getTierStyle(amount: number) {
  if (amount >= 20000) {
    return {
      bg: "bg-ireland-gold/8",
      border: "border-ireland-gold/50",
      badge: "bg-ireland-gold text-ireland-dark",
      btn: "bg-ireland-gold hover:bg-ireland-gold/90 text-ireland-dark",
      label: "プレミアム",
    }
  }
  if (amount >= 10000) {
    return {
      bg: "bg-ireland-green/8",
      border: "border-ireland-green/40",
      badge: "bg-ireland-green text-white",
      btn: "bg-ireland-green hover:bg-ireland-green/90 text-white",
      label: "スタンダード",
    }
  }
  if (amount >= 5000) {
    return {
      bg: "bg-primary/5",
      border: "border-primary/30",
      badge: "bg-primary/80 text-white",
      btn: "bg-primary/80 hover:bg-primary text-white",
      label: "サポーター",
    }
  }
  return {
    bg: "bg-muted/60",
    border: "border-border",
    badge: "bg-muted-foreground/60 text-white",
    btn: "bg-muted-foreground/70 hover:bg-muted-foreground text-white",
    label: "エントリー",
  }
}

export default function RewardTiers({ rewards, campaignId }: Props) {
  const router = useRouter()

  const handleSupport = (rewardId: number, amount: number) => {
    router.push(`/checkout?campaign_id=${campaignId}&reward_id=${rewardId}&amount=${amount}`)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">リターンを選ぶ</h2>

      {rewards.map((reward) => {
        const style = getTierStyle(reward.amount)
        const isSoldOut = reward.limit_count !== null && reward.claimed_count >= reward.limit_count
        const remaining = reward.limit_count !== null ? reward.limit_count - reward.claimed_count : null
        const specialNote = getSpecialNote(reward.title)

        return (
          <div
            key={reward.id}
            className={`rounded-2xl border-2 p-5 transition-shadow hover:shadow-md ${style.bg} ${style.border} ${isSoldOut ? "opacity-60" : ""}`}
          >
            {reward.image_url && (
              <div className="relative h-40 w-full rounded-xl overflow-hidden mb-4">
                <Image
                  src={reward.image_url}
                  alt={reward.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            {/* ヘッダー */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge className={`text-xs border-0 ${style.badge}`}>
                    {style.label}
                  </Badge>
                  {isSoldOut && (
                    <Badge variant="secondary" className="text-xs">完売</Badge>
                  )}
                  {!isSoldOut && remaining !== null && remaining <= 10 && (
                    <Badge className="text-xs bg-red-500 text-white border-0">
                      残り{remaining}名
                    </Badge>
                  )}
                </div>
                <p className="text-xl font-black text-foreground">
                  {formatYen(reward.amount)}
                </p>
              </div>
            </div>

            {/* タイトル */}
            <p className="font-bold text-foreground text-sm mb-2">{reward.title}</p>

            {/* 説明 */}
            <p className="text-sm text-foreground/75 leading-relaxed mb-4">
              {reward.description}
            </p>

            {/* メタ情報 */}
            <div className="flex flex-wrap gap-3 mb-4 text-xs text-muted-foreground">
              {reward.delivery_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>お届け：{reward.delivery_date}</span>
                </div>
              )}
              {remaining !== null && !isSoldOut && (
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>残り{remaining}名（定員{reward.limit_count}名）</span>
                </div>
              )}
              {reward.claimed_count > 0 && (
                <div className="flex items-center gap-1 text-ireland-green">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{reward.claimed_count}人が支援中</span>
                </div>
              )}
            </div>

            {/* 特別注意書き */}
            {specialNote && !isSoldOut && (
              <div className="flex items-start gap-2 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 font-medium">{specialNote}</p>
              </div>
            )}

            <Button
              className={`w-full font-bold rounded-xl ${style.btn}`}
              disabled={isSoldOut}
              onClick={() => handleSupport(reward.id, reward.amount)}
            >
              {isSoldOut ? "完売しました" : "このリターンで支援する"}
              {!isSoldOut && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        )
      })}

      {/* 自由金額支援 */}
      <div className="rounded-2xl border-2 border-dashed border-ireland-green/40 p-5 bg-ireland-green/5">
        <div className="flex items-start gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-ireland-green mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-foreground text-sm">金額を自由に決めて応援</p>
            <p className="text-xs text-muted-foreground mt-0.5">リターンなしでも応援できます。</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full border-ireland-green text-ireland-green hover:bg-ireland-green hover:text-white font-bold rounded-xl"
          onClick={() => router.push(`/checkout?campaign_id=${campaignId}&custom=true`)}
        >
          応援支援する
        </Button>
      </div>
    </div>
  )
}
