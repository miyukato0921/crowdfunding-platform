// 文字コード自動判定（Shift_JIS / UTF-8 / EUC-JP）
export function detectEncoding(bytes: Uint8Array): string {
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) return 'utf-8'
  if (bytes[0] === 0xFF && bytes[1] === 0xFE) return 'utf-16le'
  if (bytes[0] === 0xFE && bytes[1] === 0xFF) return 'utf-16be'

  let sjisScore = 0
  let eucScore = 0
  let utf8Score = 0

  for (let i = 0; i < bytes.length - 1; i++) {
    const b = bytes[i]
    const b2 = bytes[i + 1]
    if ((b >= 0x81 && b <= 0x9F) || (b >= 0xE0 && b <= 0xFC)) {
      if ((b2 >= 0x40 && b2 <= 0x7E) || (b2 >= 0x80 && b2 <= 0xFC)) {
        sjisScore += 2; i++; continue
      }
    }
    if (b >= 0xA1 && b <= 0xFE && b2 >= 0xA1 && b2 <= 0xFE) {
      eucScore += 2; i++; continue
    }
    if (b >= 0xC2 && b <= 0xDF && b2 >= 0x80 && b2 <= 0xBF) {
      utf8Score += 2; i++; continue
    }
    if (b >= 0xE0 && b <= 0xEF && i + 2 < bytes.length) {
      if (b2 >= 0x80 && b2 <= 0xBF && bytes[i + 2] >= 0x80 && bytes[i + 2] <= 0xBF) {
        utf8Score += 3; i += 2; continue
      }
    }
  }

  if (utf8Score >= sjisScore && utf8Score >= eucScore) return 'utf-8'
  if (sjisScore >= eucScore) return 'shift_jis'
  return 'euc-jp'
}

export function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const encoding = detectEncoding(bytes)
  const decoder = new TextDecoder(encoding)
  return decoder.decode(bytes)
}
