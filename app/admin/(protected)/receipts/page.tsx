import sql from "@/lib/db"
import { Receipt, Copy, Check } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ReceiptsPage() {
  let receipts: any[] = []
  let pledges: any[] = []

  try {
    const receiptsResult = await sql`
      SELECT r.* FROM receipts r
      ORDER BY r.created_at DESC
      LIMIT 100
    `
    receipts = receiptsResult

    const pledgesResult = await sql`
      SELECT p.id, p.supporter_name, p.supporter_email, p.amount, p.payment_status, p.created_at
      FROM pledges p
      WHERE p.payment_status = 'completed'
      AND NOT EXISTS (SELECT 1 FROM receipts WHERE pledge_id = p.id)
      ORDER BY p.created_at DESC
      LIMIT 50
    `
    pledges = pledgesResult
  } catch (err) {
    console.error("[v0] Error fetching receipts:", err)
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
        <p className="text-sm text-muted-foreground">発行済み領収書の一覧・管理。</p>
      </div>

      <div className="space-y-8">
        {/* 発行済み領収書 */}
        <div>
          <h2 className="text-lg font-bold mb-4">発行済み領収書</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold">領収書番号</th>
                    <th className="text-left px-4 py-3 font-bold">宛名</th>
                    <th className="text-right px-4 py-3 font-bold">金額</th>
                    <th className="text-left px-4 py-3 font-bold">発行日</th>
                    <th className="text-left px-4 py-3 font-bold">ダウンロードリンク</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length > 0 ? (
                    receipts.map((r: any) => (
                      <tr key={r.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3 font-mono text-xs">{r.receipt_number}</td>
                        <td className="px-4 py-3">{r.supporter_name}</td>
                        <td className="px-4 py-3 text-right font-mono">¥{Number(r.amount).toLocaleString("ja-JP")}</td>
                        <td className="px-4 py-3 text-xs">{r.issued_date}</td>
                        <td className="px-4 py-3">
                          <code className="bg-muted px-2 py-1 rounded text-xs">/api/receipts/{r.download_token}</code>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">領収書はまだ発行されていません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 領収書未発行の支援者 */}
        {pledges.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-4">領収書未発行の支援者（クイック発行）</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold">宛名</th>
                      <th className="text-left px-4 py-3 font-bold">メール</th>
                      <th className="text-right px-4 py-3 font-bold">金額</th>
                      <th className="text-left px-4 py-3 font-bold">支援日</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pledges.map((p: any) => (
                      <tr key={p.id} className="border-b border-border hover:bg-muted/50">
                        <td className="px-4 py-3">{p.supporter_name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{p.supporter_email}</td>
                        <td className="px-4 py-3 text-right font-mono">¥{Number(p.amount).toLocaleString("ja-JP")}</td>
                        <td className="px-4 py-3 text-xs">{new Date(p.created_at).toLocaleDateString("ja-JP")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">※ 領収書の発行機能は管理画面で設定後、実装可能です</p>
          </div>
        )}
      </div>
    </div>
  )
}
