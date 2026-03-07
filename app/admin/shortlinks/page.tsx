import ShortlinksManagement from "@/components/admin/ShortlinksManagement"

export default function ShortlinksAdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-foreground">リンクショートカット管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          キャンペーン・イベント・SNS連携などのURLを短いコードで管理できます。
        </p>
      </div>
      <ShortlinksManagement />
    </div>
  )
}
