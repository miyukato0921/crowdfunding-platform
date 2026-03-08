-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concert applicants (LINE users)
CREATE TABLE IF NOT EXISTS applicants (
  id SERIAL PRIMARY KEY,
  line_username VARCHAR(255),
  line_user_id VARCHAR(100) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ,
  status VARCHAR(50),
  real_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  prefecture VARCHAR(50),
  -- Concert ticket quantities
  yonago_524 INTEGER DEFAULT 0,        -- 5/24 米子
  kumamoto_719 INTEGER DEFAULT 0,      -- 7/19 熊本
  nagasaki_801 INTEGER DEFAULT 0,      -- 8/1 長崎
  oita_802 INTEGER DEFAULT 0,          -- 8/2 大分
  shimane_1003 INTEGER DEFAULT 0,      -- 10/3 島根
  matsuyama_1011 INTEGER DEFAULT 0,    -- 10/11 松山
  aomori_1017 INTEGER DEFAULT 0,       -- 10/17 青森
  purchase_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message_body TEXT NOT NULL,
  target_filter JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft', -- draft, sending, sent
  total_targets INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  created_by INTEGER REFERENCES admin_users(id),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message send log per user
CREATE TABLE IF NOT EXISTS message_logs (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  applicant_id INTEGER REFERENCES applicants(id) ON DELETE CASCADE,
  line_user_id VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions for admin auth
CREATE TABLE IF NOT EXISTS admin_sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
