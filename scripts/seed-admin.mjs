import bcrypt from "bcryptjs"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL)

const password = "Admin1234!"
const hash = await bcrypt.hash(password, 10)

console.log("Generated hash:", hash)

await sql`
  INSERT INTO admin_users (email, password_hash, name, role)
  VALUES (
    'admin@greenireland.jp',
    ${hash},
    '管理者',
    'super_admin'
  )
  ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}
`

console.log("Admin user seeded/updated successfully!")
console.log("Login: admin@greenireland.jp / Admin1234!")
