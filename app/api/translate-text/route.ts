import { NextRequest, NextResponse } from "next/server"
import { translateToLang } from "@/lib/translate"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { targetLang } = body

  if (!targetLang || !["en", "ko", "zh"].includes(targetLang)) {
    return NextResponse.json({ error: "Invalid target language" }, { status: 400 })
  }

  // 単一テキスト
  if (body.text) {
    try {
      const result = await translateToLang({ text: body.text }, targetLang)
      return NextResponse.json({ translated: result.text ?? body.text })
    } catch (err) {
      console.error("[translate-text] Error:", err)
      return NextResponse.json({ translated: body.text })
    }
  }

  // 複数テキスト
  if (body.texts && typeof body.texts === "object") {
    try {
      const result = await translateToLang(body.texts, targetLang)
      return NextResponse.json({ translations: result })
    } catch (err) {
      console.error("[translate-text] Error:", err)
      return NextResponse.json({ translations: body.texts })
    }
  }

  return NextResponse.json({ error: "text or texts is required" }, { status: 400 })
}
