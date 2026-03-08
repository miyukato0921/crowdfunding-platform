const { readFileSync, writeFileSync } = require('fs')

const raw = readFileSync('/vercel/share/v0-project/user_read_only_context/text_attachments/pasted-text-l2L1m.txt', 'utf-8')

const lines = raw.split('\n').filter(l => l.trim())

function parseTickets(val) {
  if (!val || val.trim() === '' || val.trim() === '確認しました') return 0
  const m = val.match(/(\d+)/)
  return m ? parseInt(m[1]) : 0
}

function esc(v) {
  if (v === null || v === undefined || v === '') return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

const rows = []

// Skip header row (index 0)
for (let i = 1; i < lines.length; i++) {
  const cols = lines[i].split('\t')
  if (cols.length < 5) continue

  // Column layout (tab-separated):
  // 0: row#, 1: LINE username, 2: LINE User ID, 3: applied_at, 4: status,
  // 5: 同意1, 6: 同意2, 7: 本名(real_name), 8: email, 9: phone, 10: prefecture,
  // 11: 米子5/24, 12: 熊本7/19, 13: 長崎8/1, 14: 大分8/2, 15: 島根10/3, 16: 松山10/11, 17: 青森10/17,
  // 18-23: 確認しました columns, 24: purchase_status

  const lineUsername = cols[1]?.trim() || ''
  const lineUserId   = cols[2]?.trim() || ''
  const appliedAt    = cols[3]?.trim() || ''
  const status       = cols[4]?.trim() || ''
  const realName     = cols[7]?.trim() || ''
  const email        = cols[8]?.trim() || ''
  const phone        = cols[9]?.trim() || ''
  const prefecture   = cols[10]?.trim() || ''
  const yonago       = parseTickets(cols[11])
  const kumamoto     = parseTickets(cols[12])
  const nagasaki     = parseTickets(cols[13])
  const oita         = parseTickets(cols[14])
  const shimane      = parseTickets(cols[15])
  const matsuyama    = parseTickets(cols[16])
  const aomori       = parseTickets(cols[17])
  const purchaseStatus = cols[24]?.trim() || null

  if (!lineUserId || !lineUserId.startsWith('U')) continue

  let appliedAtSql = 'NULL'
  if (appliedAt) {
    const normalized = appliedAt.replace(/\//g, '-')
    appliedAtSql = esc(normalized)
  }

  rows.push(`(${esc(lineUsername)},${esc(lineUserId)},${appliedAtSql},${esc(status)},${esc(realName)},${esc(email)},${esc(phone)},${esc(prefecture)},${yonago},${kumamoto},${nagasaki},${oita},${shimane},${matsuyama},${aomori},${esc(purchaseStatus)})`)
}

// bcrypt hash of 'admin1234' with 10 rounds
const sql = `-- デフォルト管理者ユーザー（パスワード: admin1234）
INSERT INTO admin_users (username, password_hash)
VALUES ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.')
ON CONFLICT (username) DO NOTHING;

-- 申込者データ (${rows.length}件)
INSERT INTO applicants (line_username, line_user_id, applied_at, status, real_name, email, phone, prefecture, yonago_524, kumamoto_719, nagasaki_801, oita_802, shimane_1003, matsuyama_1011, aomori_1017, purchase_status)
VALUES
${rows.join(',\n')}
ON CONFLICT (line_user_id) DO NOTHING;
`

writeFileSync('/vercel/share/v0-project/scripts/002_seed_data.sql', sql, 'utf-8')
console.log(`Generated ${rows.length} rows successfully.`)
