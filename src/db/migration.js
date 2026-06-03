import pako from 'pako'
import { db } from './schema.js'

const SCHEMA_VERSION = 1

// Uint8Array ↔ base64（浏览器与 Node 测试环境通用）
function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  if (typeof btoa !== 'undefined') return btoa(binary)
  return Buffer.from(binary, 'binary').toString('base64')
}

function base64ToBytes(b64) {
  let binary
  if (typeof atob !== 'undefined') binary = atob(b64)
  else binary = Buffer.from(b64, 'base64').toString('binary')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function gatherData() {
  return {
    schemaVersion: SCHEMA_VERSION,
    transactions: await db.transactions.toArray(),
    categories: await db.categories.toArray(),
    budgets: await db.budgets.toArray(),
    meta: await db.meta.toArray(),
  }
}

// 导出为压缩 base64 字符串
export async function exportToString() {
  const data = await gatherData()
  const json = JSON.stringify(data)
  const gz = pako.gzip(json)
  return bytesToBase64(gz)
}

function decode(payload) {
  let data
  try {
    const bytes = base64ToBytes(payload)
    const json = pako.ungzip(bytes, { to: 'string' })
    data = JSON.parse(json)
  } catch (e) {
    throw new Error('导入数据损坏或格式不符: ' + e.message)
  }
  if (!data || typeof data.schemaVersion !== 'number' || !Array.isArray(data.transactions)) {
    throw new Error('导入数据缺少必要字段')
  }
  return data
}

// mode: 'overwrite' 清空后写入 | 'merge' 追加（去主键避免冲突）
export async function importFromString(payload, mode = 'overwrite') {
  const data = decode(payload)
  await db.transaction('rw', db.transactions, db.categories, db.budgets, db.meta, async () => {
    if (mode === 'overwrite') {
      await Promise.all([
        db.transactions.clear(),
        db.categories.clear(),
        db.budgets.clear(),
        db.meta.clear(),
      ])
      await db.transactions.bulkAdd(data.transactions)
      await db.categories.bulkAdd(data.categories)
      await db.budgets.bulkAdd(data.budgets)
      await db.meta.bulkPut(data.meta)
    } else {
      // merge：去掉自增主键，作为新记录追加
      const strip = (rows) => rows.map(({ id, ...rest }) => rest)
      await db.transactions.bulkAdd(strip(data.transactions))
      await db.categories.bulkAdd(strip(data.categories))
      await db.budgets.bulkAdd(strip(data.budgets))
      await db.meta.bulkPut(data.meta) // meta 用 key 主键，直接覆盖
    }
  })
}