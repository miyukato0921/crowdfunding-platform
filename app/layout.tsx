import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/LanguageProvider'
import { SiteSettingsProvider } from '@/components/SiteSettingsProvider'
import sql from '@/lib/db'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
})

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: 'Green Ireland Festival 2025 - クラウドファンディング',
  description: 'アイルランドの文化・音楽・食を日本に届けるフェスティバルを一緒に作りましょう！Green Ireland Festival 2025のクラウドファンディングプロジェクト。',
  keywords: ['グリーンアイルランドフェスティバル', 'クラウドファンディング', 'アイルランド', 'フェスティバル', '東京'],
  openGraph: {
    title: 'Green Ireland Festival 2025',
    description: 'アイルランドの文化・音楽・食を日本に届けるフェスティバル',
    type: 'website',
  },
}

async function getSiteSettings() {
  try {
    const rows = await sql`SELECT key, value FROM site_settings WHERE key IN ('logo_url', 'site_title')`
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    return map
  } catch {
    return {}
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await getSiteSettings()

  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} font-sans antialiased bg-background text-foreground`}>
        <SiteSettingsProvider
          logoUrl={settings.logo_url ?? ""}
          siteTitle={settings.site_title ?? "Green Ireland Festival"}
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </SiteSettingsProvider>
        <Analytics />
      </body>
    </html>
  )
}
