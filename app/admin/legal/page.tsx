import sql from "@/lib/db"
import LegalPagesEditor from "@/components/admin/LegalPagesEditor"
import { Scale } from "lucide-react"

export const metadata = { title: "法的ページ管理 - 管理画面" }

export default async function LegalAdminPage() {
  const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('legal_tokusho', 'legal_privacy', 'legal_system')`
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-ireland-green/10 flex items-center justify-center">
            <Scale className="w-5 h-5 text-ireland-green" />
          </div>
          <h1 className="text-2xl font-black text-foreground">法的ページ管理</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          特定商取引法に基づく表記・プライバシーポリシー・システム提供情報の内容を編集できます。
        </p>
      </div>
      <LegalPagesEditor
        tokushoContent={settings.legal_tokusho ?? ""}
        privacyContent={settings.legal_privacy ?? ""}
        systemContent={settings.legal_system ?? ""}
      />
    </div>
  )
}
