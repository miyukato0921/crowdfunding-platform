CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) VALUES
  ('site_title', 'Green Ireland Festival'),
  ('site_subtitle', 'アイリッシュ盆踊りフェスティバル 2026'),
  ('logo_url', '')
ON CONFLICT (key) DO NOTHING;
