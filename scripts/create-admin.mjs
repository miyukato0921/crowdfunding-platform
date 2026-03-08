import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL)

const username = 'admin'
const password = 'admin1234'

const hash = await bcrypt.hash(password, 12)

await sql`
  INSERT INTO admin_users (username, password_hash)
  VALUES (${username}, ${hash})
  ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
`

console.log(`管理者アカウントを作成しました: ${username} / ${password}`)
