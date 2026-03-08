import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  await sql`
    UPDATE receipts SET
      supporter_name = ${body.supporter_name},
      amount = ${body.amount},
      proviso = ${body.proviso},
      issued_date = ${body.issued_date},
      issuer_name = ${body.issuer_name},
      issuer_address = ${body.issuer_address || null},
      notes = ${body.notes || null},
      email_sent = ${body.email_sent ?? false},
      email_sent_at = ${body.email_sent ? new Date().toISOString() : null},
      updated_at = NOW()
    WHERE id = ${Number(id)}
  `

  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await sql`DELETE FROM receipts WHERE id = ${Number(id)}`

  return NextResponse.json({ success: true })
}
