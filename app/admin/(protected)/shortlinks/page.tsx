import sql from "@/lib/db"
import ShortlinksManagement from "@/components/admin/ShortlinksManagement"
import { Link2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ShortlinksPage() {
  const links = await sql`
    SELECT s.*,
      (SELECT COUNT(*)::int FROM shortlink_clicks WHERE shortlink_id = s.id) as click_count,
      (SELECT COUNT(*)::int FROM shortlink_clicks WHERE shortlink_id = s.id AND clicked_at > NOW() - INTERVAL '24 hours') as clicks_24h
    FROM shortlinks s ORDER BY s.created_at DESC
  `
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-ireland-green" />
          </div>
          <h1 className="text-2xl font-black text-foreground">リンクショートカット</h1>
        </div>
        <p className="text-sm text-muted-foreground">短縮URLを発行し、端末ごとに異なるURLへ振り分け。クリック数も自動計測。</p>
      </div>
      <ShortlinksManagement initialLinks={links as any} />
    </div>
  )
}
