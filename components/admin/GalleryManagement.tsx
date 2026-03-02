"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { Plus, Trash2, Eye, EyeOff, Pencil, Check, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ImageUploader from "@/components/admin/ImageUploader"

interface GalleryPhoto {
  id: number
  image_url: string
  caption: string
  sort_order: number
  is_active: boolean
}

interface Props {
  campaignId: number
  initialPhotos: GalleryPhoto[]
}

export default function GalleryManagement({ campaignId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(initialPhotos)
  const [isPending, startTransition] = useTransition()
  const [addMode, setAddMode] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState("")
  const [newCaption, setNewCaption] = useState("")
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCaption, setEditCaption] = useState("")
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState("")

  const reload = async () => {
    const res = await fetch(`/api/admin/gallery?campaign_id=${campaignId}`)
    if (res.ok) setPhotos(await res.json())
  }

  const handleAdd = () => {
    if (!newImageUrl) return
    startTransition(async () => {
      await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaign_id: campaignId, image_url: newImageUrl, caption: newCaption, sort_order: photos.length }),
      })
      setNewImageUrl("")
      setNewCaption("")
      setAddMode(false)
      await reload()
    })
  }

  const handleDelete = (id: number) => {
    if (!confirm("この写真を削除しますか？")) return
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, { method: "DELETE" })
      await reload()
    })
  }

  const handleToggle = (id: number, current: boolean) => {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !current }),
      })
      await reload()
    })
  }

  const handleEditCaption = (id: number) => {
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption: editCaption }),
      })
      setEditingId(null)
      await reload()
    })
  }

  const handleUpdatePhoto = (id: number) => {
    if (!editPhotoUrl) return
    startTransition(async () => {
      await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: editPhotoUrl }),
      })
      setEditingPhotoId(null)
      setEditPhotoUrl("")
      await reload()
    })
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground">フォトギャラリー管理</h1>
          <p className="text-sm text-muted-foreground mt-1">メインページのギャラリーに表示される写真を管理します</p>
        </div>
        <Button onClick={() => setAddMode(true)} disabled={addMode} className="bg-ireland-green hover:bg-ireland-green/90">
          <Plus className="w-4 h-4 mr-2" />
          写真を追加
        </Button>
      </div>

      {/* 追加フォーム */}
      {addMode && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-bold text-foreground">新しい写真を追加</h2>
          <div>
            <Label className="text-sm font-medium mb-2 block">写真</Label>
            <ImageUploader
              name="image_url"
              label="ギャラリー写真"
              currentUrl={newImageUrl}
              onUrlChange={setNewImageUrl}
            />
          </div>
          <div>
            <Label htmlFor="caption" className="text-sm font-medium">キャプション（説明文）</Label>
            <Input
              id="caption"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              placeholder="写真の説明を入力"
              className="mt-1.5"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAdd} disabled={!newImageUrl || isPending} className="bg-ireland-green hover:bg-ireland-green/90">
              追加する
            </Button>
            <Button variant="outline" onClick={() => { setAddMode(false); setNewImageUrl(""); setNewCaption("") }}>
              キャンセル
            </Button>
          </div>
        </div>
      )}

      {/* 写真一覧 */}
      {photos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-2xl border border-border">
          <p className="font-medium">写真が登録されていません</p>
          <p className="text-sm mt-1">「写真を追加」ボタンから追加してください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className={`bg-card border rounded-2xl overflow-hidden ${!photo.is_active ? "opacity-60" : "border-border"}`}>
              {/* 写真部分 */}
              {editingPhotoId === photo.id ? (
                <div className="p-4 space-y-3 border-b border-border">
                  <p className="text-sm font-bold text-foreground">写真を変更</p>
                  <ImageUploader
                    name={`photo_url_${photo.id}`}
                    label="新しい写真"
                    currentUrl={editPhotoUrl || photo.image_url}
                    onUrlChange={setEditPhotoUrl}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePhoto(photo.id)}
                      disabled={!editPhotoUrl || isPending}
                      className="bg-ireland-green hover:bg-ireland-green/90 text-white"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingPhotoId(null); setEditPhotoUrl("") }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative w-full h-44">
                  <Image src={photo.image_url} alt={photo.caption} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => { setEditingPhotoId(photo.id); setEditPhotoUrl("") }}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-ireland-green/80 text-white flex items-center justify-center transition-colors"
                      title="写真を変更"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggle(photo.id, photo.is_active)}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                      title={photo.is_active ? "非表示にする" : "表示する"}
                    >
                      {photo.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="w-8 h-8 rounded-lg bg-black/50 hover:bg-red-500/70 text-white flex items-center justify-center transition-colors"
                      title="削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${photo.is_active ? "bg-ireland-green text-white" : "bg-gray-500 text-white"}`}>
                      {photo.is_active ? "表示中" : "非表示"}
                    </span>
                  </div>
                </div>
              )}
              {/* キャプション部分 */}
              <div className="p-3">
                {editingId === photo.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="text-sm h-8"
                      autoFocus
                    />
                    <button onClick={() => handleEditCaption(photo.id)} className="text-ireland-green hover:text-ireland-green/80">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-foreground flex-1 truncate">{photo.caption || "（キャプションなし）"}</p>
                    <button
                      onClick={() => { setEditingId(photo.id); setEditCaption(photo.caption) }}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                      title="キャプションを編集"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
