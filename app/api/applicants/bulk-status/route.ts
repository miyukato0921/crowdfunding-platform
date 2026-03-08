import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { line_user_ids, purchase_status } = body as {
    line_user_ids: string[]
    purchase_status: string
  }

  if (!line_user_ids || line_user_ids.length === 0) {
    return NextResponse.json({ error: 'LINE IDが指定されていません' }, { status: 400 })
  }
  if (!purchase_status) {
    return NextResponse.json({ error: '購入状況が指定されていません' }, { status: 400 })
  }

  // 入力内の重複を自動除去
  const uniqueIds = [...new Set(line_user_ids.map((id: string) => id.trim()).filter(Boolean))]

  // 既存のLINE IDを確認
  const existing = await sql`
    SELECT line_user_id FROM applicants
    WHERE line_user_id = ANY(${uniqueIds})
  `
  const existingIds = new Set(existing.map((r: Record<string, string>) => r.line_user_id))
  const matched = uniqueIds.filter((id) => existingIds.has(id))
  const notFound = uniqueIds.filter((id) => !existingIds.has(id))

  // 一括更新
  let updated = 0
  if (matched.length > 0) {
    const result = await sql`
      UPDATE applicants
      SET purchase_status = ${purchase_status}
      WHERE line_user_id = ANY(${matched})
    `
    updated = result.count ?? matched.length
  }

  return NextResponse.json({ updated, not_found: notFound })
}
