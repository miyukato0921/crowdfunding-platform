import sql from '@/lib/db'
import MessagesClient from './messages-client'

export default async function MessagesPage() {
  const campaigns = await sql`
    SELECT c.*, u.username as created_by_name
    FROM campaigns c
    LEFT JOIN admin_users u ON u.id = c.created_by
    ORDER BY c.created_at DESC
  `
  return <MessagesClient campaigns={campaigns as any} />
}
