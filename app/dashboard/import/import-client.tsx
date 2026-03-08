'use client'

import { useState, useCallback, useRef } from 'react'

// 文字コード自動判定（Shift_JIS / UTF-8 / EUC-JP）
function detectEncoding(bytes: Uint8Array): string {
  // BOM判定
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8'
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le'
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be'

  let sjisScore = 0
  let eucScore = 0
  let utf8Score = 0

  for (let i = 0; i < bytes.length - 1; i++) {
    const b = bytes[i]
    const b2 = bytes[i + 1]

    // Shift_JIS: 第1バイト 0x81-0x9F or 0xE0-0xFC, 第2バイト 0x40-0x7E or 0x80-0xFC
    if ((b >= 0x81 && b <= 0x9F) || (b >= 0xE0 && b <= 0xFC)) {
      if ((b2 >= 0x40 && b2 <= 0x7E) || (b2 >= 0x80 && b2 <= 0xFC)) {
        sjisScore += 2
        i++
        continue
      }
    }

    // EUC-JP: 第1バイト 0xA1-0xFE, 第2バイト 0xA1-0xFE
    if (b >= 0xA1 && b <= 0xFE && b2 >= 0xA1 && b2 <= 0xFE) {
      eucScore += 2
      i++
      continue
    }

    // UTF-8 multibyte: 110xxxxx 10xxxxxx / 1110xxxx 10xxxxxx 10xxxxxx
    if (b >= 0xC2 && b <= 0xDF && b2 >= 0x80 && b2 <= 0xBF) {
      utf8Score += 2
      i++
      continue
    }
    if (b >= 0xE0 && b <= 0xEF && i + 2 < bytes.length) {
      if (b2 >= 0x80 && b2 <= 0xBF && bytes[i + 2] >= 0x80 && bytes[i + 2] <= 0xBF) {
        utf8Score += 3
        i += 2
        continue
      }
    }
  }

  if (utf8Score >= sjisScore && utf8Score >= eucScore) return 'utf-8'
  if (sjisScore >= eucScore) return 'shift_jis'
  return 'euc-jp'
}

function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const encoding = detectEncoding(bytes)
  const decoder = new TextDecoder(encoding)
  return decoder.decode(bytes)
}

// DBカラム定義
const DB_COLUMNS = [
  { key: 'line_username',   label: 'LINEユーザー名',    required: false },
  { key: 'line_user_id',    label: 'LINE User ID',       required: false },
  { key: 'applied_at',      label: '回答日時',            required: false },
  { key: 'status',          label: 'ステータス',           required: false },
  { key: 'real_name',       label: 'お名前',              required: false },
  { key: 'email',           label: 'メールアドレス',       required: false },
  { key: 'phone',           label: '電話番号',             required: false },
  { key: 'prefecture',      label: '都道府県',             required: false },
  { key: 'yonago_524',      label: '米子 5/24',           required: false },
  { key: 'kumamoto_719',    label: '熊本 7/19',           required: false },
  { key: 'nagasaki_801',    label: '長崎 8/1',            required: false },
  { key: 'oita_802',        label: '大分 8/2',            required: false },
  { key: 'shimane_1003',    label: '島根 10/3',           required: false },
  { key: 'matsuyama_1011',  label: '松山 10/11',          required: false },
  { key: 'aomori_1017',     label: '青森 10/17',          required: false },
  { key: 'purchase_status', label: '購入ステータス',       required: false },
  { key: '__skip__',        label: '（スキップ）',         required: false },
]

// ヘッダーからDBカラムを自動推測
function guessMapping(headers: string[]): Record<number, string> {
  const patterns: { pattern: RegExp; key: string }[] = [
    { pattern: /ユーザー名|LINE名/i,              key: 'line_username'   },
    { pattern: /LINE User ID|line_user_id/i,    key: 'line_user_id'    },
    { pattern: /回答日時|applied_at/i,            key: 'applied_at'      },
    { pattern: /ステータス|status/i,              key: 'status'          },
    { pattern: /お名前|氏名|real_name/i,          key: 'real_name'       },
    { pattern: /メールアドレス|email/i,            key: 'email'           },
    { pattern: /電話番号|phone/i,                 key: 'phone'           },
    { pattern: /都道府県|prefecture/i,            key: 'prefecture'      },
    { pattern: /米子|yonago/i,                   key: 'yonago_524'      },
    { pattern: /熊本|kumamoto/i,                 key: 'kumamoto_719'    },
    { pattern: /長崎|nagasaki/i,                 key: 'nagasaki_801'    },
    { pattern: /大分|oita/i,                     key: 'oita_802'        },
    { pattern: /島根|shimane/i,                  key: 'shimane_1003'    },
    { pattern: /松山|matsuyama/i,                key: 'matsuyama_1011'  },
    { pattern: /青森|aomori/i,                   key: 'aomori_1017'     },
    { pattern: /購入|purchase|決済|支払/i,        key: 'purchase_status' },
    { pattern: /同意します/i,                     key: '__skip__'        },
  ]

  const mapping: Record<number, string> = {}
  headers.forEach((h, i) => {
    const match = patterns.find((p) => p.pattern.test(h))
    mapping[i] = match ? match.key : '__skip__'
  })
  return mapping
}

// TSV/CSVパーサー（タブ区切り優先）
function parseText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.trim().split('\n').map((l) => l.trimEnd())
  if (lines.length === 0) return { headers: [], rows: [] }
  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const headers = lines[0].split(delimiter).map((h) => h.trim())
  const rows = lines.slice(1).map((l) => l.split(delimiter).map((c) => c.trim()))
  return { headers, rows }
}

type PreviewRow = {
  index: number
  row: Record<string, string>
  isDuplicate: boolean
}

type Step = 'input' | 'mapping' | 'preview' | 'done'

export default function ImportClient() {
  const [step, setStep] = useState<Step>('input')
  const [rawText, setRawText] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [previewData, setPreviewData] = useState<{
    total: number; duplicates: number; new: number; rows: PreviewRow[]
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleParse = useCallback(() => {
    const { headers: h, rows: r } = parseText(rawText)
    if (h.length === 0) return
    setHeaders(h)
    setRawRows(r)
    setMapping(guessMapping(h))
    setStep('mapping')
  }, [rawText])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      const text = decodeText(buffer)
      setRawText(text)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const buildRows = useCallback(() => {
    return rawRows.map((row) => {
      const obj: Record<string, string> = {}
      Object.entries(mapping).forEach(([colIdx, dbKey]) => {
        if (dbKey === '__skip__') return
        const val = row[Number(colIdx)] ?? ''
        if (dbKey in obj) {
          // 同じDBカラムに複数マッピングされた場合はスペース結合
          if (obj[dbKey]) obj[dbKey] += ' ' + val
          else obj[dbKey] = val
        } else {
          obj[dbKey] = val
        }
      })
      return obj
    }).filter((r) => r.line_user_id || r.email || r.real_name || r.line_username) // 識別子が何もない行のみ除外
  }, [rawRows, mapping])

  const handlePreview = useCallback(async () => {
    setLoading(true)
    const rows = buildRows()
    const res = await fetch('/api/applicants/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, mode: 'preview' }),
    })
    const data = await res.json()
    setPreviewData(data)
    setStep('preview')
    setLoading(false)
  }, [buildRows])

  const handleImport = useCallback(async () => {
    setLoading(true)
    // 常に全件送信（重複はサーバー側でUPDATEする）
    const rows = buildRows()
    const res = await fetch('/api/applicants/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows, mode: 'import' }),
    })
    const data = await res.json()
    setResult(data)
    setStep('done')
    setLoading(false)
  }, [buildRows])

  const reset = () => {
    setStep('input')
    setRawText('')
    setHeaders([])
    setRawRows([])
    setMapping({})
    setPreviewData(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">申込者データインポート</h1>
        <p className="text-sm text-muted-foreground mt-1">TSV・CSVファイルまたはテキストを貼り付けてインポートできます（Shift_JIS / UTF-8 / EUC-JP 自動判定）</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(['input', 'mapping', 'preview', 'done'] as Step[]).map((s, i) => {
          const labels = ['データ入力', 'カラム対応', 'プレビュー確認', '完了']
          const isActive = step === s
          const isPast = ['input','mapping','preview','done'].indexOf(step) > i
          return (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-8 ${isPast || isActive ? 'bg-primary' : 'bg-border'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' :
                isPast ? 'bg-primary/20 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                <span>{i + 1}</span>
                <span>{labels[i]}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 1: Data Input */}
      {step === 'input' && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-base font-semibold text-foreground">データを入力</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">ファイルを選択（TSV/CSV）</label>
            <input
              ref={fileRef}
              type="file"
              accept=".tsv,.csv,.txt"
              onChange={handleFile}
              className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">または</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">テキストを貼り付け（タブ区切り・カンマ区切り対応）</label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="ヘッダー行を含むデータをここに貼り付けてください..."
              rows={10}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
            <p className="text-xs text-muted-foreground">
              {rawText ? `${rawText.trim().split('\n').length} 行検出` : ''}
            </p>
          </div>
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            次へ：カラム対応を確認
          </button>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">カラムの対応確認</h2>
            <span className="text-xs text-muted-foreground">{headers.length}列・{rawRows.length}行のデータ</span>
          </div>
          <p className="text-sm text-muted-foreground">インポートデータのヘッダーと、システムのカラムの対応を確認・修正してください。</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground border border-border w-8">#</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground border border-border">インポートファイルのヘッダー</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground border border-border">サンプルデータ</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground border border-border">対応するDBカラム</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => {
                  const sample = rawRows.slice(0, 3).map((r) => r[i] ?? '').filter(Boolean).join(' / ')
                  const currentMapping = mapping[i] ?? '__skip__'
                  const isRequired = DB_COLUMNS.find((c) => c.key === currentMapping)?.required
                  return (
                    <tr key={i} className={`border-b border-border ${currentMapping === '__skip__' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2 text-xs text-muted-foreground border border-border">{i + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs text-foreground border border-border max-w-48 truncate">{h}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground border border-border max-w-48 truncate">{sample || '—'}</td>
                      <td className="px-4 py-2 border border-border">
                        <select
                          value={currentMapping}
                          onChange={(e) => setMapping((prev) => ({ ...prev, [i]: e.target.value }))}
                          className={`w-full px-2 py-1 text-xs rounded-md border focus:outline-none focus:ring-1 focus:ring-ring
                            ${currentMapping === '__skip__'
                              ? 'border-border bg-muted text-muted-foreground'
                              : isRequired
                              ? 'border-primary/50 bg-primary/5 text-foreground'
                              : 'border-border bg-background text-foreground'
                            }`}
                        >
                          {DB_COLUMNS.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}{c.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handlePreview}
              disabled={loading}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
              次へ：プレビューと重複確認
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === 'preview' && previewData && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground">入力件数</p>
              <p className="text-3xl font-bold text-foreground mt-1">{previewData.originalTotal ?? previewData.total}</p>
            </div>
            {(previewData.skippedDuplicates ?? 0) > 0 && (
              <div className="bg-card rounded-xl border border-blue-400/30 bg-blue-50 p-4 text-center">
                <p className="text-xs text-muted-foreground">データ内重複除去</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{previewData.skippedDuplicates}</p>
              </div>
            )}
            <div className="bg-card rounded-xl border border-accent/30 bg-accent/5 p-4 text-center">
              <p className="text-xs text-muted-foreground">新規登録</p>
              <p className="text-3xl font-bold text-accent mt-1">{previewData.new}</p>
            </div>
            <div className="bg-card rounded-xl border border-amber-400/30 bg-amber-50 p-4 text-center">
              <p className="text-xs text-muted-foreground">重複（既存→更新）</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{previewData.duplicates}</p>
            </div>
          </div>

          {previewData.new > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-emerald-800">{previewData.new}件の新規データが登録されます</p>
                <p className="text-xs text-emerald-700 mt-0.5">緑色の行は新規ユーザーとしてデータベースに追加されます。</p>
              </div>
            </div>
          )}

          {previewData.duplicates > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">{previewData.duplicates}件の重複データが見つかりました</p>
                <p className="text-xs text-amber-700 mt-0.5">オレンジ色の行は既にデータベースに存在します。インポートすると既存データが<strong>更新</strong>されます（空欄はそのまま保持）。</p>
              </div>
            </div>
          )}

          {/* Preview table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">インポートプレビュー</h3>
              <span className="text-xs text-muted-foreground">上位100件を表示</span>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">状態</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">LINE名</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">LINE User ID</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">氏名</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">メール</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">都道府県</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">米子</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">熊本</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">長崎</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">大分</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">島根</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">松山</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">青森</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">購入状況</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.rows.slice(0, 100).map(({ index, row, isDuplicate }) => (
                    <tr
                      key={index}
                      className={`border-b border-border last:border-0 ${
                        isDuplicate ? 'bg-amber-50/80' : 'bg-emerald-50/60'
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {isDuplicate ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            重複
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            新規
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-foreground">{row.line_username}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-muted-foreground text-xs max-w-28 truncate">{row.line_user_id}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-foreground">{row.real_name}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-36 truncate">{row.email}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{row.prefecture}</td>
                      {(['yonago_524','kumamoto_719','nagasaki_801','oita_802','shimane_1003','matsuyama_1011','aomori_1017'] as const).map((k) => (
                        <td key={k} className="px-3 py-2 text-center">
                          {row[k] ? (
                            <span className="inline-block bg-accent/15 text-accent font-medium px-1.5 py-0.5 rounded">
                              {row[k]}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 whitespace-nowrap">
                        {row.purchase_status ? (
                          <span className="inline-block bg-primary/15 text-primary font-medium px-1.5 py-0.5 rounded text-xs">
                            {row.purchase_status}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep('mapping')}
              className="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
              {`${previewData.new}件を新規登録・${previewData.duplicates}件を更新`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && result && (
        <div className="bg-card rounded-xl border border-border p-8 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">インポート完了</h2>
          <div className="flex justify-center gap-8">
            <div>
              <p className="text-3xl font-bold text-accent">{result.inserted}</p>
              <p className="text-xs text-muted-foreground mt-1">件を新規登録</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">{result.updated}</p>
              <p className="text-xs text-muted-foreground mt-1">件を更新</p>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-left">
              <p className="text-sm font-medium text-destructive mb-2">エラー（{result.errors.length}件）</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-destructive/80">{e}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={reset}
              className="px-5 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              続けてインポート
            </button>
            <a
              href="/dashboard"
              className="px-5 py-2 border border-border text-sm font-medium rounded-lg text-foreground hover:bg-muted transition-colors"
            >
              申込者一覧へ
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
