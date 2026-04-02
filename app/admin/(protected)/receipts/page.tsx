import sql from "@/lib/db"
import { Receipt, Settings } from "lucide-react"
import ReceiptManagement from "@/components/admin/ReceiptManagement"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function ReceiptsPage() {
  let receipts: any[] = []

  try {
    const receiptsResult = await sql`
      SELECT r.*, p.supporter_email
      FROM receipts r
      LEFT JOIN pledges p ON p.id = r.pledge_id
      ORDER BY r.created_at DESC
      LIMIT 500
    `
    receipts = receiptsResult
  } catch (err) {
    console.error("[receipts] Error fetching:", err)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-brand-green" />
            </div>
            <h1 className="text-2xl font-black text-foreground">領収書管理</h1>
          </div>
          <p className="text-sm text-muted-foreground">発行済み領収書の一覧・メール送信・再発行の管理。</p>
        </div>
        <Link
          href="/admin/settings#receipt-settings"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="領収書設定"
        >
          <Settings className="w-4 h-4" />
          設定
        </Link>
      </div>

      <ReceiptManagement receipts={receipts as any} />
    </div>
  )
}
