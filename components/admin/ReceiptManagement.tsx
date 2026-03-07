"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, Plus, Copy, Check, Mail, Settings, DownloadCloud } from "lucide-react"

interface Receipt {
  id: number
  receipt_number: string
  supporter_name: string
  amount: number
  proviso: string
  issued_date: string
  issuer_name: string
  issuer_address: string
  download_token: string
  email_sent: boolean
  email_sent_at?: string
  created_at: string
  pledge_id?: number
  supporter_email?: string
}

interface Template {
  id: number
  name: string
  issuer_name: string
  issuer_address?: string
  prefix: string
  next_number: number
  default_proviso: string
  logo_url?: string
  stamp_url?: string
  footer_note?: string
}

interface Pledge {
  id: number
  supporter_name: string
  supporter_email: string
  amount: number
  payment_status: string
  created_at: string
  existing_receipt?: string | null
}

interface Props {
  initialReceipts: Receipt[]
  template: Template | null
  pledges: Pledge[]
}

export default function ReceiptManagement({ initialReceipts, template, pledges }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)
  const [tab, setTab] = useState<"receipts" | "pledges" | "template">("receipts")
  const [supporterName, setSupporterName] = useState("")
  const [amount, setAmount] = useState("")
  const [proviso, setProviso] = useState(template?.default_proviso || "")
  const [notes, setNotes] = useState("")
  const [selectedPledgeId, setSelectedPledgeId] = useState<number | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [tplData, setTplData] = useState(template || {
    issuer_name: "",
    issuer_address: "",
    prefix: "GIF",
    default_proviso: "",
    logo_url: "",
    stamp_url: "",
    footer_note: "",
  })

  const reload = async () => {
    const res = await fetch("/api/admin/receipts")
    if (res.ok) setReceipts(await res.json())
  }

  const handleCreate = () => {
    if (!supporterName.trim() || !amount.trim()) return
    startTransition(async () => {
      const res = await fetch("/api/admin/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supporter_name: supporterName,
          amount: Number(amount),
          proviso: proviso || "クラウドファンディング支援金として",
          notes,
        }),
      })
      if (res.ok) {
        setSupporterName("")
        setAmount("")
        setProviso(template?.default_proviso || "")
        setNotes("")
        await reload()
      }
    })
  }

  const handleCreateFromPledge = (pledge: Pledge) => {
    setSupporterName(pledge.supporter_name)
    setAmount(String(pledge.amount))
    setSelectedPledgeId(pledge.id)
    setTab("receipts")
  }

  const handleSendEmail = (receiptId: number) => {
    startTransition(async () => {
      await fetch(`/api/admin/receipts/${receiptId}/send-email`, { method: "POST" })
      await reload()
    })
  }

  const handleDelete = (receiptId: number) => {
    if (!confirm("削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/receipts/${receiptId}`, { method: "DELETE" })
      await reload()
    })
  }

  const handleExportCSV = () => {
    window.location.href = "/api/admin/receipts/export"
  }

  const handleSaveTemplate = () => {
    startTransition(async () => {
      await fetch(`/api/admin/receipt-templates/${tplData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tplData),
      })
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(text)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("receipts")}
          className={`px-4 py-2 font-medium ${tab === "receipts" ? "border-b-2 border-ireland-green text-ireland-green" : "text-muted-foreground"}`}
        >
          領収書一覧
        </button>
        <button
          onClick={() => setTab("pledges")}
          className={`px-4 py-2 font-medium ${tab === "pledges" ? "border-b-2 border-ireland-green text-ireland-green" : "text-muted-foreground"}`}
        >
          支援から発行
        </button>
        <button
          onClick={() => setTab("template")}
          className={`px-4 py-2 font-medium ${tab === "template" ? "border-b-2 border-ireland-green text-ireland-green" : "text-muted-foreground"}`}
        >
          テンプレート
        </button>
      </div>

      {/* Tab: 領収書一覧 */}
      {tab === "receipts" && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-bold text-lg">新規発行</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>宛名</Label>
                <Input value={supporterName} onChange={(e) => setSupporterName(e.target.value)} placeholder="山田太郎" />
              </div>
              <div>
                <Label>金額</Label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000" />
              </div>
              <div className="sm:col-span-2">
                <Label>但し書き</Label>
                <Input value={proviso} onChange={(e) => setProviso(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>備考</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
            </div>
            <Button onClick={handleCreate} disabled={isPending} className="w-full bg-ireland-green">発行</Button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">発行済み ({receipts.length})</h3>
            <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
              <DownloadCloud className="w-4 h-4" /> CSV出力
            </Button>
          </div>

          <div className="space-y-2">
            {receipts.map((r) => (
              <div key={r.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{r.receipt_number}</p>
                    <p className="text-sm text-muted-foreground">{r.supporter_name} — ¥{Number(r.amount).toLocaleString()}</p>
                  </div>
                  {r.email_sent && <Badge className="bg-green-100 text-green-800 border-0">メール送信済</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${window.location.origin}/api/receipts/${r.download_token}`)} className="gap-2">
                    {copied === `${window.location.origin}/api/receipts/${r.download_token}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} リンク
                  </Button>
                  {!r.email_sent && (
                    <Button size="sm" variant="outline" onClick={() => handleSendEmail(r.id)} disabled={isPending} className="gap-2">
                      <Mail className="w-4 h-4" /> メール送信
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDelete(r.id)} disabled={isPending} className="gap-2 text-red-600">
                    <Trash2 className="w-4 h-4" /> 削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: 支援から発行 */}
      {tab === "pledges" && (
        <div className="space-y-3">
          {pledges.map((p) => (
            <div key={p.id} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-bold">{p.supporter_name}</p>
                <p className="text-sm text-muted-foreground">¥{Number(p.amount).toLocaleString()} • {p.supporter_email}</p>
              </div>
              {p.existing_receipt ? (
                <Badge className="bg-green-100 text-green-800 border-0">{p.existing_receipt}</Badge>
              ) : (
                <Button size="sm" onClick={() => handleCreateFromPledge(p)}>発行</Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab: テンプレート */}
      {tab === "template" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-bold text-lg">テンプレート設定</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>発行者名</Label>
              <Input value={tplData.issuer_name} onChange={(e) => setTplData({ ...tplData, issuer_name: e.target.value })} />
            </div>
            <div>
              <Label>住所</Label>
              <Input value={tplData.issuer_address} onChange={(e) => setTplData({ ...tplData, issuer_address: e.target.value })} />
            </div>
            <div>
              <Label>連番プレフィックス</Label>
              <Input value={tplData.prefix} onChange={(e) => setTplData({ ...tplData, prefix: e.target.value })} />
            </div>
            <div>
              <Label>デフォルト但し書き</Label>
              <Input value={tplData.default_proviso} onChange={(e) => setTplData({ ...tplData, default_proviso: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>ロゴURL</Label>
              <Input value={tplData.logo_url} onChange={(e) => setTplData({ ...tplData, logo_url: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>印影URL</Label>
              <Input value={tplData.stamp_url} onChange={(e) => setTplData({ ...tplData, stamp_url: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <Label>フッター注記</Label>
              <Textarea value={tplData.footer_note} onChange={(e) => setTplData({ ...tplData, footer_note: e.target.value })} rows={2} />
            </div>
          </div>
          <Button onClick={handleSaveTemplate} disabled={isPending} className="w-full bg-ireland-green">保存</Button>
        </div>
      )}
    </div>
  )
}
