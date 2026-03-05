import Stripe from "stripe"
import "server-only"
import sql from "@/lib/db"

const STRIPE_API_VERSION = "2025-01-27.acacia" as const

// 環境変数 → DB の順でキーを解決して Stripe インスタンスを返す
export async function getStripe(): Promise<Stripe> {
  // 1. 環境変数が設定されていればそれを使う
  if (process.env.STRIPE_SECRET_KEY) {
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  }
  // 2. DB の site_settings から取得
  const rows = await sql`SELECT value FROM site_settings WHERE key = 'stripe_secret_key' LIMIT 1`
  const key = rows[0]?.value
  if (key) {
    return new Stripe(key, { apiVersion: STRIPE_API_VERSION })
  }
  // 3. どちらも未設定 → エラーを throw して呼び出し元で適切に処理させる
  throw new Error("Stripe シークレットキーが設定されていません。共通設定または環境変数 STRIPE_SECRET_KEY を設定してください。")
}
