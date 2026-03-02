import sql from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Shield, UserPlus } from "lucide-react"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

export default async function UsersPage() {
  const users = await sql`
    SELECT id, email, name, role, created_at FROM admin_users ORDER BY created_at DESC
  `

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">管理者ユーザー</h1>
          <p className="text-muted-foreground mt-1">管理画面へのアクセス権を持つユーザー一覧</p>
        </div>
        <Button className="bg-ireland-green hover:bg-ireland-green/90 text-white rounded-xl" disabled>
          <UserPlus className="w-4 h-4 mr-2" />
          ユーザー追加
        </Button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Users className="w-5 h-5 text-ireland-green" />
          <h2 className="font-bold text-foreground">管理者一覧</h2>
          <span className="text-sm text-muted-foreground ml-auto">{users.length}人</span>
        </div>
        <div className="divide-y divide-border">
          {users.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-ireland-green/20 flex items-center justify-center font-bold text-ireland-green">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={
                  user.role === "super_admin"
                    ? "bg-ireland-gold/20 text-ireland-dark border-ireland-gold/30"
                    : "bg-blue-100 text-blue-800 border-blue-200"
                }>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role === "super_admin" ? "スーパー管理者" : "管理者"}
                </Badge>
                <span className="text-xs text-muted-foreground">{formatDate(user.created_at)} 作成</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-5 bg-muted/50 rounded-2xl border border-border">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-ireland-green mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-foreground text-sm mb-1">デフォルト管理者アカウント</p>
            <p className="text-sm text-muted-foreground">
              メールアドレス：<code className="bg-muted px-1.5 py-0.5 rounded text-xs">admin@greenireland.jp</code>
              　初期パスワード：<code className="bg-muted px-1.5 py-0.5 rounded text-xs">Admin1234!</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">本番運用前にパスワードを変更してください。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
