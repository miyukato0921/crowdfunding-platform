import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const receipts = await sql`
    SELECT * FROM receipts ORDER BY issued_date DESC, created_at DESC
  `
  return NextResponse.json(receipts)
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    supporter_name,
    amount,
    proviso,
    issued_date,
    issuer_name,
    issuer_address,
    notes,
  } = body

  if (!supporter_name || !amount) {
    return NextResponse.json(
      { error: "supporter_name and amount are required" },
      { status: 400 }
    )
  }

  // 領収書番号生成
  const today = new Date().toISOString().split("T")[0].replace(/-/g, "")
  const countToday = await sql`
    SELECT COUNT(*) as count FROM receipts
    WHERE receipt_number LIKE ${today + "%"}
  `
  const number = countToday[0]?.count ?? 0
  const receipt_number = `GIF-${today}-${String(number + 1).padStart(4, "0")}`
  const download_token = crypto.randomBytes(16).toString("hex")

  const result = await sql`
    INSERT INTO receipts (
      receipt_number,
      supporter_name,
      amount,
      proviso,
      issued_date,
      issuer_name,
      issuer_address,
      download_token,
      notes
    ) VALUES (
      ${receipt_number},
      ${supporter_name},
      ${amount},
      ${proviso || "クラウドファンディング支援金として"},
      ${issued_date || new Date().toISOString().split("T")[0]},
      ${issuer_name},
      ${issuer_address || null},
      ${download_token},
      ${notes || null}
    )
    RETURNING *
  `

  return NextResponse.json(result[0])
}
