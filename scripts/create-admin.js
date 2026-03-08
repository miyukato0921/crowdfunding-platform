import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

const username = 'admin'
const password = 'admin1234'
const hash = await bcrypt.hash(password, 10)

await sql`
  INSERT INTO admin_users (username, password_hash)
  VALUES (${username}, ${hash})
  ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
`

console.log('管理者アカウントを作成しました')
console.log('username:', username)
console.log('password:', password)
