import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'
import nodemailer from 'nodemailer'

const VENUE_TAG_PREFIX: Record<string, string> = {
  yonago_524:    'yonago',
  kumamoto_719:  'kumamoto',
  nagasaki_801:  'nagasaki',
  oita_802:      'oita',
  shimane_1003:  'shimane',
  matsuyama_1011:'matsuyama',
  aomori_1017:   'aomori',
}

async function sendLineMessage(lineUserId: string, message: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return false
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: lineUserId, messages: [{ type: 'text', text: message }] }),
    })
    return res.ok
  } catch { return false }
}

// SMTP transporter (iris-corp.co.jp domain)
function createSmtpTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) return null
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const transporter = createSmtpTransport()
  if (!transporter) return false
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? 'noreply@iris-corp.co.jp',
      to,
      subject,
      text: body,
    })
    return true
  } catch (err) {
    console.error('[v0] SMTP send error:', err)
    return false
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const campaignId = parseInt(id, 10)
  const campaigns = await sql`SELECT * FROM campaigns WHERE id = ${campaignId}`
  const campaign = campaigns[0]
  if (!campaign) return NextResponse.json({ error: 'キャンペーンが見つかりません' }, { status: 404 })
  if (campaign.status === 'sent') return NextResponse.json({ error: '送信済みです' }, { status: 400 })

  const filter = campaign.target_filter ?? {}
  const venue = filter.venue ?? ''
  const prefecture = filter.prefecture ?? ''
  const deliveryType: string = campaign.delivery_type ?? 'line'
  const targetIds: number[] | null = campaign.target_ids

  // Build targets: target_ids指定 > フィルター > 全件
  let targets
  if (targetIds && targetIds.length > 0) {
    targets = await sql`SELECT * FROM applicants WHERE id = ANY(${targetIds})`
  } else if (venue || prefecture) {
    targets = await sql`
      SELECT * FROM applicants
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
  } else {
    targets = await sql`SELECT * FROM applicants`
  }

  const allProducts = await sql`SELECT * FROM products`
  const emailSubject = campaign.email_subject ?? campaign.title
  const messageBody: string = campaign.message_body

  function resolveMessage(template: string, applicant: Record<string, string>): string {
    let msg = template
    msg = msg.replaceAll('{name}', applicant.real_name ?? applicant.line_username ?? '')
    msg = msg.replaceAll('{line_name}', applicant.line_username ?? '')
    msg = msg.replaceAll('{email}', applicant.email ?? '')
    msg = msg.replaceAll('{phone}', applicant.phone ?? '')
    msg = msg.replaceAll('{prefecture}', applicant.prefecture ?? '')

    // 複数会場に対応: 全会場を走査し、申込者の枚数に合ったURLタグだけ変換
    for (const [venueKey, prefix] of Object.entries(VENUE_TAG_PREFIX)) {
      const rawVal = applicant[venueKey] ?? ''
      const ticketCount = parseInt(rawVal.replace(/[^0-9]/g, ''), 10) || 0
      for (let n = 1; n <= 4; n++) {
        const prod = allProducts.find(
          (p: Record<string, unknown>) => p.venue_key === venueKey && Number(p.ticket_count) === n
        )
        const quickTag = `{${prefix}_${n}quick}`
        const miniTag = `{${prefix}_${n}mini}`
        if (ticketCount === n && prod) {
          msg = msg.replaceAll(quickTag, (prod.liff_url as string) ?? '')
          msg = msg.replaceAll(miniTag, (prod.miniapp_url as string) ?? '')
        } else {
          msg = msg.replaceAll(quickTag, '')
          msg = msg.replaceAll(miniTag, '')
        }
      }
    }

    // 自動会場タグ: {auto_venues_quick} → この人が申し込んだ全会場のURLをまとめて出力
    const autoQuickLines: string[] = []
    const autoMiniLines: string[] = []
    for (const [venueKey, prefix] of Object.entries(VENUE_TAG_PREFIX)) {
      const rawVal = applicant[venueKey] ?? ''
      const ticketCount = parseInt(rawVal.replace(/[^0-9]/g, ''), 10) || 0
      if (ticketCount > 0) {
        const prod = allProducts.find(
          (p: Record<string, unknown>) => p.venue_key === venueKey && Number(p.ticket_count) === ticketCount
        )
        const vLabel = VENUE_LABELS[venueKey] ?? venueKey
        if (prod && (prod as Record<string, unknown>).liff_url) {
          autoQuickLines.push(`${vLabel} (${ticketCount}枚): ${(prod as Record<string, unknown>).liff_url}`)
        }
        if (prod && (prod as Record<string, unknown>).miniapp_url) {
          autoMiniLines.push(`${vLabel} (${ticketCount}枚): ${(prod as Record<string, unknown>).miniapp_url}`)
        }
      }
    }
    msg = msg.replaceAll('{auto_venues_quick}', autoQuickLines.join('\n'))
    msg = msg.replaceAll('{auto_venues_mini}', autoMiniLines.join('\n'))

    return msg
  }

  let sentCount = 0
  for (const target of targets) {
    const resolvedMsg = resolveMessage(messageBody, target)
    let lineOk = false
    let emailOk = false

    if (deliveryType === 'line' || deliveryType === 'both') {
      lineOk = await sendLineMessage(target.line_user_id, resolvedMsg)
    }
    if (deliveryType === 'email' || deliveryType === 'both') {
      if (target.email) emailOk = await sendEmail(target.email, emailSubject, resolvedMsg)
    }

    const noConfig = !process.env.LINE_CHANNEL_ACCESS_TOKEN && !process.env.SMTP_HOST
    const logStatus = (lineOk || emailOk || noConfig) ? 'success' : 'failed'

    await sql`
      INSERT INTO message_logs (campaign_id, applicant_id, line_user_id, email, delivery_type, status, sent_at)
      VALUES (${campaignId}, ${target.id}, ${target.line_user_id ?? null}, ${target.email ?? null}, ${deliveryType}, ${logStatus}, NOW())
    `
    sentCount++
  }

  await sql`
    UPDATE campaigns SET status = 'sent', sent_at = NOW(), sent_count = ${sentCount}
    WHERE id = ${campaignId}
  `

  return NextResponse.json({ success: true, sent_count: sentCount, delivery_type: deliveryType })
}

const VENUE_LABELS: Record<string, string> = {
  yonago_524: '米子 5/24', kumamoto_719: '熊本 7/19', nagasaki_801: '長崎 8/1',
  oita_802: '大分 8/2', shimane_1003: '島根 10/3', matsuyama_1011: '松山 10/11', aomori_1017: '青森 10/17',
}
