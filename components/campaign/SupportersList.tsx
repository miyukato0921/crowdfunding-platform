import { formatYen } from "@/lib/utils"
import { Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ja } from "date-fns/locale"

interface Supporter {
  supporter_name: string | null
  amount: number
  message: string | null
  is_anonymous: boolean
  created_at: string
}

interface Props {
  supporters: Supporter[]
}

export default function SupportersList({ supporters }: Props) {
  if (supporters.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">最初の支援者になりましょう！</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <h2 className="text-xl font-bold text-foreground mb-5 pb-4 border-b border-border flex items-center gap-2">
        <Heart className="w-5 h-5 text-ireland-gold fill-ireland-gold" />
        支援者の声
      </h2>
      <div className="space-y-4">
        {supporters.map((s, i) => (
          <div key={i} className="flex gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-ireland-green/20 flex items-center justify-center shrink-0 font-bold text-ireland-green text-sm">
              {s.is_anonymous ? "匿" : (s.supporter_name?.charAt(0) ?? "？")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="font-bold text-sm text-foreground">
                  {s.is_anonymous ? "匿名の支援者" : (s.supporter_name ?? "支援者")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: ja })}
                </span>
              </div>
              <span className="text-ireland-green font-bold text-sm">{formatYen(s.amount)}</span>
              {s.message && (
                <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{s.message}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
