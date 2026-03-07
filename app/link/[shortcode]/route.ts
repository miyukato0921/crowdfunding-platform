import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const GET = async (req: NextRequest, { params }: { params: { slug: string } }) => {
  try {
    const slug = params.slug.toLowerCase()
    const links = await sql`SELECT id, url_default FROM shortlinks WHERE slug = ${slug} LIMIT 1`
    
    if (links.length === 0) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    const link = links[0]
    // Record click
    try {
      await sql`INSERT INTO shortlink_clicks (shortlink_id, user_agent, referer) VALUES (${link.id}, ${req.headers.get("user-agent") || ""}, ${req.headers.get("referer") || ""})`
    } catch {}
    
    return NextResponse.redirect(new URL(link.url_default))
  } catch (err: any) {
    console.error("[v0] shortlink redirect error:", err)
    return NextResponse.redirect(new URL("/", req.url))
  }
}
