// 帧格式: MONI/<index>/<total>/<payloadChunk>
const PREFIX = 'MONI'

export function splitIntoFrames(payload, chunkSize = 1000) {
  const chunks = []
  for (let i = 0; i < payload.length; i += chunkSize) {
    chunks.push(payload.slice(i, i + chunkSize))
  }
  if (chunks.length === 0) chunks.push('')
  const total = chunks.length
  return chunks.map((c, i) => `${PREFIX}/${i}/${total}/${c}`)
}

function parseFrame(text) {
  if (typeof text !== 'string' || !text.startsWith(PREFIX + '/')) return null
  // 只 split 前 3 个 '/'，payload 内可能含 '/'
  const rest = text.slice(PREFIX.length + 1)
  const firstSlash = rest.indexOf('/')
  const secondSlash = rest.indexOf('/', firstSlash + 1)
  if (firstSlash === -1 || secondSlash === -1) return null
  const index = Number(rest.slice(0, firstSlash))
  const total = Number(rest.slice(firstSlash + 1, secondSlash))
  const chunk = rest.slice(secondSlash + 1)
  if (Number.isNaN(index) || Number.isNaN(total)) return null
  return { index, total, chunk }
}

// 输入：扫到的帧文本数组（可乱序/重复/含杂帧）
// 输出：集齐则返回拼接 payload，否则 null
export function reassembleFrames(frameTexts) {
  const parsed = frameTexts.map(parseFrame).filter(Boolean)
  if (parsed.length === 0) return null
  const total = parsed[0].total
  const map = new Map()
  for (const f of parsed) {
    if (f.total !== total) continue
    map.set(f.index, f.chunk)
  }
  if (map.size !== total) return null
  let result = ''
  for (let i = 0; i < total; i++) {
    if (!map.has(i)) return null
    result += map.get(i)
  }
  return result
}