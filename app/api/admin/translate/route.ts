import { generateText } from "ai"
import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { texts } = await req.json()
  // texts: { [fieldName]: string }  (Japanese source)

  const entries = Object.entries(texts as Record<string, string>).filter(([, v]) => v?.trim())
  if (entries.length === 0) return NextResponse.json({ translations: {} })

  const prompt = `You are a professional translator specializing in Japanese event/crowdfunding content.
Translate the following Japanese texts into English (en), Korean (ko), and Simplified Chinese (zh).

IMPORTANT RULES:
- If a value contains HTML tags (e.g. <p>, <strong>, <h2>, <ul>, <li>, <br>, <a>, <img>), preserve ALL HTML tags exactly as-is and only translate the text content between tags.
- Do NOT translate URLs, image paths, or HTML attribute values.
- Do NOT add or remove any HTML tags.
- Return ONLY a valid JSON object with no markdown, no code fences, no extra text.

Return this exact JSON structure:
{
  "en": { ${entries.map(([k]) => `"${k}": "..."`).join(", ")} },
  "ko": { ${entries.map(([k]) => `"${k}": "..."`).join(", ")} },
  "zh": { ${entries.map(([k]) => `"${k}": "..."`).join(", ")} }
}

Texts to translate:
${entries.map(([k, v]) => `[${k}]: ${v}`).join("\n")}`

  const { text } = await generateText({
    model: "openai/gpt-4o-mini",
    prompt,
    maxTokens: 4096,
  })

  try {
    // Strip possible markdown code fences
    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    const translations = JSON.parse(cleaned)
    return NextResponse.json({ translations })
  } catch {
    return NextResponse.json({ error: "Translation parsing failed", raw: text }, { status: 500 })
  }
}
