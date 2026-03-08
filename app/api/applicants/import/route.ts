import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

// 枚数値を正規化：空・0系はNULL、それ以外はそのまま返す
function normalizeTickets(val: string | undefined): string | null {
  if (!val) return null
  const trimmed = val.trim()
  if (trimmed === '' || trimmed === '0' || trimmed === '0枚') return null
  return trimmed
}

// 電話番号の先頭に「0」を付与（既に「0」から始まる場合はそのまま）
function normalizePhone(val: string | undefined): string | null {
  if (!val) return null
  const trimmed = val.trim()
  if (trimmed === '') return null
  return trimmed.startsWith('0') ? trimmed : '0' + trimmed
}

export async function POST(req: NextRequest) {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { rows, mode } = body as {
    rows: Record<string, string>[]
    mode: 'preview' | 'import'
  }

  if (!rows || !Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows is required' }, { status: 400 })
  }

  // インポートデータ内の重複を除去（同じline_user_idが複数行ある場合、後の行で上書きマージ）
  const deduped: Record<string, Record<string, string>> = {}
  const dedupOrder: string[] = []
  for (const row of rows) {
    const key = row.line_user_id?.trim() || row.email?.trim() || `__nokey_${dedupOrder.length}`
    if (deduped[key]) {
      // 後の行のデータで上書き（空でない値のみ）
      for (const [k, v] of Object.entries(row)) {
        if (v && v.trim() !== '') {
          deduped[key][k] = v
        }
      }
    } else {
      deduped[key] = { ...row }
      dedupOrder.push(key)
    }
  }
  const dedupedRows = dedupOrder.map((k) => deduped[k])
  const skippedDuplicates = rows.length - dedupedRows.length

  // 既存レコードを一括取得（line_user_id / email で重複判定）
  const existing = await sql`SELECT id, line_user_id, email FROM applicants`
  const existingByLineId = new Set(
    existing.filter((r: Record<string, string>) => r.line_user_id).map((r: Record<string, string>) => r.line_user_id)
  )
  const existingByEmail = new Set(
    existing.filter((r: Record<string, string>) => r.email).map((r: Record<string, string>) => r.email)
  )

  const results = dedupedRows.map((row, index) => {
    const uid = row.line_user_id?.trim()
    const email = row.email?.trim()
    const isDuplicate = uid ? existingByLineId.has(uid) : (email ? existingByEmail.has(email) : false)
    return { index, row, isDuplicate }
  })

  if (mode === 'preview') {
    return NextResponse.json({
      total: dedupedRows.length,
      originalTotal: rows.length,
      skippedDuplicates,
      duplicates: results.filter((r) => r.isDuplicate).length,
      new: results.filter((r) => !r.isDuplicate).length,
      rows: results,
    })
  }

  // 実際のインポート（重複は常にUPSERT/UPDATE）
  let inserted = 0
  let updated = 0
  const errors: string[] = []

  for (const { row, isDuplicate } of results) {
    const uid = row.line_user_id?.trim() || null
    const lineUsername = row.line_username?.trim() || null

    try {
      if (isDuplicate) {
        // 既存レコードを更新（line_user_id またはemail で一致するものをUPDATE）
        const email = row.email?.trim() || null
        const whereClause = uid
          ? sql`line_user_id = ${uid}`
          : sql`email = ${email}`
        await sql`
          UPDATE applicants SET
            line_username   = COALESCE(${lineUsername}, line_username),
            line_user_id    = COALESCE(${uid}, line_user_id),
            applied_at      = COALESCE(${row.applied_at?.trim() || null}, applied_at),
            status          = COALESCE(${row.status?.trim() || null}, status),
            real_name       = COALESCE(${row.real_name?.trim() || null}, real_name),
            email           = COALESCE(${email}, email),
            phone           = COALESCE(${normalizePhone(row.phone)}, phone),
            prefecture      = COALESCE(${row.prefecture?.trim() || null}, prefecture),
            yonago_524      = COALESCE(${normalizeTickets(row.yonago_524)},      yonago_524),
            kumamoto_719    = COALESCE(${normalizeTickets(row.kumamoto_719)},    kumamoto_719),
            nagasaki_801    = COALESCE(${normalizeTickets(row.nagasaki_801)},    nagasaki_801),
            oita_802        = COALESCE(${normalizeTickets(row.oita_802)},        oita_802),
            shimane_1003    = COALESCE(${normalizeTickets(row.shimane_1003)},    shimane_1003),
            matsuyama_1011  = COALESCE(${normalizeTickets(row.matsuyama_1011)},  matsuyama_1011),
            aomori_1017     = COALESCE(${normalizeTickets(row.aomori_1017)},     aomori_1017),
            purchase_status = COALESCE(${row.purchase_status?.trim() || null},   purchase_status)
          WHERE ${whereClause}
        `
        updated++
      } else {
        // 新規INSERT（line_user_id が NULL でも受け入れる）
        await sql`
          INSERT INTO applicants (
            line_username, line_user_id, applied_at, status,
            real_name, email, phone, prefecture,
            yonago_524, kumamoto_719, nagasaki_801, oita_802,
            shimane_1003, matsuyama_1011, aomori_1017, purchase_status
          ) VALUES (
            ${lineUsername},
            ${uid},
            ${row.applied_at?.trim() || new Date().toISOString()},
            ${row.status?.trim() || 'completed'},
            ${row.real_name?.trim() || null},
            ${row.email?.trim() || null},
            ${normalizePhone(row.phone)},
            ${row.prefecture?.trim() || null},
            ${normalizeTickets(row.yonago_524)},
            ${normalizeTickets(row.kumamoto_719)},
            ${normalizeTickets(row.nagasaki_801)},
            ${normalizeTickets(row.oita_802)},
            ${normalizeTickets(row.shimane_1003)},
            ${normalizeTickets(row.matsuyama_1011)},
            ${normalizeTickets(row.aomori_1017)},
            ${row.purchase_status?.trim() || null}
          )
          ON CONFLICT (line_user_id) DO NOTHING
        `
        inserted++
      }
    } catch (e: unknown) {
      const label = lineUsername ?? uid ?? `行${inserted + updated + errors.length + 1}`
      errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  return NextResponse.json({ inserted, updated, errors })
}
