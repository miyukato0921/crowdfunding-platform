export async function generateReceiptPDF(data: {
  receipt_number: string
  supporter_name: string
  amount: number
  proviso: string
  issued_date: string
  issuer_name: string
  issuer_address?: string
}) {
  // 注: 実装は別途。jsPDFなどのライブラリを使用してPDF生成
  // これはプレースホルダー
  return {
    filename: `${data.receipt_number}.pdf`,
    buffer: Buffer.from("PDF placeholder"),
  }
}

export function formatAmount(amount: number): string {
  return "金" + amount.toLocaleString("ja-JP") + "円"
}

export function generateReceiptNumber(date: Date, sequence: number): string {
  const dateStr = date.toISOString().split("T")[0].replace(/-/g, "")
  return `GIF-${dateStr}-${String(sequence).padStart(4, "0")}`
}
