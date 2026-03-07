import sql from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id)
    await sql`DELETE FROM shortlinks WHERE id = ${id}`
    await sql`DELETE FROM shortlink_clicks WHERE shortlink_id = ${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[v0] shortlinks DELETE error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
