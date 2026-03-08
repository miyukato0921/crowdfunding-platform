import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import sql from '@/lib/db'

export async function POST() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session_id')?.value

  if (sessionId) {
    await sql`DELETE FROM admin_sessions WHERE id = ${sessionId}`
    cookieStore.delete('session_id')
  }

  return NextResponse.json({ success: true })
}
