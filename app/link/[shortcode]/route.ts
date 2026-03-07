import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const GET = async (req: NextRequest, { params }: { params: { shortcode: string } }) => {
  try {
    const shortcode = params.shortcode.toLowerCase()
    const links = await sql`SELECT id, target_url FROM shortlinks WHERE shortcode = ${shortcode} LIMIT 1`
    
    if (links.length === 0) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    
    const link = links[0]
    // Record click
    try {
      await sql`INSERT INTO shortlink_clicks (shortlink_id, user_agent, ip_address) VALUES (${link.id}, ${req.headers.get("user-agent") || ""}, ${req.headers.get("x-forwarded-for") || req.ip || ""})`
    } catch {}
    
    return NextResponse.redirect(new URL(link.target_url))
  } catch (err: any) {
    console.error("[v0] shortlink redirect error:", err)
    return NextResponse.redirect(new URL("/", req.url))
  }
}
