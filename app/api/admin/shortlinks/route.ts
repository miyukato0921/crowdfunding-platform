import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const POST = async (req: NextRequest) => {
  try {
    const { slug, url_default } = await req.json()
    if (!slug || !url_default) return NextResponse.json({ error: "slug and url_default required" }, { status: 400 })
    if (!/^[a-z0-9\-_]+$/.test(slug)) return NextResponse.json({ error: "slug: lowercase letters, numbers, hyphens, underscores only" }, { status: 400 })
    
    // Check if slug exists
    const existing = await sql`SELECT id FROM shortlinks WHERE slug = ${slug} LIMIT 1`
    if (existing.length > 0) return NextResponse.json({ error: "slug already exists" }, { status: 409 })
    
    await sql`INSERT INTO shortlinks (slug, url_default, title) VALUES (${slug}, ${url_default}, '')`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] shortlinks POST error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const GET = async (req: NextRequest) => {
  try {
    const links = await sql`SELECT id, slug, url_default, title, created_at FROM shortlinks ORDER BY created_at DESC`
    return NextResponse.json(links)
  } catch (err: any) {
    console.error("[v0] shortlinks GET error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
