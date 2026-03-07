import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const receipt = await sql`
    SELECT * FROM receipts WHERE download_token = ${token}
  `

  if (!receipt[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  // 記録
  await sql`
    UPDATE receipts SET
      downloaded_at = NOW()
    WHERE download_token = ${token}
  `

  // JSON形式で返す
  return NextResponse.json({
    receipt_number: receipt[0].receipt_number,
    supporter_name: receipt[0].supporter_name,
    amount: receipt[0].amount,
    proviso: receipt[0].proviso,
    issued_date: receipt[0].issued_date,
    issuer_name: receipt[0].issuer_name,
    issuer_address: receipt[0].issuer_address,
  })
}
