"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import type { PageBlock, FundItem } from "@/lib/block-types"
import Image from "next/image"
import { useLanguage } from "@/components/LanguageProvider"
import { Loader2 } from "lucide-react"

// 翻訳キャッシュ（セッション中は再翻訳しない）
const translationCache = new Map<string, PageBlock[]>()

function getCacheKey(blocks: PageBlock[], lang: string): string {
  const ids = blocks.map(b => b.id).join(",")
  return `${lang}:${ids}`
}

// ─── SVGドーナツグラフ ───
function DonutChart({ items }: { items: FundItem[] }) {
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 60
  const inner = 38

  let cumulative = 0
  const slices = items.map((item) => {
    const startAngle = (cumulative / 100) * 360 - 90
    cumulative += item.percent
    const endAngle = (cumulative / 100) * 360 - 90
    return { ...item, startAngle, endAngle }
  })

  const polarToCartesian = (angle: number, radius: number) => {
    const rad = (angle * Math.PI) / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  const describeArc = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
    if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99
    const s1 = polarToCartesian(startAngle, outerR)
    const e1 = polarToCartesian(endAngle, outerR)
    const s2 = polarToCartesian(endAngle, innerR)
    const e2 = polarToCartesian(startAngle, innerR)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return [
      `M ${s1.x} ${s1.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${e1.x} ${e1.y}`,
      `L ${s2.x} ${s2.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${e2.x} ${e2.y}`,
      "Z",
    ].join(" ")
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((slice, i) => (
        <path
          key={i}
          d={describeArc(slice.startAngle, slice.endAngle, r, inner)}
          fill={slice.color}
          stroke="var(--background)"
          strokeWidth={2}
        />
      ))}
      <circle cx={cx} cy={cy} r={inner} fill="var(--background)" />
    </svg>
  )
}

function FundUsageBlock({ block }: { block: PageBlock }) {
  const items: FundItem[] = block.items ?? []
  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {items.length > 0 && <DonutChart items={items} />}
      <div className="flex-1 space-y-3 w-full">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="mt-1.5 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-foreground">{item.label}</span>
                <span className="text-sm font-black text-foreground shrink-0">{item.percent}%</span>
              </div>
              {item.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ブロック描画（単一ブロック） ───
function RenderBlock({ block }: { block: PageBlock }) {
  if (block.type === "divider") {
    return <hr className="border-border my-2" />
  }

  if (block.type === "heading") {
    return (
      <h2 className="text-xl font-black text-foreground pt-4">
        {block.content}
      </h2>
    )
  }

  if (block.type === "image") {
    return (
      <figure className="space-y-2">
        {block.imageUrl && (
          <div className="relative w-full rounded-2xl overflow-hidden border border-border">
            <Image
              src={block.imageUrl}
              alt={block.imageAlt ?? ""}
              width={800}
              height={450}
              className="w-full object-cover"
              unoptimized
            />
          </div>
        )}
        {block.imageCaption && (
          <figcaption className="text-xs text-muted-foreground text-center">{block.imageCaption}</figcaption>
        )}
      </figure>
    )
  }

  if (block.type === "fund_usage") {
    return (
      <section className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-black text-foreground">{block.title ?? "資金の使い道"}</h2>
        </div>
        <div className="p-6">
          <FundUsageBlock block={block} />
        </div>
      </section>
    )
  }

  // about / rich_text
  const html = block.content ?? ""
  if (!html && !block.title) return null

  return (
    <section className="bg-card rounded-2xl border border-border overflow-hidden">
      {block.title && (
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-black text-foreground">{block.title}</h2>
        </div>
      )}
      {html && (
        <div
          className="p-6 text-sm leading-relaxed prose prose-sm max-w-none text-foreground/80
            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-3 [&_h1]:text-foreground
            [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-2 [&_h2]:text-foreground
            [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:text-foreground
            [&_p]:mb-3 [&_p]:leading-relaxed
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
            [&_blockquote]:border-l-4 [&_blockquote]:border-ireland-green [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground
            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3
            [&_a]:text-ireland-green [&_a]:underline
            [&_strong]:font-bold [&_em]:italic"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </section>
  )
}

// ─── スケルトン ───
function BlockSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6 space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">翻訳中...</span>
        </div>
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
      </div>
    </div>
  )
}

// ─── メインコンポーネント ───
interface Props {
  blocks: PageBlock[]
  fallbackAboutHtml?: string
}

export default function BlockRenderer({ blocks, fallbackAboutHtml }: Props) {
  const { lang } = useLanguage()
  const [displayBlocks, setDisplayBlocks] = useState<PageBlock[]>(blocks)
  const [isTranslating, setIsTranslating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // ブロックの安定したキー（参照比較ではなくID文字列で比較）
  const blocksKey = useMemo(
    () => blocks.map((b) => b.id).join(","),
    [blocks]
  )

  const doTranslate = (targetLang: string, signal?: AbortSignal) => {
    setIsTranslating(true)
    setError(null)

    // 25秒タイムアウト（Vercel Serverless の上限に合わせる）
    const timeoutId = setTimeout(() => abortRef.current?.abort(), 25000)

    fetch("/api/translate-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks, targetLang }),
      signal,
    })
      .then(async (res) => {
        clearTimeout(timeoutId)
        const data = await res.json()
        if (!res.ok || data.error) {
          console.error("[BlockRenderer] API error:", res.status, data.error, data.detail)
          setError(data.detail ?? data.error ?? `HTTP ${res.status}`)
          setDisplayBlocks(blocks)
          return
        }
        if (data.translatedBlocks && Array.isArray(data.translatedBlocks) && data.translatedBlocks.length > 0) {
          translationCache.set(getCacheKey(blocks, targetLang), data.translatedBlocks)
          setDisplayBlocks(data.translatedBlocks)
          setError(null)
        } else {
          console.warn("[BlockRenderer] No translatedBlocks in response")
          setError("Empty translation response")
          setDisplayBlocks(blocks)
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        if (err.name !== "AbortError") {
          console.error("[BlockRenderer] Fetch failed:", err)
          setError(err.message)
          setDisplayBlocks(blocks)
        }
      })
      .finally(() => setIsTranslating(false))
  }

  // lang または blocksKey が変化したときだけ翻訳を実行
  useEffect(() => {
    if (lang === "ja" || !blocks || blocks.length === 0) {
      setDisplayBlocks(blocks)
      setError(null)
      return
    }

    const cacheKey = getCacheKey(blocks, lang)
    const cached = translationCache.get(cacheKey)
    if (cached) {
      setDisplayBlocks(cached)
      setError(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    doTranslate(lang, controller.signal)

    return () => controller.abort()
  // blocksKeyを使うことで、ブロックの内容が同じなら再実行しない
  }, [lang, blocksKey])

  // 日本語表示時にブロックが更新された場合は即反映
  useEffect(() => {
    if (lang === "ja") setDisplayBlocks(blocks)
  }, [blocks, lang])

  if (!blocks || blocks.length === 0) {
    if (fallbackAboutHtml) {
      return (
        <section className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-black text-foreground">About This Project</h2>
          </div>
          <div
            className="p-6 text-sm leading-relaxed prose prose-sm max-w-none
              [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-3
              [&_h2]:text-xl [&_h2]:font-black [&_h2]:mb-2
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2
              [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
              [&_blockquote]:border-l-4 [&_blockquote]:border-ireland-green [&_blockquote]:pl-4 [&_blockquote]:italic
              [&_img]:max-w-full [&_img]:rounded-xl [&_a]:text-ireland-green [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: fallbackAboutHtml }}
          />
        </section>
      )
    }
    return null
  }

  if (isTranslating) {
    return <BlockSkeleton />
  }

  if (error && lang !== "ja") {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start justify-between gap-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            翻訳に失敗しました（日本語で表示中）
          </p>
          <button
            onClick={() => {
              translationCache.delete(getCacheKey(blocks, lang))
              doTranslate(lang)
            }}
            className="text-xs font-bold text-ireland-green underline shrink-0"
          >
            再翻訳する
          </button>
        </div>
        <div className="space-y-4">
          {displayBlocks.map((block) => (
            <RenderBlock key={block.id} block={block} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayBlocks.map((block) => (
        <RenderBlock key={block.id} block={block} />
      ))}
    </div>
  )
}
