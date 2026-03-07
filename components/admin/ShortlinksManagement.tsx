"use client"

import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Copy, Check, Link as LinkIcon } from "lucide-react"

interface Shortlink {
  id: number
  shortcode: string
  target_url: string
  created_at: string
}

export default function ShortlinksManagement() {
  const [links, setLinks] = useState<Shortlink[]>([])
  const [shortcode, setShortcode] = useState("")
  const [targetUrl, setTargetUrl] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    reload()
  }, [])

  const reload = async () => {
    const res = await fetch("/api/admin/shortlinks")
    if (res.ok) setLinks(await res.json())
  }

  const handleCreate = () => {
    setError("")
    if (!shortcode.trim()) { setError("shortcodeを入力してください"); return }
    if (!targetUrl.trim()) { setError("target URLを入力してください"); return }
    if (!/^[a-z0-9\-_]+$/.test(shortcode)) { setError("shortcode: lowercase letters, numbers, -, _ only"); return }

    startTransition(async () => {
      const res = await fetch("/api/admin/shortlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortcode, target_url: targetUrl }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        return
      }
      setShortcode("")
      setTargetUrl("")
      await reload()
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("このリンクを削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/shortlinks/${id}`, { method: "DELETE" })
      await reload()
    })
  }

  const copyToClipboard = (shortcode: string) => {
    const fullUrl = `${window.location.origin}/link/${shortcode}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(parseInt(shortcode))
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <LinkIcon className="w-4 h-4 text-ireland-green" />
          <h2 className="font-bold text-foreground">リンクショートカット</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          長いURLを短いコードで管理できます。/link/[shortcode] でリダイレクトされます。
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shortcode">Shortcode</Label>
            <Input
              id="shortcode"
              value={shortcode}
              onChange={(e) => setShortcode(e.target.value.toLowerCase())}
              placeholder="line-follow"
              className="font-mono text-sm"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">lowercase, numbers, -, _ のみ</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target_url">Target URL</Label>
            <Input
              id="target_url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://..."
              className="text-sm"
              disabled={isPending}
            />
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <Button onClick={handleCreate} disabled={isPending} className="bg-ireland-green hover:bg-ireland-green/90 text-white w-full">
          {isPending ? "作成中..." : "リンク作成"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-sm">
          {links.length} 件のリンク
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {links.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              リンクはまだありません
            </div>
          ) : (
            links.map((link) => (
              <div key={link.id} className="p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded text-ireland-green">
                      /link/{link.shortcode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(link.shortcode)}
                      className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                      title="Copy full URL"
                    >
                      {copied === link.id ? (
                        <Check className="w-3.5 h-3.5 text-ireland-green" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{link.target_url}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1">
                    {new Date(link.created_at).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(link.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0 transition-colors"
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
