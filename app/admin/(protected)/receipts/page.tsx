import sql from "@/lib/db"
import ReceiptManagement from "@/components/admin/ReceiptManagement"
import { Receipt } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ReceiptsPage() {
  const receipts = await sql`
    SELECT * FROM receipts
    ORDER BY issued_date DESC, created_at DESC
    LIMIT 100
  `
  const templates = await sql`
    SELECT * FROM receipt_templates
    ORDER BY is_default DESC, created_at DESC
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
        <p className="text-sm text-muted-foreground">領収書テンプレートの設定と発行状況の管理。</p>
      </div>
      <ReceiptManagement initialReceipts={receipts as any} initialTemplates={templates as any} />
    </div>
  )
}
