import { stripe } from "@/lib/stripe"
import sql from "@/lib/db"
import ShopSuccessPageClient from "@/components/checkout/ShopSuccessPageClient"

async function confirmOrder(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.payment_status !== "paid") return null

    const { product_id, buyer_name, buyer_email } = session.metadata ?? {}
    if (!product_id) return null

    const productRows = await sql`SELECT * FROM products WHERE id = ${Number(product_id)} LIMIT 1`
    const product = productRows[0]
    if (!product) return null

    // Idempotency: check if order already exists
    const existing = await sql`
      SELECT id, requires_shipping, shipping_name FROM shop_orders
      WHERE stripe_session_id = ${sessionId} LIMIT 1
    `

    let orderId: number
    if (existing.length > 0) {
      orderId = existing[0].id
    } else {
      const inserted = await sql`
        INSERT INTO shop_orders (
          stripe_session_id, stripe_payment_intent_id,
          product_id, product_name, product_price,
          buyer_name, buyer_email, payment_status,
          requires_shipping, shipping_status
        ) VALUES (
          ${sessionId}, ${session.payment_intent as string | null},
          ${product.id}, ${product.name}, ${product.price},
          ${buyer_name ?? null}, ${session.customer_email ?? buyer_email ?? null},
          'completed',
          ${product.requires_shipping ?? true},
          ${product.requires_shipping ? 'waiting' : 'not_required'}
        )
        RETURNING id
      `
      orderId = inserted[0].id

      // Decrement stock
      if (product.stock_count !== null && product.stock_count > 0) {
        await sql`UPDATE products SET stock_count = stock_count - 1 WHERE id = ${product.id} AND stock_count > 0`
      }
    }

    return {
      orderId,
      productName: product.name,
      requiresShipping: product.requires_shipping ?? true,
      shippingAlreadySaved: existing.length > 0 && !!existing[0].shipping_name,
    }
  } catch (err) {
    console.error("[shop/success] Error:", err)
    return null
  }
}

export default async function ShopSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const params = await searchParams
  const sessionId = params.session_id

  const order = sessionId ? await confirmOrder(sessionId) : null

  return <ShopSuccessPageClient order={order} />
}
