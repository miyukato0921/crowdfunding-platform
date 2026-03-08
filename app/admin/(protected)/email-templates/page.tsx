import sql from "@/lib/db"
import EmailTemplateEditor from "@/components/admin/EmailTemplateEditor"
import EmailLogsViewer from "@/components/admin/EmailLogsViewer"
import EmailTemplatesPageClient from "@/components/admin/EmailTemplatesPageClient"
import { Mail } from "lucide-react"

export const metadata = { title: "メール配信設定 - 管理画面" }

export default async function EmailTemplatesPage() {
  const templates = await sql`SELECT * FROM email_templates ORDER BY id ASC`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-ireland-green" />
          </div>
          <h1 className="text-2xl font-black text-foreground">メール配信設定</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          支援完了・購入完了などのイベント時に自動送信されるメールのテンプレートを管理します。
        </p>
        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
          送信元・返信先: <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 rounded">greenirelandfes@enwa.info</code>（共通設定で変更可能）/ 認証情報は「共通設定」または環境変数で設定してください。
        </div>
      </div>
      <EmailTemplatesPageClient
        templateEditor={<EmailTemplateEditor templates={templates} />}
        logsViewer={<EmailLogsViewer />}
      />
    </div>
  )
}
