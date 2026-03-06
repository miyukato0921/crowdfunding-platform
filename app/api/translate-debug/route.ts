import { NextRequest, NextResponse } from "next/server"
import { getAdminSession } from "@/lib/auth"
import { generateText } from "ai"

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: "Unauthorized - ログインしてください" }, { status: 401 })

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    steps: [],
  }

  // Step 1: generateText が利用可能か
  results.steps.push({ step: 1, name: "generateText import", status: "ok" })

  // Step 2: 最小限の翻訳テスト（1単語）
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: 'Translate this Japanese word to English. Return ONLY the English word, nothing else: こんにちは',
      maxTokens: 50,
    })
    results.steps.push({
      step: 2,
      name: "generateText simple test",
      status: "ok",
      input: "こんにちは",
      output: text.trim(),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack?.split("\n").slice(0, 5).join("\n") : undefined
    results.steps.push({
      step: 2,
      name: "generateText simple test",
      status: "FAILED",
      error: message,
      stack,
    })
    results.conclusion = `generateText が失敗しています: ${message}`
    return NextResponse.json(results)
  }

  // Step 3: JSON出力の翻訳テスト（ブロック翻訳と同じ形式）
  try {
    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt: `Translate the following Japanese texts into English.
Return ONLY a valid JSON object. No markdown, no code fences.
Return: { "b0_title": "..." }

Texts to translate:
[b0_title]: プロジェクトについて`,
      maxTokens: 256,
    })

    const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      results.steps.push({
        step: 3,
        name: "JSON parse test",
        status: "FAILED",
        rawOutput: text,
        cleanedOutput: cleaned,
        error: "JSON.parse failed",
      })
      results.conclusion = "generateText は動くが、JSONレスポンスのパースに失敗"
      return NextResponse.json(results)
    }

    results.steps.push({
      step: 3,
      name: "JSON translate test",
      status: "ok",
      input: { "b0_title": "プロジェクトについて" },
      output: parsed,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    results.steps.push({
      step: 3,
      name: "JSON translate test",
      status: "FAILED",
      error: message,
    })
    results.conclusion = `JSON翻訳テストが失敗: ${message}`
    return NextResponse.json(results)
  }

  // Step 4: translateToLang 共通関数テスト
  try {
    const { translateToLang } = await import("@/lib/translate")
    const result = await translateToLang(
      { title: "アイルランドの文化フェスティバル" },
      "en"
    )
    results.steps.push({
      step: 4,
      name: "translateToLang test",
      status: "ok",
      input: { title: "アイルランドの文化フェスティバル" },
      output: result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    results.steps.push({
      step: 4,
      name: "translateToLang test",
      status: "FAILED",
      error: message,
    })
    results.conclusion = `translateToLang 共通関数が失敗: ${message}`
    return NextResponse.json(results)
  }

  results.conclusion = "全テスト成功 — 翻訳APIは正常に動作しています"
  return NextResponse.json(results, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  })
}
