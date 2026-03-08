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

<p>本クラウドファンディングサイト「Green Ireland Festival」（以下「本サービス」）は、在日アイルランド商工会議所が主催するプロジェクトに対し、ENWA株式会社がシステムの提供および決済の代行を行っています。</p>

<h3>システム提供・決済代行事業者</h3>
<table>
<tr><td><strong>事業者名</strong></td><td>ENWA株式会社</td></tr>
<tr><td><strong>代表者</strong></td><td>代表取締役</td></tr>
<tr><td><strong>所在地</strong></td><td>請求があった場合には遅滞なく開示いたします</td></tr>
<tr><td><strong>メールアドレス</strong></td><td><a href="mailto:greenirelandfes@enwa.info">greenirelandfes@enwa.info</a></td></tr>
</table>

<h3>当社が提供するサービス</h3>

<h4>1. クラウドファンディングプラットフォームの開発・運営・保守</h4>
<p>本サービスのウェブサイト・システム基盤の設計・開発・サーバー運用・セキュリティ管理・システム保守をENWA株式会社が担当しています。Vercel社のクラウドインフラ上で安定的に運用しています。</p>

<h4>2. 決済処理の代行</h4>
<p>支援金および商品購入代金のクレジットカード決済処理を、ENWA株式会社がStripe, Inc.と連携して代行しています。対応カードブランドはVISA、Mastercard、American Express、JCBです。</p>

<h4>3. 支援者データ・注文データの管理</h4>
<p>支援者情報、注文情報、発送ステータス等のデータ管理をENWA株式会社のシステム上で行っています。これらのデータは在日アイルランド商工会議所と共有し、リターンの提供に活用されます。</p>

<h4>4. メール配信の代行</h4>
<p>支援完了通知、購入完了通知等の自動メール配信をENWA株式会社のシステムから送信しています。</p>

<h3>クレジットカード情報の取り扱い</h3>
<p>クレジットカード情報は、<strong>Stripe, Inc.（米国）</strong>の決済基盤上でのみ処理されます。</p>
<ul>
<li>ENWA株式会社がクレジットカード番号を保持・閲覧することは<strong>一切ありません</strong></li>
<li>在日アイルランド商工会議所がクレジットカード番号を保持・閲覧することも<strong>一切ありません</strong></li>
<li>Stripe, Inc.は <strong>PCI DSS Level 1</strong> 認証（クレジットカード業界の最高レベルのセキュリティ基準）を取得した決済サービスプロバイダーです</li>
<li>すべての決済通信はSSL/TLSにより暗号化されています</li>
</ul>

<h3>支援金の流れ</h3>
<ol>
<li><strong>支援者</strong>がクレジットカードで支援金を決済</li>
<li><strong>Stripe, Inc.</strong> が決済処理を実施し、カード会社を通じて代金を収納</li>
<li>Stripeの入金サイクルに従い、支援金がプロジェクト主催者である<strong>在日アイルランド商工会議所</strong>に引き渡されます</li>
</ol>
<p>※ ENWA株式会社は決済の技術的な処理を代行する立場であり、支援金の最終的な受領者ではありません。</p>

<h3>各社の役割と責任範囲</h3>
<table>
<tr><td><strong>役割</strong></td><td><strong>担当</strong></td><td><strong>責任範囲</strong></td></tr>
<tr><td>イベント企画・運営</td><td>在日アイルランド商工会議所</td><td>イベント内容、リターンの企画・提供、支援者対応</td></tr>
<tr><td>システム提供</td><td>ENWA株式会社</td><td>サイト開発・運用・保守、システム障害対応</td></tr>
<tr><td>決済代行</td><td>ENWA株式会社 + Stripe, Inc.</td><td>決済処理、入金管理</td></tr>
<tr><td>カード決済処理</td><td>Stripe, Inc.</td><td>カード情報の安全な処理・保管</td></tr>
</table>

<h3>お問い合わせ先</h3>
<p><strong>システム・決済に関するお問い合わせ:</strong></p>
<p>ENWA株式会社<br>メール: <a href="mailto:greenirelandfes@iris-corp.co.jp">greenirelandfes@iris-corp.co.jp</a></p>

<p><strong>イベント内容・リターンに関するお問い合わせ:</strong></p>
<p>在日アイルランド商工会議所<br>Green Ireland Festival 運営事務局<br>メール: <a href="mailto:greenirelandfes@iris-corp.co.jp">greenirelandfes@iris-corp.co.jp</a></p>

<p style="margin-top: 24px; font-size: 13px; color: #666;">最終更新日: 2025年3月1日</p>`

  return <LegalPageClient title="システム提供・決済代行について" content={content || defaultContent} />
}
