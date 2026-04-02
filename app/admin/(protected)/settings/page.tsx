import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/auth"
import sql from "@/lib/db"
import SiteSettingsForm from "@/components/admin/SiteSettingsForm"
import { Settings } from "lucide-react"

export const metadata = { title: "共通設定 - 管理画面" }

export default async function SiteSettingsPage() {
  const admin = await getAdminSession()
  if (!admin || admin.role !== "super_admin") redirect("/admin")

  const rows = await sql`SELECT key, value FROM site_settings`
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value

  // Fetch default receipt template
  let receiptTemplate: any = null
  try {
    const tplRows = await sql`SELECT * FROM receipt_templates ORDER BY is_default DESC, id ASC LIMIT 1`
    receiptTemplate = tplRows[0] || null
  } catch { /* table may not exist yet */ }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-brand-green" />
          </div>
          <h1 className="text-2xl font-black text-foreground">共通設定</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">ロゴ・タイトルなどのサイト全体の設定を管理します。</p>
      </div>
      <SiteSettingsForm initial={settings} receiptTemplate={receiptTemplate} />
    </div>
  )
}
