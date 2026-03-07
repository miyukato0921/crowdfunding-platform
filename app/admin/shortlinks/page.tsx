import ShortlinksManagement from "@/components/admin/ShortlinksManagement"

export const metadata = {
  title: "リンクショートカット管理",
}

export default function ShortlinksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">リンクショートカット管理</h1>
        <p className="text-muted-foreground mt-1">短いURLを作成して、プラットフォーム別にリダイレクト先を設定できます</p>
      </div>
      <ShortlinksManagement campaignId={0} />
    </div>
  )
}
