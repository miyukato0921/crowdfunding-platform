import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'ユーザー名とパスワードを入力してください' }, { status: 400 })
  }

  const users = await sql`
    SELECT * FROM admin_users WHERE username = ${username}
  `
  const user = users[0]

  if (!user) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'ユーザー名またはパスワードが正しくありません' }, { status: 401 })
  }

  const sessionId = randomUUID()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 days

  await sql`
    INSERT INTO admin_sessions (id, user_id, expires_at)
    VALUES (${sessionId}, ${user.id}, ${expiresAt.toISOString()})
  `

  const cookieStore = await cookies()
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
    sameSite: 'lax',
  })

  return NextResponse.json({ success: true })
}
