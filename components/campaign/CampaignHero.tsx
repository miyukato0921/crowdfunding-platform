import Image from "next/image"
import type { Campaign } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin } from "lucide-react"

interface Props {
  campaign: Campaign
}

export default function CampaignHero({ campaign }: Props) {
  return (
    <section className="relative">
      <div className="relative w-full h-72 md:h-96 lg:h-[500px] overflow-hidden">
        <Image
          src={campaign.hero_image_url || "/images/hero-irish-bon-odori.jpg"}
          alt={campaign.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ireland-dark/85 via-ireland-dark/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className="bg-ireland-gold text-ireland-dark font-bold border-0 text-xs">
                受付中
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur-sm">
                文化・アート
              </Badge>
            </div>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black text-white text-balance leading-tight mb-3">
              {campaign.title}
            </h1>
            <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-2xl text-pretty">
              {campaign.short_description}
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <Calendar className="w-4 h-4 text-ireland-gold shrink-0" />
                <span>2026年3月15日（日）</span>
              </div>
              <div className="flex items-center gap-1.5 text-white/80 text-sm">
                <MapPin className="w-4 h-4 text-ireland-gold shrink-0" />
                <span>東京（詳細は支援者にご連絡）</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
