import type { Campaign } from "@/lib/db"

interface Props {
  campaign: Campaign
}

export default function CampaignDescription({ campaign }: Props) {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <h2 className="text-xl font-bold text-foreground mb-5 pb-4 border-b border-border">
        プロジェクト詳細
      </h2>

      <div className="space-y-4 text-foreground/80 leading-relaxed text-sm">
        <p>
          このプロジェクトは<strong className="text-foreground">「アイリッシュ盆踊り」</strong>を軸に、日本とアイルランドの文化を融合させたグリーン アイルランド フェスティバル2026の開催を実現するためのクラウドファンディングです。
        </p>
        <p>
          アイリッシュ盆踊りとは、アイルランドの伝統音楽・ダンスと日本の盆踊りを融合した新しい文化です。SNSで累計1,000万再生を超え、日本中・世界で話題となっています。
        </p>
        <p>
          2026年3月15日（日）に東京で開催するグリーン アイルランド フェスティバル2026では、アイリッシュ盆踊りのステージパフォーマンスをはじめ、アイルランドの伝統音楽・ダンス・食文化を体感できるイベントを予定しています。
        </p>

        <div className="mt-6 p-5 bg-ireland-light rounded-xl border border-border">
          <h3 className="font-bold text-foreground mb-3">出演者紹介</h3>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-1 rounded-full bg-ireland-green shrink-0" />
              <div>
                <p className="font-bold text-foreground text-sm">孝藤右近</p>
                <p className="text-xs text-muted-foreground">創作日本舞踊孝藤流二代目・剣舞右近流家元・東京大学舞踊講師。約100年続く伝統を受け継ぎながら、アイリッシュ盆踊りを世界に発信する振付家・舞踊家。</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-1 rounded-full bg-ireland-gold shrink-0" />
              <div>
                <p className="font-bold text-foreground text-sm">小松大</p>
                <p className="text-xs text-muted-foreground">日本を代表するフィドル奏者。「アイリッシュ盆踊り」の楽曲で累計1,000万再生を達成。アイルランド音楽と日本文化の橋渡し役として活躍中。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 資金の使い道 */}
      <div className="mt-6 p-5 bg-ireland-light rounded-xl border border-border">
        <h3 className="font-bold text-foreground mb-4">資金の使い道</h3>
        <div className="space-y-3">
          {[
            { label: "アーティスト出演費・招聘費用", percent: 40, color: "bg-ireland-green" },
            { label: "会場費・設備費", percent: 25, color: "bg-ireland-gold" },
            { label: "広報・マーケティング費", percent: 15, color: "bg-primary/60" },
            { label: "リターン製作・送料", percent: 15, color: "bg-secondary/70" },
            { label: "手数料・その他運営費", percent: 5, color: "bg-muted-foreground/40" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-foreground/80">{item.label}</span>
                <span className="font-bold text-foreground">{item.percent}%</span>
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color}`}
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* イベント概要 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: "開催日", value: "2026年3月15日（日）" },
          { label: "会場", value: "東京都内（詳細後日）" },
          { label: "支援締切", value: "2026年3月18日 23:59" },
        ].map((item) => (
          <div key={item.label} className="p-4 bg-muted rounded-xl text-center">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className="font-bold text-xs text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
