import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { sendRawEmail } from "@/lib/email"
import { generateReceiptPDF } from "@/lib/receipt-generator"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

  const rows = await sql`
    SELECT r.*, p.supporter_email, rt.issuer_tel, rt.issuer_email as tpl_email
    FROM receipts r
    LEFT JOIN pledges p ON p.id = r.pledge_id
    LEFT JOIN receipt_templates rt ON rt.id = r.template_id
    WHERE r.id = ${Number(id)}
  `
  const receipt = rows[0] as any
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const email = receipt.supporter_email
  if (!email) return NextResponse.json({ error: "メールアドレスが見つかりません（支援と紐づけてください）" }, { status: 400 })

  // Generate PDF
  const pdf = await generateReceiptPDF({
    receipt_number: receipt.receipt_number,
    supporter_name: receipt.supporter_name,
    amount: Number(receipt.amount),
    proviso: receipt.proviso,
    issued_date: receipt.issued_date,
    issuer_name: receipt.issuer_name,
    issuer_address: receipt.issuer_address,
    issuer_tel: receipt.issuer_tel,
    issuer_email: receipt.tpl_email,
    reissued: receipt.reissued,
  })

  await sendRawEmail({
    to: email,
    subject: `【Green Ireland Festival】領収書（${receipt.receipt_number}）`,
    text: `${receipt.supporter_name} 様\n\nGreen Ireland Festivalへのご支援ありがとうございます。\n領収書をPDFにて添付いたします。\n\n領収書番号: ${receipt.receipt_number}\n金額: ¥${Number(receipt.amount).toLocaleString()}\n但し書き: ${receipt.proviso}\n\n${receipt.issuer_name}`,
    html: `<p>${receipt.supporter_name} 様</p><p>Green Ireland Festivalへのご支援ありがとうございます。<br>領収書をPDFにて添付いたします。</p><table style="border-collapse:collapse;margin:16px 0"><tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">領収書番号</td><td style="padding:8px 12px;border:1px solid #ddd">${receipt.receipt_number}</td></tr><tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">金額</td><td style="padding:8px 12px;border:1px solid #ddd">¥${Number(receipt.amount).toLocaleString()}</td></tr><tr><td style="padding:8px 12px;border:1px solid #ddd;font-weight:bold">但し書き</td><td style="padding:8px 12px;border:1px solid #ddd">${receipt.proviso}</td></tr></table><p style="font-size:12px;color:#666">※ 領収書はPDFファイルとして添付されています。</p><p>${receipt.issuer_name}</p>`,
    attachments: [{ filename: pdf.filename, content: pdf.buffer, contentType: "application/pdf" }],
  })

  await sql`UPDATE receipts SET email_sent = true, email_sent_at = NOW() WHERE id = ${Number(id)}`
  return NextResponse.json({ success: true })
}
