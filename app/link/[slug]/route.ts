import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const GET = async (req: NextRequest, { params }: { params: { slug: string } }) => {
  try {
    const slug = params.slug.toLowerCase()
    
    // shortlinksテーブルから対応するレコードを検索
    const links = await sql`
      SELECT id, url_default, url_line, url_twitter, url_instagram
      FROM shortlinks
      WHERE slug = ${slug} AND is_active = true
      LIMIT 1
    `
    
    if (links.length === 0) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    const link = links[0]
    
    // User-Agentからプラットフォームを判定
    const ua = req.headers.get("user-agent") || ""
    let targetUrl = link.url_default
    
    if (ua.includes("Line")) {
      targetUrl = link.url_line || link.url_default
    } else if (ua.includes("Twitter") || ua.includes("X11")) {
      targetUrl = link.url_twitter || link.url_default
    } else if (ua.includes("Instagram")) {
      targetUrl = link.url_instagram || link.url_default
    }
    
    // クリック記録
    try {
      await sql`
        INSERT INTO shortlink_clicks (shortlink_id, platform, user_agent, referer)
        VALUES (
          ${link.id},
          ${ua.includes("Line") ? "LINE" : ua.includes("Twitter") || ua.includes("X11") ? "Twitter" : ua.includes("Instagram") ? "Instagram" : "Other"},
          ${ua.slice(0, 255)},
          ${(req.headers.get("referer") || "").slice(0, 500)}
        )
      `
    } catch (err) {
      console.error("[v0] Failed to record click:", err)
    }
    
    return NextResponse.redirect(new URL(targetUrl))
  } catch (err: any) {
    console.error("[v0] shortlink redirect error:", err)
    return NextResponse.redirect(new URL("/", req.url))
  }
}
