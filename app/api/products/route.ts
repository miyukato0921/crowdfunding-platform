import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const session = await requireAuth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const products = await sql`
    SELECT * FROM products ORDER BY venue_key, ticket_count
  `
  return NextResponse.json(products)
}
