import sql from "@/lib/db"
import LegalPageClient from "@/components/legal/LegalPageClient"

export const dynamic = "force-dynamic"

export default async function TokushoPage() {
  let content = ""
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'legal_tokusho' LIMIT 1`
    content = rows[0]?.value ?? ""
  } catch {}

  const defaultContent = `<h2>特定商取引法に基づく表記</h2>
<table>
<tr><td><strong>販売事業者</strong></td><td>在日アイルランド商工会議所</td></tr>
<tr><td><strong>運営統括責任者</strong></td><td>代表</td></tr>
<tr><td><strong>所在地</strong></td><td>お問い合わせいただきましたら遅滞なく開示いたします</td></tr>
<tr><td><strong>電話番号</strong></td><td>お問い合わせいただきましたら遅滞なく開示いたします</td></tr>
<tr><td><strong>メールアドレス</strong></td><td>greenirelandfes@iris-corp.co.jp</td></tr>
<tr><td><strong>販売URL</strong></td><td>https://greenirelandfes.atouch.dev</td></tr>
<tr><td><strong>販売価格</strong></td><td>各プロジェクトページ・リターン欄に記載の金額</td></tr>
<tr><td><strong>商品代金以外の必要料金</strong></td><td>なし（送料がかかる場合は各リターン欄に記載）</td></tr>
<tr><td><strong>支払方法</strong></td><td>クレジットカード（Stripe決済）</td></tr>
<tr><td><strong>支払時期</strong></td><td>支援申込時に即時決済</td></tr>
<tr><td><strong>商品の引渡し時期</strong></td><td>各リターンに記載の発送予定時期に準ずる</td></tr>
<tr><td><strong>返品・交換・キャンセル</strong></td><td>支援後のキャンセル・返金は原則として承っておりません。ただし、プロジェクトが中止となった場合は全額返金いたします。商品の初期不良の場合は交換にて対応いたします。</td></tr>
<tr><td><strong>システム提供・決済代行</strong></td><td>ENWA株式会社（<a href="/legal/system">詳細はこちら</a>）</td></tr>
</table>`

  return <LegalPageClient title="特定商取引法に基づく表記" content={content || defaultContent} />
}
