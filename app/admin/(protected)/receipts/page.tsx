import sql from "@/lib/db"
import ReceiptManagement from "@/components/admin/ReceiptManagement"
import { Receipt } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ReceiptsPage() {
  const receipts = await sql`
    SELECT r.*, p.supporter_email
    FROM receipts r LEFT JOIN pledges p ON p.id = r.pledge_id
    ORDER BY r.created_at DESC
  `
  const templates = await sql`SELECT * FROM receipt_templates WHERE is_default = true LIMIT 1`
  const pledges = await sql`
    SELECT p.id, p.supporter_name, p.supporter_email, p.amount, p.payment_status, p.created_at,
      (SELECT receipt_number FROM receipts WHERE pledge_id = p.id LIMIT 1) as existing_receipt
    FROM pledges p WHERE p.payment_status = 'completed'
    ORDER BY p.created_at DESC
  `

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-ireland-green" />
          </div>
          <h1 className="text-2xl font-black text-foreground">領収書管理</h1>
        </div>
        <p className="text-sm text-muted-foreground">領収書の発行・編集・メール送信・CSV出力を管理します。</p>
      </div>
      <ReceiptManagement
        initialReceipts={receipts as any}
        template={templates[0] as any ?? null}
        pledges={pledges as any}
      />
    </div>
  )
}
