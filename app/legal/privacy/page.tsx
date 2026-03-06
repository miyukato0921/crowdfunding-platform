import sql from "@/lib/db"
import LegalPageClient from "@/components/legal/LegalPageClient"

export const dynamic = "force-dynamic"

export default async function PrivacyPage() {
  let content = ""
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'legal_privacy' LIMIT 1`
    content = rows[0]?.value ?? ""
  } catch {}

  const defaultContent = `<h2>プライバシーポリシー</h2>
<p>在日アイルランド商工会議所（以下「当会」）は、Green Ireland Festival クラウドファンディングサイト（以下「本サービス」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシーを定めます。</p>

<h3>1. 個人情報の収集</h3>
<p>本サービスでは、支援・購入の際に以下の情報を収集いたします。</p>
<ul>
<li>氏名</li>
<li>メールアドレス</li>
<li>電話番号</li>
<li>住所（配送が必要なリターンの場合）</li>
<li>決済に関する情報（クレジットカード情報はStripe, Inc.が管理し、当会およびシステム提供者であるENWA株式会社は保持しません）</li>
</ul>

<h3>2. 利用目的</h3>
<p>収集した個人情報は、以下の目的で利用いたします。</p>
<ul>
<li>リターン商品・特典の発送および提供</li>
<li>支援に関するご連絡・お問い合わせ対応</li>
<li>本サービスの運営・改善</li>
<li>イベントに関する情報のご案内（ご本人の同意がある場合）</li>
</ul>

<h3>3. 第三者への提供</h3>
<p>法令に基づく場合を除き、ご本人の同意なく第三者に個人情報を提供することはありません。ただし、以下の業務委託先に対して、業務遂行に必要な範囲で個人情報を提供する場合があります。</p>
<ul>
<li>ENWA株式会社（システム提供・決済代行）</li>
<li>Stripe, Inc.（クレジットカード決済処理）</li>
<li>配送業者（リターン商品の発送）</li>
</ul>

<h3>4. 安全管理措置</h3>
<p>個人情報の漏洩、滅失、毀損の防止その他の安全管理のため、必要かつ適切な措置を講じます。システム提供者であるENWA株式会社と連携し、技術的安全措置を実施しています。</p>

<h3>5. 個人情報の開示・訂正・削除</h3>
<p>ご本人から個人情報の開示・訂正・削除のご請求があった場合、合理的な範囲で速やかに対応いたします。</p>

<h3>6. お問い合わせ窓口</h3>
<p>個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
<p>在日アイルランド商工会議所<br>メール: greenirelandfes@iris-corp.co.jp</p>

<h3>7. ポリシーの改定</h3>
<p>本ポリシーは、法令の変更やサービス内容の変更に伴い、予告なく改定する場合があります。改定後のポリシーは本ページに掲載した時点から効力を生じます。</p>`

  return <LegalPageClient title="プライバシーポリシー" content={content || defaultContent} />
}
