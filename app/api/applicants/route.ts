import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const prefecture = searchParams.get('prefecture') ?? ''
  const venue = searchParams.get('venue') ?? ''

  let applicants

  if (search || prefecture || venue) {
    const searchPattern = `%${search}%`
    applicants = await sql`
      SELECT * FROM applicants
      WHERE (
        ${search === '' ? sql`TRUE` : sql`(
          real_name ILIKE ${searchPattern}
          OR line_username ILIKE ${searchPattern}
          OR email ILIKE ${searchPattern}
          OR phone ILIKE ${searchPattern}
        )`}
      )
      AND (${prefecture === '' ? sql`TRUE` : sql`prefecture = ${prefecture}`})
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
      ORDER BY applied_at DESC
    `
  } else {
    applicants = await sql`
      SELECT * FROM applicants ORDER BY applied_at DESC
    `
  }

  return NextResponse.json(applicants)
}

// PATCH: 個別フィールド更新（purchase_status等）
export async function PATCH(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, purchase_status } = body as { id: number; purchase_status: string }

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    await sql`UPDATE applicants SET purchase_status = ${purchase_status ?? null} WHERE id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE: 個別削除（?ids=1,2,3）または全件削除（?all=true）
export async function DELETE(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const all = searchParams.get('all') === 'true'
  const idsParam = searchParams.get('ids') ?? ''

  if (all) {
    try {
      await sql`DELETE FROM applicants`
      return NextResponse.json({ deleted: 'all' })
    } catch (err) {
      console.error('[v0] DELETE all error:', err)
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  const ids = idsParam.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
  if (ids.length === 0) {
    return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
  }
  try {
    await sql`DELETE FROM applicants WHERE id = ANY(${ids})`
    return NextResponse.json({ deleted: ids.length })
  } catch (err) {
    console.error('[v0] DELETE ids error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
