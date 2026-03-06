import { NextRequest, NextResponse } from "next/server"
import { translateToLang } from "@/lib/translate"

export async function POST(req: NextRequest) {
  let blocks: any[]
  let targetLang: string

  try {
    const body = await req.json()
    blocks = body.blocks
    targetLang = body.targetLang
  } catch (err) {
    console.error("[translate-blocks] Invalid request body:", err)
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return NextResponse.json({ translatedBlocks: [] })
  }
  if (!targetLang || !["en", "ko", "zh"].includes(targetLang)) {
    return NextResponse.json({ error: "Invalid target language" }, { status: 400 })
  }

  // ブロックからテキストを抽出
  const texts: Record<string, string> = {}
  blocks.forEach((block: any, i: number) => {
    if (block.title) texts[`b${i}_title`] = block.title
    if (block.content && block.type !== "divider") texts[`b${i}_content`] = block.content
    if (block.imageCaption) texts[`b${i}_caption`] = block.imageCaption
    if (block.imageAlt) texts[`b${i}_alt`] = block.imageAlt
    if (block.items) {
      block.items.forEach((item: any, j: number) => {
        if (item.label) texts[`b${i}_i${j}_label`] = item.label
        if (item.description) texts[`b${i}_i${j}_desc`] = item.description
      })
    }
  })

  const entries = Object.entries(texts).filter(([, v]) => v?.trim())
  if (entries.length === 0) {
    return NextResponse.json({ translatedBlocks: blocks })
  }

  console.log(`[translate-blocks] Translating ${entries.length} texts to ${targetLang}`)

  try {
    const translated = await translateToLang(texts, targetLang)
    console.log(`[translate-blocks] Success: got ${Object.keys(translated).length} translations`)

    const translatedBlocks = blocks.map((block: any, i: number) => ({
      ...block,
      title: translated[`b${i}_title`] ?? block.title,
      content: block.type !== "divider"
        ? (translated[`b${i}_content`] ?? block.content)
        : block.content,
      imageCaption: translated[`b${i}_caption`] ?? block.imageCaption,
      imageAlt: translated[`b${i}_alt`] ?? block.imageAlt,
      items: block.items?.map((item: any, j: number) => ({
        ...item,
        label: translated[`b${i}_i${j}_label`] ?? item.label,
        description: translated[`b${i}_i${j}_desc`] ?? item.description,
      })),
    }))

    return NextResponse.json({ translatedBlocks })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error(`[translate-blocks] FAILED: ${message}`)
    if (stack) console.error(stack)
    // エラーレスポンスにフォールバックブロックを含めない（クライアントが誤判定しないよう）
    return NextResponse.json(
      { error: "Translation failed", detail: message },
      { status: 500 }
    )
  }
}
