import sql from "@/lib/db"
import LegalPageClient from "@/components/legal/LegalPageClient"

export const dynamic = "force-dynamic"

export default async function SystemProviderPage() {
  let content = ""
  try {
    const rows = await sql`SELECT value FROM site_settings WHERE key = 'legal_system' LIMIT 1`
    content = rows[0]?.value ?? ""
  } catch {}

  const defaultContent = `<h2>システム提供・決済代行について</h2>

<p>本クラウドファンディングサイト「Green Ireland Festival」は、以下の企業がシステム提供および決済代行を行っています。</p>

<h3>システム提供・決済代行事業者</h3>
<table>
<tr><td><strong>事業者名</strong></td><td>ENWA株式会社</td></tr>
<tr><td><strong>所在地</strong></td><td>お問い合わせいただきましたら遅滞なく開示いたします</td></tr>
<tr><td><strong>メールアドレス</strong></td><td>greenirelandfes@iris-corp.co.jp</td></tr>
</table>

<h3>提供サービスの内容</h3>
<ul>
<li><strong>クラウドファンディングプラットフォームの開発・運営・保守</strong><br>本サイトの設計・開発・サーバー運用・システム保守をENWA株式会社が担当しています。</li>
<li><strong>決済処理の代行</strong><br>支援金のクレジットカード決済処理をENWA株式会社がStripe, Inc.と連携して代行しています。</li>
<li><strong>データ管理</strong><br>支援者情報・注文情報のシステム上の管理をENWA株式会社が行っています。</li>
</ul>

<h3>クレジットカード情報の取り扱い</h3>
<p>クレジットカード情報はStripe, Inc.（米国）の決済基盤上で処理されます。ENWA株式会社および在日アイルランド商工会議所がクレジットカード番号を保持・閲覧することはありません。Stripeは PCI DSS Level 1 認証を取得した決済サービスプロバイダーです。</p>

<h3>支援金の流れ</h3>
<ol>
<li>支援者がクレジットカードで支援金を決済</li>
<li>Stripe, Inc. が決済処理を実施</li>
<li>決済完了後、支援金はプロジェクト主催者である在日アイルランド商工会議所に引き渡されます</li>
</ol>

<h3>お問い合わせ先</h3>
<p>システムや決済処理に関するお問い合わせは、以下までご連絡ください。</p>
<p><strong>ENWA株式会社</strong><br>メール: greenirelandfes@iris-corp.co.jp</p>

<p>イベント内容・リターンに関するお問い合わせは、主催者である在日アイルランド商工会議所までお願いいたします。</p>`

  return <LegalPageClient title="システム提供・決済代行について" content={content || defaultContent} />
}
