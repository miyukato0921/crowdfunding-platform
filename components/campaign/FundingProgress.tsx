"use client"

import { useEffect, useState } from "react"
import type { Campaign } from "@/lib/db"
import { calcProgress, calcDaysLeft, formatYen } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Users, Clock, TrendingUp, Target } from "lucide-react"

interface Props {
  campaign: Campaign
}

export default function FundingProgress({ campaign }: Props) {
  const [current, setCurrent] = useState(campaign.current_amount)
  const [supporters, setSupporters] = useState(campaign.supporter_count)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    // Poll for real-time updates every 10 seconds
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaign.id}/stats`)
        if (res.ok) {
          const data = await res.json()
          setCurrent(data.current_amount)
          setSupporters(data.supporter_count)
        }
      } catch {
        // Silently ignore polling errors
      }
    }, 10000)

    // Animate progress bar on mount
    setTimeout(() => setAnimated(true), 100)

    return () => clearInterval(interval)
  }, [campaign.id])

  const progress = calcProgress(current, campaign.goal_amount)
  const daysLeft = calcDaysLeft(campaign.end_date)
  const remaining = campaign.goal_amount - current

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      {/* Amount display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-4xl font-black text-ireland-green tabular-nums">
            {formatYen(current)}
          </span>
          <span className="text-muted-foreground text-sm">
            目標 {formatYen(campaign.goal_amount)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <Target className="w-3.5 h-3.5 text-ireland-gold" />
          <span className="text-sm text-muted-foreground">
            あと <span className="font-bold text-foreground">{formatYen(remaining)}</span> で達成
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span className="font-bold text-ireland-green">{progress}% 達成</span>
          <span>{formatYen(campaign.goal_amount)}</span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: animated ? `${progress}%` : "0%",
              background: "linear-gradient(90deg, oklch(0.42 0.15 152), oklch(0.55 0.16 152))",
            }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-4 h-4 text-ireland-green" />
            <span className="text-2xl font-black text-foreground tabular-nums">{progress}%</span>
          </div>
          <p className="text-xs text-muted-foreground">達成率</p>
        </div>
        <div className="text-center border-x border-border">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-4 h-4 text-ireland-gold" />
            <span className="text-2xl font-black text-foreground tabular-nums">{supporters}</span>
          </div>
          <p className="text-xs text-muted-foreground">支援者数</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-ireland-green" />
            <span className="text-2xl font-black text-foreground tabular-nums">{daysLeft}</span>
          </div>
          <p className="text-xs text-muted-foreground">残り日数</p>
        </div>
      </div>
    </div>
  )
}
