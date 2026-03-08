CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期テンプレート
INSERT INTO email_templates (slug, name, subject, body, description) VALUES
  ('pledge_confirmation', '支援完了通知', 'ご支援ありがとうございます - Green Ireland Festival 2026', E'{{supporter_name}} 様\n\nこの度は Green Ireland Festival 2026 にご支援いただき、誠にありがとうございます。\n\n【支援内容】\nリターン: {{reward_title}}\n金額: {{amount}}\n\n引き続き、フェスティバルの最新情報をお届けしてまいります。\n\nGreen Ireland Festival 実行委員会', '支援（クラウドファンディング）が完了した際に支援者に送信されるメールです。\n利用可能な変数: {{supporter_name}}, {{reward_title}}, {{amount}}, {{email}}'),
  ('shop_purchase_confirmation', '購入完了通知', 'ご購入ありがとうございます - Green Ireland Festival Shop', E'{{buyer_name}} 様\n\nこの度は Green Ireland Festival ショップでのご購入ありがとうございます。\n\n【注文内容】\n商品名: {{product_name}}\n金額: {{amount}}\n\n発送の準備が整い次第、改めてご連絡いたします。\n\nGreen Ireland Festival 実行委員会', '商品購入完了時に購入者に送信されるメールです。\n利用可能な変数: {{buyer_name}}, {{product_name}}, {{amount}}, {{email}}')
ON CONFLICT (slug) DO NOTHING;
