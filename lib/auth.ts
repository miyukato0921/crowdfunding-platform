import { cookies } from 'next/headers'
import sql from './db'

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value
  if (!sessionId) return null

  const sessions = await sql`
    SELECT s.*, u.username
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.id = ${sessionId}
      AND s.expires_at > NOW()
  `
  return sessions[0] ?? null
}

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    return null
  }
  return session
}
