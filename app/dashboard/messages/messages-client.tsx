'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Campaign = {
  id: number
  title: string
  message_body: string
  email_subject: string | null
  delivery_type: string
  status: string
  total_targets: number
  sent_count: number
  created_at: string
  sent_at: string | null
  created_by_name: string
  target_filter: Record<string, string>
  target_ids: number[] | null
}

type Product = {
  id: number
  venue_key: string
  venue_label: string
  ticket_count: number
  quick_url_id: string | null
  liff_url: string | null
  miniapp_url: string | null
}

type Recipient = {
  id: number
  real_name: string | null
  line_username: string | null
  email: string | null
  delivery_status: string
  log_delivery_type: string
  log_sent_at: string
}

const VENUES = [
  { key: 'yonago_524', label: '米子 5/24', short: '米子' },
  { key: 'kumamoto_719', label: '熊本 7/19', short: '熊本' },
  { key: 'nagasaki_801', label: '長崎 8/1', short: '長崎' },
  { key: 'oita_802', label: '大分 8/2', short: '大分' },
  { key: 'shimane_1003', label: '島根 10/3', short: '島根' },
  { key: 'matsuyama_1011', label: '松山 10/11', short: '松山' },
  { key: 'aomori_1017', label: '青森 10/17', short: '青森' },
]

const PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県',
]

const DELIVERY_LABELS: Record<string, string> = { line: 'LINE', email: 'メール', both: 'LINE + メール' }
const VENUE_TAG_PREFIX: Record<string, string> = {
  yonago_524: 'yonago', kumamoto_719: 'kumamoto', nagasaki_801: 'nagasaki',
  oita_802: 'oita', shimane_1003: 'shimane', matsuyama_1011: 'matsuyama', aomori_1017: 'aomori',
}
const BASE_TAGS = [
  { tag: '{name}', desc: 'お名前' }, { tag: '{line_name}', desc: 'LINE名' },
  { tag: '{email}', desc: 'メール' }, { tag: '{phone}', desc: '電話番号' }, { tag: '{prefecture}', desc: '都道府県' },
]
const AUTO_TAGS = [
  { tag: '{auto_venues_quick}', desc: '申込済み全会場の QUICK URL を自動出力' },
  { tag: '{auto_venues_mini}', desc: '申込済み全会場のミニアプリURLを自動出力' },
]

export default function MessagesClient({ campaigns: initialCampaigns }: { campaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [products, setProducts] = useState<Product[]>([])
  // 初期タブを決定：送信済みがあればそちらを表示、なければ下書き
  const [tab, setTab] = useState<'draft' | 'sent'>(
    initialCampaigns.some((c) => c.status === 'sent') ? 'sent' : 'draft'
  )
  const [editingId, setEditingId] = useState<number | null>(null) // null = new
  const [showForm, setShowForm] = useState(false)
  const [tagTabVenue, setTagTabVenue] = useState('')

  // Form
  const [title, setTitle] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [deliveryType, setDeliveryType] = useState<'line' | 'email' | 'both'>('line')
  const [targetVenue, setTargetVenue] = useState('')
  const [targetPref, setTargetPref] = useState('')

  // UI
  const [submitting, setSubmitting] = useState(false)
  const [sending, setSending] = useState<number | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  // Recipients modal
  const [recipientsCampaignId, setRecipientsCampaignId] = useState<number | null>(null)
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [recipientsLoading, setRecipientsLoading] = useState(false)

  useEffect(() => {
    fetch('/api/products').then((r) => r.json()).then(setProducts).catch(() => {})
  }, [])

  const tagVenueProducts = tagTabVenue ? products.filter((p) => p.venue_key === tagTabVenue) : []

  const insertToMessage = useCallback((text: string) => {
    const ta = taRef.current
    if (!ta) { setMessageBody((prev) => prev + text); return }
    const start = ta.selectionStart ?? messageBody.length
    const end = ta.selectionEnd ?? messageBody.length
    const next = messageBody.slice(0, start) + text + messageBody.slice(end)
    setMessageBody(next)
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + text.length; ta.focus() }, 0)
  }, [messageBody])

  function resetForm() {
    setTitle(''); setMessageBody(''); setEmailSubject(''); setDeliveryType('line')
    setTargetVenue(''); setTargetPref(''); setTagTabVenue(''); setEditingId(null)
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id)
    setTitle(c.title)
    setMessageBody(c.message_body)
    setEmailSubject(c.email_subject ?? '')
    setDeliveryType(c.delivery_type as 'line' | 'email' | 'both')
    setTargetVenue(c.target_filter?.venue ?? '')
    setTargetPref(c.target_filter?.prefecture ?? '')
    setShowForm(true)
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSubmitting(true)
    const payload = {
      ...(editingId ? { id: editingId } : {}),
      title, message_body: messageBody,
      email_subject: emailSubject || null, delivery_type: deliveryType, status: 'draft',
      target_filter: { ...(targetVenue ? { venue: targetVenue } : {}), ...(targetPref ? { prefecture: targetPref } : {}) },
    }
    const method = editingId ? 'PATCH' : 'POST'
    const res = await fetch('/api/campaigns', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) { setError(data.error ?? '保存失敗'); return }

    if (editingId) {
      setCampaigns((prev) => prev.map((c) => c.id === editingId ? data : c))
    } else {
      setCampaigns((prev) => [data, ...prev])
    }
    setShowForm(false); resetForm()
    setSuccess(editingId ? '下書きを更新しました' : '下書きを保存しました')
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleSend(id: number) {
    setSending(id); setError('')
    const res = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' })
    const data = await res.json()
    setSending(null); setConfirmId(null)
    if (!res.ok) { setError(data.error ?? '送信失敗'); return }
    setSuccess(`${data.sent_count}件に${DELIVERY_LABELS[data.delivery_type] ?? ''}を送信しました`)
    setTimeout(() => setSuccess(''), 4000)
    setCampaigns((prev) => prev.map((c) => c.id === id ? { ...c, status: 'sent', sent_count: data.sent_count, sent_at: new Date().toISOString() } : c))
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/campaigns?id=${id}`, { method: 'DELETE' })
    if (res.ok) setCampaigns((prev) => prev.filter((c) => c.id !== id))
  }

  async function openRecipients(campaignId: number) {
    setRecipientsCampaignId(campaignId); setRecipientsLoading(true)
    const res = await fetch(`/api/campaigns/${campaignId}/recipients`)
    const data = await res.json()
    setRecipients(data); setRecipientsLoading(false)
  }

  const drafts = campaigns.filter((c) => c.status === 'draft')
  const sentList = campaigns.filter((c) => c.status === 'sent')
  const confirmCampaign = campaigns.find((c) => c.id === confirmId)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">配信管理</h1>
          <p className="text-sm text-muted-foreground mt-1">LINE / メール配信の作成・送信・履歴管理</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); setError('') }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          {editingId ? '編集中' : '新規作成'}
        </button>
      </div>

      {success && <div className="rounded-lg bg-accent/15 border border-accent/30 px-4 py-3 text-sm text-accent font-medium">{success}</div>}
      {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-base font-semibold text-foreground mb-5">{editingId ? '下書き編集' : '新規キャンペーン作成'}</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">タイトル <span className="text-destructive">*</span></label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="例：米子公演チケット購入のご案内"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">配信方法 <span className="text-destructive">*</span></label>
              <div className="flex gap-3">
                {(['line', 'email', 'both'] as const).map((t) => (
                  <label key={t} className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${deliveryType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-foreground hover:bg-secondary'}`}>
                    <input type="radio" name="dt" value={t} checked={deliveryType === t} onChange={() => setDeliveryType(t)} className="sr-only" />
                    {DELIVERY_LABELS[t]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">対象会場</label>
                <select value={targetVenue} onChange={(e) => setTargetVenue(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">全会場</option>
                  {VENUES.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">対象都道府県</label>
                <select value={targetPref} onChange={(e) => setTargetPref(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">全都道府県</option>
                  {PREFECTURES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {(deliveryType === 'email' || deliveryType === 'both') && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">件名（メール）</label>
                <input type="text" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="例：チケット購入URLのご案内"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            )}

            {/* Tag Panel */}
            <div className="rounded-xl border border-border bg-secondary/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                <span className="text-sm font-medium text-foreground">差し込みタグ</span>
                <span className="text-xs text-muted-foreground ml-1">クリックでカーソル位置に挿入</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">基本情報</p>
                  <div className="flex flex-wrap gap-2">
                    {BASE_TAGS.map(({ tag, desc }) => (
                      <button key={tag} type="button" onClick={() => insertToMessage(tag)} title={desc}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors text-xs">
                        <code className="text-primary font-mono">{tag}</code>
                        <span className="text-muted-foreground hidden sm:inline">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">自動会場タグ（複数会場申込者対応）</p>
                  <div className="flex flex-wrap gap-2">
                    {AUTO_TAGS.map(({ tag, desc }) => (
                      <button key={tag} type="button" onClick={() => insertToMessage(tag)} title={desc}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors text-xs">
                        <code className="text-accent font-mono">{tag}</code>
                        <span className="text-muted-foreground hidden sm:inline">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">商品URL（会場別）</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {VENUES.map((v) => (
                      <button key={v.key} type="button" onClick={() => setTagTabVenue((p) => p === v.key ? '' : v.key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${tagTabVenue === v.key ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40'}`}>
                        {v.short}
                      </button>
                    ))}
                  </div>
                  {tagTabVenue && tagVenueProducts.length > 0 && (
                    <div className="space-y-2">
                      {[1,2,3,4].map((n) => {
                        const prod = tagVenueProducts.find((p) => p.ticket_count === n)
                        if (!prod) return null
                        const prefix = VENUE_TAG_PREFIX[tagTabVenue] ?? tagTabVenue
                        return (
                          <div key={n} className="p-3 rounded-lg bg-background border border-border">
                            <p className="text-xs font-medium text-foreground mb-2">{VENUES.find(v=>v.key===tagTabVenue)?.short} {n}枚</p>
                            <div className="flex flex-wrap gap-2">
                              {prod.liff_url && (
                                <button type="button" onClick={() => insertToMessage(`{${prefix}_${n}quick}`)}
                                  className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-xs font-mono">
                                  {`{${prefix}_${n}quick}`}
                                </button>
                              )}
                              {prod.miniapp_url && (
                                <button type="button" onClick={() => insertToMessage(`{${prefix}_${n}mini}`)}
                                  className="px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-colors text-xs font-mono">
                                  {`{${prefix}_${n}mini}`}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Message body */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">メッセージ本文 <span className="text-destructive">*</span></label>
              <textarea ref={taRef} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} required rows={8}
                placeholder="差し込みタグを使って個別のメッセージを作成できます。&#10;例: {name}様、チケット購入はこちら: {auto_venues_quick}"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-mono" />
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setShowForm(false); resetForm() }}
                className="px-4 py-2 text-sm rounded-lg border border-border bg-secondary text-secondary-foreground hover:opacity-80">キャンセル</button>
              <button type="submit" disabled={submitting}
                className="px-6 py-2 text-sm rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2">
                {submitting && <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />}
                {editingId ? '下書きを更新' : '下書きとして保存'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1">
        <button onClick={() => setTab('draft')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'draft' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          下書き ({drafts.length})
        </button>
        <button onClick={() => setTab('sent')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'sent' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
          送信済み ({sentList.length})
        </button>
      </div>

      {/* Campaign list */}
      <div className="space-y-3">
        {(tab === 'draft' ? drafts : sentList).length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {tab === 'draft' ? '下書きはありません' : '送信履歴はありません'}
          </div>
        )}

        {(tab === 'draft' ? drafts : sentList).map((c) => (
          <div key={c.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground truncate">{c.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    c.delivery_type === 'line' ? 'bg-accent/15 text-accent' :
                    c.delivery_type === 'email' ? 'bg-primary/15 text-primary' :
                    'bg-foreground/10 text-foreground'
                  }`}>{DELIVERY_LABELS[c.delivery_type] ?? c.delivery_type}</span>
                  {c.target_filter?.venue && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground border border-border">
                      {VENUES.find(v => v.key === c.target_filter.venue)?.label ?? c.target_filter.venue}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 font-mono mb-2">{c.message_body.slice(0, 120)}{c.message_body.length > 120 ? '...' : ''}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{new Date(c.created_at).toLocaleString('ja-JP')}</span>
                  {c.status === 'sent' ? (
                    <button
                      onClick={() => openRecipients(c.id)}
                      className="font-medium text-primary hover:underline cursor-pointer"
                    >
                      {c.sent_count}名に配信
                    </button>
                  ) : (
                    <span>対象: {c.total_targets}名</span>
                  )}
                  {c.target_ids && c.target_ids.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs">個別選択</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {c.status === 'draft' && (
                  <>
                    <button onClick={() => openEdit(c)} title="編集"
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setConfirmId(c.id)} disabled={sending === c.id}
                      className="px-3 py-1.5 text-xs rounded-lg bg-accent text-accent-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
                      {sending === c.id && <span className="w-3 h-3 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />}
                      送信
                    </button>
                    <button onClick={() => handleDelete(c.id)} title="削除"
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </>
                )}
                {c.status === 'sent' && c.sent_at && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.sent_at).toLocaleString('ja-JP')}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmId && confirmCampaign && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmId(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-foreground text-center">配信を実行しますか？</h2>
            <div className="mt-4 rounded-lg bg-secondary p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">タイトル</span><span className="font-medium text-foreground">{confirmCampaign.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">配信方法</span><span className="font-medium text-foreground">{DELIVERY_LABELS[confirmCampaign.delivery_type]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">配信対象</span><span className="font-medium text-foreground">{confirmCampaign.total_targets}名</span></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmId(null)} className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-secondary text-secondary-foreground hover:opacity-80">キャンセル</button>
              <button onClick={() => handleSend(confirmId)} disabled={sending !== null}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-accent text-accent-foreground font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {sending === confirmId && <span className="w-3.5 h-3.5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />}
                送信する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipients modal */}
      {recipientsCampaignId !== null && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setRecipientsCampaignId(null)}>
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">配信先一覧 ({recipients.length}名)</h2>
              <button onClick={() => setRecipientsCampaignId(null)} className="text-muted-foreground hover:text-foreground text-xl leading-none">x</button>
            </div>
            <div className="overflow-auto flex-1 p-4">
              {recipientsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : recipients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">配信先がありません</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">お名前</th>
                      <th className="pb-2 font-medium">LINE名</th>
                      <th className="pb-2 font-medium">メール</th>
                      <th className="pb-2 font-medium">配信方法</th>
                      <th className="pb-2 font-medium">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((r, i) => (
                      <tr key={r.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 font-medium text-foreground">{r.real_name ?? '---'}</td>
                        <td className="py-2 text-muted-foreground">{r.line_username ?? '---'}</td>
                        <td className="py-2 text-muted-foreground truncate max-w-40">{r.email ?? '---'}</td>
                        <td className="py-2"><span className="px-1.5 py-0.5 rounded text-xs bg-secondary text-secondary-foreground">{DELIVERY_LABELS[r.log_delivery_type] ?? r.log_delivery_type}</span></td>
                        <td className="py-2"><span className={`px-1.5 py-0.5 rounded text-xs ${r.delivery_status === 'success' ? 'bg-accent/15 text-accent' : 'bg-destructive/15 text-destructive'}`}>{r.delivery_status === 'success' ? '成功' : '失敗'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
