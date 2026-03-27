import sql from "@/lib/db"
import { Receipt } from "lucide-react"
import ReceiptManagement from "@/components/admin/ReceiptManagement"

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
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-ireland-green" />
          </div>
          <h1 className="text-2xl font-black text-foreground">領収書管理</h1>
        </div>
        <p className="text-sm text-muted-foreground">発行済み領収書の一覧・メール送信・再発行の管理。</p>
      </div>

      <ReceiptManagement receipts={receipts as any} />
    </div>
  )
}
