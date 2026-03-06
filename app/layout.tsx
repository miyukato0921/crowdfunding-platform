// Build refresh: 2024-03-06T12:00:00Z - Fixed SupportersList hydration
import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/LanguageProvider'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  display: "swap",
})

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.className} font-sans antialiased bg-background text-foreground`}>
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
