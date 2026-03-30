import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendTemplateEmail } from "@/lib/email"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { receipt_id, send_email } = await req.json()
  if (!receipt_id) return NextResponse.json({ error: "receipt_id is required" }, { status: 400 })

  // Fetch original receipt
  const origRows = await sql`
    SELECT r.*, p.supporter_email
    FROM receipts r
    LEFT JOIN pledges p ON p.id = r.pledge_id
    WHERE r.id = ${receipt_id}
  `
  const orig = origRows[0] as any
  if (!orig) return NextResponse.json({ error: "領収書が見つかりません" }, { status: 404 })

  // Get template for numbering
  const templates = await sql`SELECT * FROM receipt_templates ORDER BY is_default DESC, id ASC LIMIT 1`
  const tpl = templates[0] as any
  if (!tpl) return NextResponse.json({ error: "テンプレートが未設定です" }, { status: 400 })

  // Atomically get and increment next_number
  const updated = await sql`
    UPDATE receipt_templates SET next_number = next_number + 1, updated_at = NOW()
    WHERE id = ${tpl.id} RETURNING next_number - 1 AS current_number
  `
  const currentNumber = (updated[0] as any).current_number
  const receiptNumber = `${tpl.prefix}-${String(currentNumber).padStart(6, "0")}`
  const downloadToken = crypto.randomBytes(32).toString("hex")

  // Create reissued receipt
  const result = await sql`
    INSERT INTO receipts (
      receipt_number, pledge_id, template_id, supporter_name, amount, proviso,
      issued_date, issuer_name, issuer_address, download_token, reissued, reissue_of, notes
    ) VALUES (
      ${receiptNumber}, ${orig.pledge_id}, ${tpl.id},
      ${orig.supporter_name}, ${orig.amount}, ${orig.proviso},
      ${new Date().toISOString().slice(0, 10)},
      ${tpl.issuer_name}, ${tpl.issuer_address || null},
      ${downloadToken}, true, ${receipt_id},
      ${"再発行（元: " + orig.receipt_number + "）"}
    ) RETURNING *
  `

  const newReceipt = result[0] as any

  // Send email if requested
  let emailSent = false
  if (send_email && orig.supporter_email) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
        || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://greenirelandfes.atouch.dev")
      const receiptUrl = `${baseUrl}/receipt/${downloadToken}`

      await sendTemplateEmail("receipt_notification", orig.supporter_email, {
        supporter_name: orig.supporter_name || "支援者",
        amount: `¥${Number(orig.amount).toLocaleString()}`,
        receipt_number: receiptNumber,
        receipt_url: receiptUrl,
      })
      await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE id = ${newReceipt.id}`
      emailSent = true
    } catch (err) {
      console.error("[receipts/reissue] Email failed:", err)
    }
  }

  return NextResponse.json({ receipt: newReceipt, email_sent: emailSent })
}
