'use client'

import { useState, useCallback, useRef } from 'react'
import { decodeText } from '@/lib/encoding'

const STATUS_OPTIONS = [
  { value: '購入済み', label: '購入済み' },
  { value: '一部購入', label: '一部購入' },
  { value: 'キャンセル', label: 'キャンセル' },
  { value: '返金済み', label: '返金済み' },
  { value: '', label: '未購入（リセット）' },
]

type Result = {
  updated: number
  not_found: string[]
}

export default function BulkStatusClient() {
  const [rawText, setRawText] = useState('')
  const [status, setStatus] = useState('購入済み')
  const [parsedIds, setParsedIds] = useState<string[]>([])
  const [step, setStep] = useState<'input' | 'confirm' | 'done'>('input')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // テキストからLINE IDを抽出
  const parseIds = useCallback((text: string): string[] => {
    return text
      .split(/[\n\r,\t]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.startsWith('U'))
  }, [])

  // ファイル読み込み（文字コード自動判定）
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

  // プレビューへ
  const handlePreview = useCallback(() => {
    const ids = parseIds(rawText)
    setParsedIds(ids)
    setStep('confirm')
  }, [rawText, parseIds])

  // 一括実行
  const handleExecute = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/applicants/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_ids: parsedIds, purchase_status: status }),
      })
      const data = await res.json()
      setResult(data)
      setStep('done')
    } catch {
      setResult({ updated: 0, not_found: [] })
      setStep('done')
    } finally {
      setLoading(false)
    }
  }, [parsedIds, status])

  // リセット
  const reset = () => {
    setRawText('')
    setParsedIds([])
    setStep('input')
    setResult(null)
    setStatus('購入済み')
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">購入状況 一括変更</h1>
        <p className="text-sm text-muted-foreground mt-1">
          LINE IDをテキスト貼り付けまたはファイルで指定し、購入状況をまとめて変更します
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['LINE ID入力', '確認', '完了'].map((label, i) => {
          const stepIndex = i === 0 ? 'input' : i === 1 ? 'confirm' : 'done'
          const isActive = step === stepIndex
          const isDone = (step === 'confirm' && i === 0) || (step === 'done' && i < 2)
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-px ${isDone ? 'bg-accent' : 'bg-border'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isActive ? 'bg-primary text-primary-foreground' : isDone ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
              }`}>
                <span>{i + 1}</span>
                <span>{label}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="space-y-4">
          {/* Status selection */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <label className="block text-sm font-medium text-foreground">変更する購入状況</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    status === opt.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <label className="block text-sm font-medium text-foreground">ファイルアップロード</label>
            <p className="text-xs text-muted-foreground">LINE IDが1行ごとに記載されたファイル（Shift_JIS / UTF-8 自動判定）</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={handleFile}
              className="block w-full text-sm text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground file:cursor-pointer hover:file:bg-primary/90"
            />
          </div>

          {/* Text paste */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <label className="block text-sm font-medium text-foreground">テキスト貼り付け</label>
            <p className="text-xs text-muted-foreground">LINE IDを1行ずつ、またはカンマ・タブ区切りで入力してください（Uから始まるIDを自動抽出）</p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={8}
              placeholder={'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nUyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy\n...'}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm text-foreground font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-y"
            />
          </div>

          {/* Preview count */}
          {rawText && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
              <p className="text-sm text-accent font-medium">
                {parseIds(rawText).length} 件のLINE IDを検出しました
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handlePreview}
              disabled={parseIds(rawText).length === 0}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              次へ：確認
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">一括変更内容の確認</p>
                <p className="text-xs text-muted-foreground mt-0.5">以下のLINE IDの購入状況を変更します</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                status ? 'bg-accent/15 text-accent' : 'bg-muted text-muted-foreground'
              }`}>
                {status || '未購入（リセット）'}
              </div>
            </div>

            <div className="flex items-center gap-4 py-3 border-y border-border">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{parsedIds.length}</p>
                <p className="text-xs text-muted-foreground">対象LINE ID</p>
              </div>
            </div>

            {/* ID一覧 */}
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">#</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">LINE User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedIds.map((id, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-2 font-mono text-xs">{id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground hover:opacity-80 transition-opacity"
            >
              戻る
            </button>
            <button
              onClick={handleExecute}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <span className="w-4 h-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />}
              {parsedIds.length}件を「{status || '未購入'}」に変更する
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && result && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-foreground">一括変更が完了しました</p>

            <div className="flex justify-center gap-8">
              <div>
                <p className="text-3xl font-bold text-accent">{result.updated}</p>
                <p className="text-xs text-muted-foreground mt-1">件を更新</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-muted-foreground">{result.not_found.length}</p>
                <p className="text-xs text-muted-foreground mt-1">件が見つからず</p>
              </div>
            </div>

            {result.not_found.length > 0 && (
              <div className="mt-4 text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">見つからなかったLINE ID</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {result.not_found.map((id, i) => (
                    <p key={i} className="text-xs font-mono text-amber-700 dark:text-amber-300">{id}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={reset}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              別の一括変更を行う
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
