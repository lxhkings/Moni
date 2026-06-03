import { describe, it, expect, beforeEach } from 'vitest'
import { db, seedDefaults } from '../src/db/schema.js'
import { addTransaction } from '../src/db/transactions.js'
import { exportToString, importFromString } from '../src/db/migration.js'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('migration round-trip', () => {
  it('exportToString → importFromString(overwrite) 数据一致', async () => {
    await seedDefaults()
    await addTransaction({ type: 'expense', amount: 1234, categoryId: 1, note: '午饭', date: '2026-06-01' })
    await addTransaction({ type: 'income', amount: 5000, categoryId: 7, note: '工资', date: '2026-06-01' })

    const payload = await exportToString()
    expect(typeof payload).toBe('string')

    // 清库后导入
    await db.delete()
    await db.open()
    await importFromString(payload, 'overwrite')

    const txs = await db.transactions.toArray()
    expect(txs.length).toBe(2)
    expect(txs.some((t) => t.note === '午饭' && t.amount === 1234)).toBe(true)
    const symbol = await db.meta.get('currencySymbol')
    expect(symbol.value).toBe('¥')
  })

  it('importFromString(overwrite) 先清空旧数据', async () => {
    await seedDefaults()
    await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: '旧', date: '2026-05-01' })
    const payload = await exportToString()

    await addTransaction({ type: 'expense', amount: 200, categoryId: 1, note: '更旧', date: '2026-04-01' })
    await importFromString(payload, 'overwrite')

    const notes = (await db.transactions.toArray()).map((t) => t.note)
    expect(notes).toContain('旧')
    expect(notes).not.toContain('更旧')
  })

  it('importFromString(merge) 保留现有并追加', async () => {
    await seedDefaults()
    await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: 'A', date: '2026-06-01' })
    const payload = await exportToString()

    await db.delete()
    await db.open()
    await seedDefaults()
    await addTransaction({ type: 'expense', amount: 200, categoryId: 1, note: 'B', date: '2026-06-02' })
    await importFromString(payload, 'merge')

    const notes = (await db.transactions.toArray()).map((t) => t.note)
    expect(notes).toContain('A')
    expect(notes).toContain('B')
  })

  it('损坏数据抛错', async () => {
    await expect(importFromString('not-valid-base64-gzip', 'overwrite')).rejects.toThrow()
  })
})