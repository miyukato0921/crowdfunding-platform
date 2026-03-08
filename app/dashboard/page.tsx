import sql from '@/lib/db'
import ApplicantsClient from './applicants-client'

const VENUES = [
  { key: 'yonago_524',     label: '米子 5/24',   shortLabel: '米子' },
  { key: 'kumamoto_719',   label: '熊本 7/19',   shortLabel: '熊本' },
  { key: 'nagasaki_801',   label: '長崎 8/1',    shortLabel: '長崎' },
  { key: 'oita_802',       label: '大分 8/2',    shortLabel: '大分' },
  { key: 'shimane_1003',   label: '島根 10/3',   shortLabel: '島根' },
  { key: 'matsuyama_1011', label: '松山 10/11',  shortLabel: '松山' },
  { key: 'aomori_1017',    label: '青森 10/17',  shortLabel: '青森' },
]

export default async function DashboardPage() {
  const applicants = await sql`SELECT * FROM applicants ORDER BY applied_at DESC`

  const stats = {
    total: applicants.length,
    // 各会場: 枚数が空文字・null・0以外であれば1人としてカウント
    byVenue: VENUES.map((v) => ({
      ...v,
      count: applicants.filter((a) => {
        const val = a[v.key]
        if (!val || val === '' || val === '0') return false
        // "1枚", "2枚" のような文字列から数値を取り出して0より大きいか確認
        const num = parseInt(String(val).replace(/[^0-9]/g, ''), 10)
        return !isNaN(num) && num > 0
      }).length,
    })),
  }

  return <ApplicantsClient applicants={applicants as any} stats={stats} venues={VENUES} />
}
