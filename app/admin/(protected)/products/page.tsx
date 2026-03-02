import sql from "@/lib/db"
import { formatYen } from "@/lib/utils"
import type { Product } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Edit, ShoppingBag, Package } from "lucide-react"

export default async function ProductsPage() {
  const products = await sql<Product[]>`SELECT * FROM products ORDER BY created_at DESC`

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">商品管理</h1>
          <p className="text-muted-foreground mt-1">フェスティバルグッズ・商品の管理</p>
        </div>
        <Button className="bg-ireland-green hover:bg-ireland-green/90 text-white rounded-xl" asChild>
          <Link href="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" />
            新規商品登録
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-foreground">{products.length}</p>
          <p className="text-xs text-muted-foreground mt-1">総商品数</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-ireland-green">{products.filter(p => p.is_active).length}</p>
          <p className="text-xs text-muted-foreground mt-1">公開中</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-foreground">{products.filter(p => !p.is_active).length}</p>
          <p className="text-xs text-muted-foreground mt-1">非公開</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-black text-yellow-600">
            {products.filter(p => p.stock_count !== null && p.stock_count <= 5).length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">在庫わずか</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-ireland-green" />
          <h2 className="font-bold text-foreground">商品一覧</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">商品名</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">カテゴリ</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">価格</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">在庫</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">状態</th>
                <th className="text-center py-3 px-4 text-muted-foreground font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{product.category ?? "未分類"}</td>
                  <td className="py-3 px-4 text-right font-bold text-foreground">{formatYen(product.price)}</td>
                  <td className="py-3 px-4 text-center">
                    {product.stock_count !== null ? (
                      <span className={`font-bold text-sm ${product.stock_count <= 5 ? "text-yellow-600" : "text-foreground"}`}>
                        {product.stock_count}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">無制限</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Badge className={product.is_active ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"}>
                      {product.is_active ? "公開中" : "非公開"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                      <Link href={`/admin/products/${product.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">商品が登録されていません。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
