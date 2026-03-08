import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const campaignId = parseInt(id, 10)

  const recipients = await sql`
    SELECT a.*, ml.status as delivery_status, ml.delivery_type as log_delivery_type, ml.sent_at as log_sent_at
    FROM message_logs ml
    JOIN applicants a ON a.id = ml.applicant_id
    WHERE ml.campaign_id = ${campaignId}
    ORDER BY ml.sent_at DESC
  `
  return NextResponse.json(recipients)
}
