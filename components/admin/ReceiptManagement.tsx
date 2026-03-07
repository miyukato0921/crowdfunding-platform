"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Download, Trash2, Plus, Copy, Check } from "lucide-react"

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
  created_at: string
}

interface Template {
  id: number
  name: string
  issuer_name: string
  issuer_address: string
  default_proviso: string
}

interface Props {
  initialReceipts: Receipt[]
  initialTemplates: Template[]
}

export default function ReceiptManagement({ initialReceipts, initialTemplates }: Props) {
  const [receipts, setReceipts] = useState<Receipt[]>(initialReceipts)
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [supporterName, setSupporterName] = useState("")
  const [amount, setAmount] = useState("")
  const [proviso, setProviso] = useState("")
  const [issuerName, setIssuerName] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const reload = async () => {
    const res = await fetch("/api/admin/receipts")
    if (res.ok) setReceipts(await res.json())
  }

  const handleIssue = () => {
    if (!supporterName.trim() || !amount.trim() || !issuerName.trim()) {
      alert("必須項目を入力してください")
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/admin/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supporter_name: supporterName,
          amount: Number(amount),
          proviso: proviso || "クラウドファンディング支援金として",
          issuer_name: issuerName,
        }),
      })

      if (res.ok) {
        setSupporterName("")
        setAmount("")
        setProviso("")
        setIssuerName("")
        await reload()
      }
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("この領収書を削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/receipts/${id}`, { method: "DELETE" })
      await reload()
    })
  }

  const copyDownloadUrl = (token: string) => {
    const url = `${window.location.origin}/api/receipts/${token}`
    navigator.clipboard.writeText(url)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* 領収書発行フォーム */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">領収書を発行</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supporter_name">支援者名 *</Label>
            <Input
              id="supporter_name"
              value={supporterName}
              onChange={(e) => setSupporterName(e.target.value)}
              placeholder="支援者の氏名"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">金額 *</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="issuer_name">発行者名 *</Label>
            <Input
              id="issuer_name"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              placeholder="在日アイルランド商工会議所"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="proviso">但し書き</Label>
            <Input
              id="proviso"
              value={proviso}
              onChange={(e) => setProviso(e.target.value)}
              placeholder="クラウドファンディング支援金として"
              className="text-sm"
            />
          </div>
        </div>
        <Button
          onClick={handleIssue}
          disabled={isPending}
          className="w-full bg-ireland-green hover:bg-ireland-green/90 text-white font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          領収書を発行
        </Button>
      </div>

      {/* 領収書リスト */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold">発行済み領収書 ({receipts.length}件)</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="flex items-center justify-between gap-3 bg-muted/50 rounded-lg p-3 text-sm"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-foreground">{receipt.receipt_number}</p>
                <p className="text-xs text-muted-foreground">
                  {receipt.supporter_name} — ¥{receipt.amount.toLocaleString("ja-JP")} ({receipt.issued_date})
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copyDownloadUrl(receipt.download_token)}
                  className="p-1.5 hover:bg-background rounded transition-colors"
                  title="Download URL をコピー"
                >
                  {copied === receipt.download_token ? (
                    <Check className="w-4 h-4 text-ireland-green" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(receipt.id)}
                  className="p-1.5 hover:bg-background rounded transition-colors text-destructive"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
