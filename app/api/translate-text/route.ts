import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { targetLang } = body

  if (!targetLang || !["en", "ko", "zh"].includes(targetLang)) {
    return NextResponse.json({ error: "Invalid target language" }, { status: 400 })
  }

  const langName = { en: "English", ko: "Korean", zh: "Simplified Chinese" }[targetLang]

  // 単一テキスト
  if (body.text) {
    const prompt = `Translate the following Japanese text into ${langName}.
Return ONLY the translated text, nothing else. No quotes, no explanation.
If the text contains dates, translate the format naturally (e.g. "2026年3月14日（土）" → "Saturday, March 14, 2026" for English).
If the text contains place names, translate or transliterate them naturally.

Text: ${body.text}`

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt,
        maxTokens: 256,
      })
      return NextResponse.json({ translated: text.trim() })
    } catch {
      return NextResponse.json({ translated: body.text })
    }
  }

  // 複数テキスト
  if (body.texts && typeof body.texts === "object") {
    const entries = Object.entries(body.texts as Record<string, string>).filter(([, v]) => v?.trim())
    if (entries.length === 0) return NextResponse.json({ translations: body.texts })

    const prompt = `Translate the following Japanese texts into ${langName}.
Return ONLY a valid JSON object. No markdown, no code fences, no extra text.
If texts contain dates, translate the format naturally (e.g. "2026年3月14日（土）・15日（日）" → "March 14 (Sat) & 15 (Sun), 2026" for English).
If texts contain place names, translate or transliterate them naturally (e.g. "代々木公園イベント広場" → "Yoyogi Park Event Plaza" for English).

Return: { ${entries.map(([k]) => `"${k}": "..."`).join(", ")} }

Texts:
${entries.map(([k, v]) => `[${k}]: ${v}`).join("\n")}`

    try {
      const { text } = await generateText({
        model: "openai/gpt-4o-mini",
        prompt,
        maxTokens: 512,
      })
      const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
      const translations = JSON.parse(cleaned)
      return NextResponse.json({ translations })
    } catch {
      return NextResponse.json({ translations: body.texts })
    }
  }

  return NextResponse.json({ error: "text or texts is required" }, { status: 400 })
}
