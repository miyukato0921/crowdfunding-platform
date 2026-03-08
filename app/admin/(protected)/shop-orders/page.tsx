import sql from "@/lib/db"
import ShopOrdersManagement from "@/components/admin/ShopOrdersManagement"

export default async function ShopOrdersPage() {
  const orders = await sql`
    SELECT
      so.*,
      p.name AS product_name_current
    FROM shop_orders so
    LEFT JOIN products p ON p.id = so.product_id
    ORDER BY so.created_at DESC
  `

  const stats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE payment_status = 'completed') AS count_completed,
      COUNT(*) FILTER (WHERE shipping_status = 'waiting') AS count_waiting,
      COUNT(*) FILTER (WHERE shipping_status = 'shipped') AS count_shipped,
      COALESCE(SUM(product_price) FILTER (WHERE payment_status = 'completed'), 0) AS total_sales
    FROM shop_orders
  `

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">ショップ注文管理</h1>
          <p className="text-muted-foreground text-sm mt-1">ショップからの注文・発送ステータスを管理します</p>
        </div>
      </div>
      <ShopOrdersManagement orders={orders as any} stats={stats[0] as any} />
    </div>
  )
}
