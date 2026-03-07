import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (req: NextRequest) => {
  try {
    const { shortcode, target_url } = await req.json()
    if (!shortcode || !target_url) return NextResponse.json({ error: "shortcode and target_url required" }, { status: 400 })
    if (!/^[a-z0-9\-_]+$/.test(shortcode)) return NextResponse.json({ error: "shortcode: lowercase letters, numbers, hyphens, underscores only" }, { status: 400 })
    
    // Check if shortcode exists
    const existing = await sql`SELECT id FROM shortlinks WHERE shortcode = ${shortcode} LIMIT 1`
    if (existing.length > 0) return NextResponse.json({ error: "shortcode already exists" }, { status: 409 })
    
    await sql`INSERT INTO shortlinks (shortcode, target_url) VALUES (${shortcode}, ${target_url})`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] shortlinks POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const GET = async (req: NextRequest) => {
  try {
    const links = await sql`SELECT id, shortcode, target_url, created_at FROM shortlinks ORDER BY created_at DESC`
    return NextResponse.json(links)
  } catch (err: any) {
    console.error("[v0] shortlinks GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
