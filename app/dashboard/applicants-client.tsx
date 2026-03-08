'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Applicant = {
  id: number
  line_username: string
  line_user_id: string
  real_name: string
  email: string
  phone: string
  prefecture: string
  applied_at: string
  status: string
  yonago_524: string | null
  kumamoto_719: string | null
  nagasaki_801: string | null
  oita_802: string | null
  shimane_1003: string | null
  matsuyama_1011: string | null
  aomori_1017: string | null
  purchase_status: string
}

type Venue = { key: string; label: string; shortLabel: string }
type Stats = { total: number; byVenue: (Venue & { count: number })[] }

const VENUE_KEYS = [
  'yonago_524', 'kumamoto_719', 'nagasaki_801', 'oita_802',
  'shimane_1003', 'matsuyama_1011', 'aomori_1017',
] as const

// 全件削除の確認文言
const DELETE_ALL_CONFIRM_TEXT = '全件削除'

export default function ApplicantsClient({
  applicants: initialApplicants,
  stats: initialStats,
  venues,
}: {
  applicants: Applicant[]
  stats: Stats
  venues: Venue[]
}) {
  const router = useRouter()
  const [applicants, setApplicants] = useState(initialApplicants)
  const [stats, setStats] = useState(initialStats)
  const [search, setSearch] = useState('')
  const [prefFilter, setPrefFilter] = useState('')
  const [venueFilter, setVenueFilter] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // 削除確認ダイアログ
  const [dialog, setDialog] = useState<
    | { type: 'single'; id: number; name: string }
    | { type: 'bulk'; count: number }
    | { type: 'all'; confirmText: string }
    | null
  >(null)

  const prefectures = useMemo(() => {
    const set = new Set(applicants.map((a) => a.prefecture).filter(Boolean))
    return Array.from(set).sort()
  }, [applicants])

  const filtered = useMemo(() => {
    return applicants.filter((a) => {
      const matchSearch =
        search === '' ||
        a.real_name?.includes(search) ||
        a.line_username?.includes(search) ||
        a.email?.includes(search) ||
        a.phone?.includes(search)
      const matchPref = prefFilter === '' || a.prefecture === prefFilter
      const matchVenue = venueFilter === '' || a[venueFilter as keyof Applicant] != null
      const matchPurchase =
        purchaseFilter === '' ||
        (purchaseFilter === 'purchased' && a.purchase_status) ||
        (purchaseFilter === 'not_purchased' && !a.purchase_status)
      return matchSearch && matchPref && matchVenue && matchPurchase
    })
  }, [applicants, search, prefFilter, venueFilter, purchaseFilter])

  function handleVenueCardClick(key: string) {
    setVenueFilter((prev) => (prev === key ? '' : key))
  }

  // 選択系
  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id))
  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((a) => next.delete(a.id))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        filtered.forEach((a) => next.add(a.id))
        return next
      })
    }
  }
  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // 削除実行
  const execDelete = useCallback(async (url: string, removePredicate: (a: Applicant) => boolean) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(url, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error ?? `削除に失敗しました (HTTP ${res.status})`)
      }
      // ローカル状態を更新
      setApplicants((prev) => {
        const next = prev.filter((a) => !removePredicate(a))
        const total = next.length
        const byVenue = venues.map((v) => ({
          ...v,
          count: next.filter((a) => a[v.key as keyof Applicant] != null).length,
        }))
        setStats({ total, byVenue })
        return next
      })
      setSelected(new Set())
      setDialog(null)
    } catch (e) {
      setErrorMsg((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [venues])

  function handleDeleteSingle(id: number) {
    execDelete(`/api/applicants?ids=${id}`, (a) => a.id === id)
  }
  function handleDeleteBulk() {
    const ids = Array.from(selected)
    execDelete(`/api/applicants?ids=${ids.join(',')}`, (a) => selected.has(a.id))
  }
  function handleDeleteAll() {
    execDelete('/api/applicants?all=true', () => true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">申込者一覧</h1>
          <p className="text-sm text-muted-foreground mt-1">
            会場カードをクリックすると絞り込みができます
          </p>
        </div>
        <button
          onClick={() => setDialog({ type: 'all', confirmText: '' })}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/5 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          全件削除
        </button>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-destructive">削除エラー</p>
              <p className="text-xs text-destructive/80 mt-0.5">{errorMsg}</p>
            </div>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-destructive/60 hover:text-destructive text-lg leading-none">×</button>
        </div>
      )}

      {/* Total card */}
      <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">総申込者数</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.total}
            <span className="text-sm font-normal text-muted-foreground ml-1">名</span>
          </p>
        </div>
      </div>

      {/* Venue stats */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          会場別申込者数　<span className="normal-case font-normal">（クリックで絞り込み）</span>
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {stats.byVenue.map((v) => {
            const active = venueFilter === v.key
            return (
              <button
                key={v.key}
                onClick={() => handleVenueCardClick(v.key)}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring ${
                  active
                    ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-primary/5'
                }`}
              >
                <p className={`text-xs font-medium mb-1 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                  {v.shortLabel}
                </p>
                <p className={`text-2xl font-bold ${active ? 'text-primary' : 'text-foreground'}`}>{v.count}</p>
                <p className={`text-xs mt-0.5 ${active ? 'text-primary/70' : 'text-muted-foreground'}`}>名</p>
                {active && (
                  <span className="mt-2 inline-block text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                    絞込中
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="名前・メール・電話番号で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={prefFilter}
          onChange={(e) => setPrefFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">都道府県（全て）</option>
          {prefectures.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select
          value={venueFilter}
          onChange={(e) => setVenueFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">会場（全て）</option>
          {venues.map((v) => (
            <option key={v.key} value={v.key}>{v.label}</option>
          ))}
        </select>
        <select
          value={purchaseFilter}
          onChange={(e) => setPurchaseFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">購入状況（全て）</option>
          <option value="purchased">購入済み</option>
          <option value="not_purchased">未購入</option>
        </select>
        {(search || prefFilter || venueFilter || purchaseFilter) && (
          <button
            onClick={() => { setSearch(''); setPrefFilter(''); setVenueFilter(''); setPurchaseFilter('') }}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity"
          >
            クリア
          </button>
        )}
        <span className="text-sm text-muted-foreground font-medium">
          {filtered.length} / {applicants.length} 件
        </span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-primary">{selected.size} 件を選択中</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground hover:opacity-80 transition-opacity"
            >
              選択解除
            </button>
            <button
              onClick={async () => {
                const ids = Array.from(selected)
                const res = await fetch('/api/campaigns', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: `選択した${ids.length}名への配信`,
                    message_body: '{name}様\n\n',
                    delivery_type: 'line',
                    target_ids: ids,
                    status: 'draft',
                    target_filter: {},
                  }),
                })
                if (res.ok) {
                  router.push('/dashboard/messages')
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              選択した{selected.size}名に配信
            </button>
            <button
              onClick={() => setDialog({ type: 'bulk', count: selected.size })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              削除
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allFilteredSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-border cursor-pointer"
                    aria-label="全選択"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">氏名</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">LINE名</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">都道府県</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">メール</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">電話</th>
                {venues.map((v) => (
                  <th
                    key={v.key}
                    className={`text-center px-3 py-3 font-medium whitespace-nowrap text-xs ${
                      venueFilter === v.key ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {v.shortLabel}
                  </th>
                ))}
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">購入状況</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">申込日時</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-muted-foreground">
                    該当する申込者がいません
                  </td>
                </tr>
              ) : (
                filtered.map((a, i) => (
                  <tr
                    key={a.id}
                    className={`border-b border-border last:border-0 transition-colors ${
                      selected.has(a.id)
                        ? 'bg-primary/5'
                        : i % 2 === 0
                        ? 'hover:bg-muted/30'
                        : 'bg-muted/10 hover:bg-muted/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggleSelect(a.id)}
                        className="rounded border-border cursor-pointer"
                        aria-label={`${a.real_name}を選択`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">{a.real_name}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{a.line_username ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{a.prefecture}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-40 truncate">{a.email}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{a.phone}</td>
                    {VENUE_KEYS.map((key) => (
                      <td key={key} className="px-3 py-3 text-center">
                        {a[key] ? (
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                            venueFilter === key
                              ? 'bg-primary/20 text-primary'
                              : 'bg-accent/15 text-accent'
                          }`}>
                            {a[key]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/25">—</span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <select
                        value={a.purchase_status ?? ''}
                        onChange={async (e) => {
                          const val = e.target.value
                          await fetch('/api/applicants', {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: a.id, purchase_status: val || null }),
                          })
                          setApplicants((prev) =>
                            prev.map((x) => x.id === a.id ? { ...x, purchase_status: val } : x)
                          )
                        }}
                        className={`text-xs px-2 py-1 rounded-md border focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer ${
                          a.purchase_status
                            ? 'border-accent/40 bg-accent/10 text-accent font-medium'
                            : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        <option value="">未購入</option>
                        <option value="購入済み">購入済み</option>
                        <option value="一部購入">一部購入</option>
                        <option value="キャンセル">キャンセル</option>
                        <option value="返金済み">返金済み</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {a.applied_at ? new Date(a.applied_at).toLocaleString('ja-JP') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDialog({ type: 'single', id: a.id, name: a.real_name ?? a.line_username ?? `ID:${a.id}` })}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        aria-label="削除"
                        title="削除"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation dialogs */}
      {dialog && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !loading && setDialog(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {dialog.type === 'single' && (
              <>
                <h2 className="text-lg font-bold text-foreground text-center">申込者を削除しますか？</h2>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  <span className="font-medium text-foreground">{dialog.name}</span> のデータを削除します。この操作は元に戻せません。
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setDialog(null)}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleDeleteSingle(dialog.id)}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                  >
                    {loading && <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />}
                    削除する
                  </button>
                </div>
              </>
            )}

            {dialog.type === 'bulk' && (
              <>
                <h2 className="text-lg font-bold text-foreground text-center">{dialog.count}件を削除しますか？</h2>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  選択した <span className="font-medium text-foreground">{dialog.count}件</span> のデータをまとめて削除します。この操作は元に戻せません。
                </p>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setDialog(null)}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteBulk}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                  >
                    {loading && <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />}
                    {dialog.count}件を削除する
                  </button>
                </div>
              </>
            )}

            {dialog.type === 'all' && (
              <>
                <h2 className="text-lg font-bold text-foreground text-center">全件削除しますか？</h2>
                <p className="text-sm text-muted-foreground text-center mt-2">
                  申込者データを<strong className="text-destructive">すべて削除</strong>します。この操作は元に戻せません。<br />
                  続けるには <span className="font-mono font-bold text-foreground bg-muted px-1 rounded">全件削除</span> と入力してください。
                </p>
                <input
                  type="text"
                  value={dialog.confirmText}
                  onChange={(e) => setDialog({ ...dialog, confirmText: e.target.value })}
                  placeholder="全件削除"
                  className="mt-4 w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50 text-center font-mono"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setDialog(null)}
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-secondary text-secondary-foreground hover:opacity-80 transition-opacity"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteAll}
                    disabled={loading || dialog.confirmText !== DELETE_ALL_CONFIRM_TEXT}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading && <span className="w-4 h-4 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />}
                    全件削除する
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
