"use client"

import { useState, type ReactNode } from "react"
import { FileText, History } from "lucide-react"

interface Props {
  templateEditor: ReactNode
  logsViewer: ReactNode
}

export default function EmailTemplatesPageClient({ templateEditor, logsViewer }: Props) {
  const [tab, setTab] = useState<"templates" | "logs">("templates")

  return (
    <div>
      <div className="flex gap-1 bg-muted p-1 rounded-xl mb-6 w-fit">
        <button
          onClick={() => setTab("templates")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            tab === "templates"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-4 h-4" />
          テンプレート管理
        </button>
        <button
          onClick={() => setTab("logs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
            tab === "logs"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="w-4 h-4" />
          配信履歴
        </button>
      </div>

      {tab === "templates" ? templateEditor : logsViewer}
    </div>
  )
}
