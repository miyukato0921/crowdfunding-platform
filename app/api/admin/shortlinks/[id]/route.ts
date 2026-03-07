import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id)
    const { title, url_default, url_line, url_twitter, url_instagram, is_active } = await req.json()
    
    if (!url_default) {
      return NextResponse.json({ error: "url_default required" }, { status: 400 })
    }
    
    await sql`
      UPDATE shortlinks SET
        title = ${title || ""},
        url_default = ${url_default},
        url_line = ${url_line || null},
        url_twitter = ${url_twitter || null},
        url_instagram = ${url_instagram || null},
        is_active = ${is_active !== undefined ? is_active : true}
      WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] shortlinks PATCH error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id)
    await sql`DELETE FROM shortlinks WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] shortlinks DELETE error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
