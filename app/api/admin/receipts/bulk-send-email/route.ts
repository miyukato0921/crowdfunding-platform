import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendTemplateEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { receipt_ids } = await req.json()
  if (!Array.isArray(receipt_ids) || receipt_ids.length === 0) {
    return NextResponse.json({ error: "receipt_ids is required" }, { status: 400 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://greenirelandfes.atouch.dev")

  let sent = 0
  let failed = 0

  for (const receiptId of receipt_ids) {
    try {
      const rows = await sql`
        SELECT r.*, p.supporter_email
        FROM receipts r
        LEFT JOIN pledges p ON p.id = r.pledge_id
        WHERE r.id = ${receiptId}
      `
      const receipt = rows[0] as any
      if (!receipt || !receipt.supporter_email) { failed++; continue }

      const receiptUrl = `${baseUrl}/receipt/${receipt.download_token}`
      await sendTemplateEmail("receipt_notification", receipt.supporter_email, {
        supporter_name: receipt.supporter_name || "支援者",
        amount: `¥${Number(receipt.amount).toLocaleString()}`,
        receipt_number: receipt.receipt_number,
        receipt_url: receiptUrl,
      })

      await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE id = ${receiptId}`
      sent++
    } catch (err) {
      console.error(`[receipts/bulk-send-email] Failed for receipt ${receiptId}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
