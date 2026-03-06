import nodemailer from "nodemailer"
import sql from "@/lib/db"

const FROM_ADDRESS = "greenirelandfes@iris-corp.co.jp"
const REPLY_TO_ADDRESS = "greenirelandfes@iris-corp.co.jp"

function renderTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "")
}

async function getGmailCredentials(): Promise<{ user: string; pass: string } | null> {
  // DB優先 → 環境変数フォールバック（共通設定の値を確実に使う）
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('gmail_user', 'gmail_app_password')`
    const map: Record<string, string> = {}
    for (const row of rows) map[row.key] = row.value
    if (map.gmail_user && map.gmail_app_password) {
      return { user: map.gmail_user, pass: map.gmail_app_password }
    }
  } catch {
    // DB失敗時は環境変数にフォールバック
  }

  const envUser = process.env.GMAIL_USER
  const envPass = process.env.GMAIL_APP_PASSWORD
  if (envUser && envPass) return { user: envUser, pass: envPass }

  return null
}

async function createTransporter() {
  const creds = await getGmailCredentials()
  if (!creds) return null

  return {
    transporter: nodemailer.createTransport({
      service: "gmail",
      auth: { user: creds.user, pass: creds.pass },
    }),
    // From は必ず認証アカウントにする（Gmail が別アドレスを書き換えるのを防ぐ）
    fromAddress: creds.user,
  }
}

export async function sendTemplateEmail(
  slug: string,
  to: string,
  vars: Record<string, string>
): Promise<void> {
  const rows = await sql`
    SELECT subject, body FROM email_templates WHERE slug = ${slug} AND is_active = true LIMIT 1
  `
  if (!rows.length) {
    console.log(`[email] Template "${slug}" not found or inactive — skipping.`)
    await logEmail(slug, to, `[template: ${slug}]`, "", "skipped", "テンプレートが見つからないか無効です")
    return
  }

  const { subject, body } = rows[0]
  const renderedSubject = renderTemplate(subject, vars)
  const renderedBody = renderTemplate(body, vars)

  const result = await createTransporter()

  if (!result) {
    console.log(`[email] Gmail credentials not set — skipping send.`)
    await logEmail(slug, to, renderedSubject, renderedBody, "failed", "Gmail認証情報が未設定です（GMAIL_USER / GMAIL_APP_PASSWORD）")
    return
  }

  const { transporter, fromAddress } = result

  try {
    await transporter.sendMail({
      // From は認証アカウント自身。Reply-To で問い合わせ先を案内
      from: `"Green Ireland Festival" <${fromAddress}>`,
      replyTo: REPLY_TO_ADDRESS,
      to,
      subject: renderedSubject,
      text: renderedBody,
    })
    await logEmail(slug, to, renderedSubject, renderedBody, "sent", null)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[email] Send failed:`, message)
    await logEmail(slug, to, renderedSubject, renderedBody, "failed", message)
  }
}

async function logEmail(
  templateSlug: string,
  toAddress: string,
  subject: string,
  body: string,
  status: "sent" | "failed" | "skipped",
  errorMessage: string | null
) {
  try {
    await sql`
      INSERT INTO email_logs (template_slug, to_address, subject, body, status, error_message)
      VALUES (${templateSlug}, ${toAddress}, ${subject}, ${body}, ${status}, ${errorMessage})
    `
  } catch (logErr) {
    console.error("[email] Failed to write email log:", logErr)
  }
}

export async function sendRawEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<void> {
  const result = await createTransporter()

  if (!result) {
    console.log(`[email] Gmail credentials not set — skipping send.`)
    return
  }

  const { transporter, fromAddress } = result

  await transporter.sendMail({
    from: `"Green Ireland Festival" <${fromAddress}>`,
    replyTo: REPLY_TO_ADDRESS,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  })
}
