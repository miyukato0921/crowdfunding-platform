import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_session")?.value
  if (!token) return false
  const session = await getAdminSession(token)
  return !!session
}

// PATCH: 支援レコード更新（支払ステータス・発送ステータス・発送先情報）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const {
    payment_status,
    shipping_status,
    shipping_name,
    shipping_postal_code,
    shipping_address,
    shipping_phone,
  } = body

  await sql`
    UPDATE pledges SET
      payment_status    = COALESCE(${payment_status ?? null}, payment_status),
      shipping_status   = COALESCE(${shipping_status ?? null}, shipping_status),
      shipping_name     = COALESCE(${shipping_name ?? null}, shipping_name),
      shipping_postal_code = COALESCE(${shipping_postal_code ?? null}, shipping_postal_code),
      shipping_address  = COALESCE(${shipping_address ?? null}, shipping_address),
      shipping_phone    = COALESCE(${shipping_phone ?? null}, shipping_phone),
      updated_at        = NOW()
    WHERE id = ${id}
  `

  return NextResponse.json({ success: true })
}

// DELETE: 支援レコード削除（キャンペーン集計も戻す）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // 削除前に支援情報を取得してキャンペーン集計を戻す
  const pledgeRows = await sql`
    SELECT id, campaign_id, amount, reward_tier_id, payment_status
    FROM pledges WHERE id = ${id}
  `
  const pledge = pledgeRows[0] as any
  if (!pledge) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await sql`DELETE FROM pledges WHERE id = ${id}`

  // 完了済みの場合のみ集計を戻す
  if (pledge.payment_status === "completed") {
    await sql`
      UPDATE campaigns SET
        current_amount  = GREATEST(0, current_amount - ${pledge.amount}),
        supporter_count = GREATEST(0, supporter_count - 1),
        updated_at      = NOW()
      WHERE id = ${pledge.campaign_id}
    `
    if (pledge.reward_tier_id) {
      await sql`
        UPDATE reward_tiers SET
          claimed_count = GREATEST(0, claimed_count - 1),
          updated_at    = NOW()
        WHERE id = ${pledge.reward_tier_id}
      `
    }
  }

  return NextResponse.json({ success: true })
}
