import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import nodemailer from "nodemailer"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "to is required" }, { status: 400 })

  // 1. Gmail 認証情報を取得（DB優先 → 環境変数フォールバック / lib/email.ts と同一順序）
  let gmailUser: string | undefined
  let gmailPass: string | undefined
  let credSource = "none"

  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('gmail_user', 'gmail_app_password')`
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value
    if (map.gmail_user && map.gmail_app_password) {
      gmailUser = map.gmail_user
      gmailPass = map.gmail_app_password
      credSource = "db"
    }
  } catch { /* DB失敗時は環境変数にフォールバック */ }

  if (!gmailUser || !gmailPass) {
    const envUser = process.env.GMAIL_USER
    const envPass = process.env.GMAIL_APP_PASSWORD
    if (envUser && envPass) {
      gmailUser = envUser
      gmailPass = envPass
      credSource = "env"
    }
  }

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({
      success: false,
      step: "credentials",
      error: "Gmail認証情報が見つかりません。共通設定でGMAIL_USERとGMAIL_APP_PASSWORDを設定してください。",
      credSource,
      gmailUser: gmailUser ?? null,
    })
  }

  // 2. テンプレート確認
  const templates = await sql`SELECT slug, is_active FROM email_templates WHERE slug = 'pledge_confirmation' LIMIT 1`
  const templateStatus = templates.length > 0
    ? { found: true, slug: templates[0].slug, is_active: templates[0].is_active }
    : { found: false }

  // 3. テスト送信
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    })

    await transporter.verify()

    await transporter.sendMail({
      from: `"Green Ireland Festival" <${gmailUser}>`,
      replyTo: "greenirelandfes@iris-corp.co.jp",
      to,
      subject: "【テスト送信】Green Ireland Festival メール配信テスト",
      text: `このメールはテスト送信です。\n\nGmail認証情報: ${credSource}から取得\nGmailアカウント: ${gmailUser}\n\nメール配信設定は正常に機能しています。`,
    })

    return NextResponse.json({
      success: true,
      credSource,
      gmailUser,
      templateStatus,
      message: `${to} へテスト送信しました`,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({
      success: false,
      step: "send",
      error: message,
      credSource,
      gmailUser,
      templateStatus,
    })
  }
}
