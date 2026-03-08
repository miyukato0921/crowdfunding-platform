import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') // 'draft' | 'sent' | null

  const campaigns = statusFilter
    ? await sql`
        SELECT c.*, u.username as created_by_name
        FROM campaigns c LEFT JOIN admin_users u ON u.id = c.created_by
        WHERE c.status = ${statusFilter}
        ORDER BY c.created_at DESC`
    : await sql`
        SELECT c.*, u.username as created_by_name
        FROM campaigns c LEFT JOIN admin_users u ON u.id = c.created_by
        ORDER BY c.created_at DESC`

  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, message_body, email_subject, target_filter, delivery_type, target_ids, status } = body

  if (!title || !message_body) {
    return NextResponse.json({ error: 'タイトルとメッセージ本文は必須です' }, { status: 400 })
  }

  const type = delivery_type ?? 'line'
  const filter = target_filter ?? {}
  const ids: number[] | null = target_ids ?? null
  const campaignStatus = status ?? 'draft'

  // target_idsがあればその件数、なければフィルターで計算
  let totalTargets = 0
  if (ids && ids.length > 0) {
    totalTargets = ids.length
  } else {
    const venue = filter.venue ?? ''
    const prefecture = filter.prefecture ?? ''
    const countResult = await sql`
      SELECT COUNT(*) as count FROM applicants
      WHERE (${prefecture === '' ? sql`TRUE` : sql`prefecture = ${prefecture}`})
      AND (${venue === '' ? sql`TRUE` : sql`(
        CASE ${venue}
          WHEN 'yonago_524'    THEN yonago_524
          WHEN 'kumamoto_719'  THEN kumamoto_719
          WHEN 'nagasaki_801'  THEN nagasaki_801
          WHEN 'oita_802'      THEN oita_802
          WHEN 'shimane_1003'  THEN shimane_1003
          WHEN 'matsuyama_1011' THEN matsuyama_1011
          WHEN 'aomori_1017'   THEN aomori_1017
          ELSE NULL
        END IS NOT NULL
      )`})
    `
    totalTargets = parseInt(countResult[0].count, 10)
  }

  const result = await sql`
    INSERT INTO campaigns (title, message_body, email_subject, target_filter, delivery_type, created_by, total_targets, status, sent_count, target_ids, segment_filters)
    VALUES (
      ${title}, ${message_body}, ${email_subject ?? null},
      ${JSON.stringify(filter)}, ${type}, ${session.user_id},
      ${totalTargets}, ${campaignStatus}, 0,
      ${ids ? sql`${ids}` : null},
      ${filter ? JSON.stringify(filter) : null}
    ) RETURNING *
  `
  return NextResponse.json(result[0], { status: 201 })
}

// PATCH: update a draft campaign
export async function PATCH(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, title, message_body, email_subject, target_filter, delivery_type, target_ids } = body

  if (!id) return NextResponse.json({ error: 'IDは必須です' }, { status: 400 })

  const existing = await sql`SELECT * FROM campaigns WHERE id = ${id}`
  if (!existing[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing[0].status === 'sent') return NextResponse.json({ error: '送信済みのキャンペーンは編集できません' }, { status: 400 })

  const filter = target_filter ?? existing[0].target_filter ?? {}
  const ids: number[] | null = target_ids ?? existing[0].target_ids ?? null

  let totalTargets = 0
  if (ids && ids.length > 0) {
    totalTargets = ids.length
  } else {
    const venue = filter.venue ?? ''
    const prefecture = filter.prefecture ?? ''
    const countResult = await sql`
      SELECT COUNT(*) as count FROM applicants
      WHERE (${prefecture === '' ? sql`TRUE` : sql`prefecture = ${prefecture}`})
      AND (${venue === '' ? sql`TRUE` : sql`(
        CASE ${venue}
          WHEN 'yonago_524'    THEN yonago_524
          WHEN 'kumamoto_719'  THEN kumamoto_719
          WHEN 'nagasaki_801'  THEN nagasaki_801
          WHEN 'oita_802'      THEN oita_802
          WHEN 'shimane_1003'  THEN shimane_1003
          WHEN 'matsuyama_1011' THEN matsuyama_1011
          WHEN 'aomori_1017'   THEN aomori_1017
          ELSE NULL
        END IS NOT NULL
      )`})
    `
    totalTargets = parseInt(countResult[0].count, 10)
  }

  const result = await sql`
    UPDATE campaigns SET
      title = ${title ?? existing[0].title},
      message_body = ${message_body ?? existing[0].message_body},
      email_subject = ${email_subject ?? existing[0].email_subject},
      target_filter = ${JSON.stringify(filter)},
      delivery_type = ${delivery_type ?? existing[0].delivery_type},
      total_targets = ${totalTargets},
      target_ids = ${ids ? sql`${ids}` : null},
      segment_filters = ${JSON.stringify(filter)}
    WHERE id = ${id}
    RETURNING *
  `
  return NextResponse.json(result[0])
}

// DELETE: delete a draft campaign
export async function DELETE(req: NextRequest) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'IDは必須です' }, { status: 400 })

  await sql`DELETE FROM message_logs WHERE campaign_id = ${parseInt(id, 10)}`
  await sql`DELETE FROM campaigns WHERE id = ${parseInt(id, 10)}`
  return NextResponse.json({ deleted: true })
}
