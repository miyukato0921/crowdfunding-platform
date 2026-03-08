import { NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const campaignId = parseInt(id)
  if (isNaN(campaignId)) {
    return NextResponse.json({ error: "Invalid campaign ID" }, { status: 400 })
  }

  const result = await sql`
    SELECT current_amount, supporter_count FROM campaigns WHERE id = ${campaignId} LIMIT 1
  `
  if (!result[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(result[0])
}
