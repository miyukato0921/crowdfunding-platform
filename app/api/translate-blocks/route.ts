import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { blocks, targetLang } = await req.json()

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

  const langName = { en: "English", ko: "Korean", zh: "Simplified Chinese" }[targetLang]

  const prompt = `You are a professional translator for a Japanese cultural festival crowdfunding site.
Translate the following Japanese texts into ${langName}.

IMPORTANT RULES:
- If a value contains HTML tags (e.g. <p>, <strong>, <h2>, <ul>, <li>, <br>, <a>, <img>), preserve ALL HTML tags exactly as-is. Only translate text between tags.
- Do NOT translate or modify URLs, image paths, or HTML attribute values.
- Do NOT add or remove any HTML tags.
- Return ONLY a valid JSON object. No markdown, no code fences, no extra text.

Return this exact JSON structure:
{ ${entries.map(([k]) => `"${k}": "..."`).join(", ")} }

Texts to translate:
${entries.map(([k, v]) => `[${k}]: ${v}`).join("\n")}`

  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 4096,
    })

    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const translated = JSON.parse(cleaned)

    // 翻訳結果をブロック配列に組み戻す
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
    console.error("[translate-blocks] Error:", err)
    return NextResponse.json({ translatedBlocks: blocks })
  }
}
