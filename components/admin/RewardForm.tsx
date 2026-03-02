"use client"

import { useRef, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import ImageUploader from "@/components/admin/ImageUploader"
import type { Campaign, RewardTier } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

interface Props {
  action: (formData: FormData) => Promise<void>
  campaigns: Campaign[]
  defaultValues?: RewardTier
}

export default function RewardForm({ action, campaigns, defaultValues }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string>(defaultValues?.image_url ?? "")

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return
    const fd = new FormData(form)
    fd.set("image_url", imageUrl)
    startTransition(() => action(fd))
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div>
          <Label htmlFor="campaign_id" className="text-sm font-bold">キャンペーン <span className="text-destructive">*</span></Label>
          <select
            id="campaign_id"
            name="campaign_id"
            required
            defaultValue={defaultValues?.campaign_id ?? campaigns[0]?.id}
            className="w-full mt-1.5 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {/* 日本語 */}
        <div className="pb-4 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">日本語</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-bold">タイトル <span className="text-destructive">*</span></Label>
              <Input id="title" name="title" required defaultValue={defaultValues?.title} placeholder="例：アイリッシュ盆踊りステージ参加権" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="description" className="text-sm font-bold">説明 <span className="text-destructive">*</span></Label>
              <Textarea id="description" name="description" required rows={4} defaultValue={defaultValues?.description} placeholder="リターン内容の詳細説明..." className="mt-1.5 resize-none" />
            </div>
          </div>
        </div>

        {/* English */}
        <div className="pb-4 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">English</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title_en" className="text-sm font-bold">Title</Label>
              <Input id="title_en" name="title_en" defaultValue={(defaultValues as any)?.title_en ?? ""} placeholder="e.g. Irish Bon Odori Stage Participation" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="description_en" className="text-sm font-bold">Description</Label>
              <Textarea id="description_en" name="description_en" rows={4} defaultValue={(defaultValues as any)?.description_en ?? ""} placeholder="Detailed description of this reward..." className="mt-1.5 resize-none" />
            </div>
          </div>
        </div>

        {/* 한국어 */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">한국어</p>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title_ko" className="text-sm font-bold">제목</Label>
              <Input id="title_ko" name="title_ko" defaultValue={(defaultValues as any)?.title_ko ?? ""} placeholder="예: 아이리시 봉오도리 스테이지 참가권" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="description_ko" className="text-sm font-bold">설명</Label>
              <Textarea id="description_ko" name="description_ko" rows={4} defaultValue={(defaultValues as any)?.description_ko ?? ""} placeholder="리턴 내용 상세 설명..." className="mt-1.5 resize-none" />
            </div>
          </div>
        </div>
        <ImageUploader
          name="image_url"
          label="リターン画像"
          defaultValue={defaultValues?.image_url}
          onUrlChange={setImageUrl}
        />
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount" className="text-sm font-bold">支援金額（円） <span className="text-destructive">*</span></Label>
            <Input id="amount" name="amount" type="number" min={1} required defaultValue={defaultValues?.amount} placeholder="20000" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="limit_count" className="text-sm font-bold">数量上限（空白=無制限）</Label>
            <Input id="limit_count" name="limit_count" type="number" min={1} defaultValue={defaultValues?.limit_count ?? ""} placeholder="50" className="mt-1.5" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="delivery_date" className="text-sm font-bold">発送・提供予定</Label>
            <Input id="delivery_date" name="delivery_date" defaultValue={defaultValues?.delivery_date ?? ""} placeholder="2026年03月" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="sort_order" className="text-sm font-bold">表示順</Label>
            <Input id="sort_order" name="sort_order" type="number" min={0} defaultValue={defaultValues?.sort_order ?? 0} className="mt-1.5" />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <input
            id="is_active"
            name="is_active"
            type="checkbox"
            defaultChecked={defaultValues?.is_active ?? true}
            className="w-4 h-4 rounded border border-input accent-ireland-green"
          />
          <Label htmlFor="is_active" className="text-sm font-bold cursor-pointer">公開中（チェックを外すと非公開）</Label>
        </div>
      </div>

      <div className="flex gap-3 justify-between">
        <Button type="button" variant="outline" className="rounded-xl" asChild>
          <Link href="/admin/rewards">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Link>
        </Button>
        <Button type="submit" disabled={isPending} className="bg-ireland-green hover:bg-ireland-green/90 text-white rounded-xl">
          {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isPending ? "保存中..." : "保存する"}
        </Button>
      </div>
    </form>
  )
}
