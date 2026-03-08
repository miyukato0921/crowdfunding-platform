import sql from "@/lib/db"
import { getAdminSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import GalleryManagement from "@/components/admin/GalleryManagement"

export default async function GalleryPage() {
  const admin = await getAdminSession()
  if (!admin) redirect("/admin/login")

  const campaigns = await sql`SELECT id, title FROM campaigns ORDER BY id LIMIT 1`
  const campaign = campaigns[0]
  if (!campaign) return <div className="p-8 text-muted-foreground">キャンペーンが見つかりません</div>

  const photos = await sql`
    SELECT * FROM gallery_photos WHERE campaign_id = ${campaign.id} ORDER BY sort_order
  `

  return <GalleryManagement campaignId={campaign.id} initialPhotos={photos as any} />
}
