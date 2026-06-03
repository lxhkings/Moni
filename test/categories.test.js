import { describe, it, expect, beforeEach } from 'vitest'
import { db, seedDefaults } from '../src/db/schema.js'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('schema seed', () => {
  it('seedDefaults 写入默认分类与 meta', async () => {
    await seedDefaults()
    const cats = await db.categories.toArray()
    expect(cats.length).toBeGreaterThan(0)
    expect(cats.some((c) => c.type === 'expense')).toBe(true)
    expect(cats.some((c) => c.type === 'income')).toBe(true)

    const symbol = await db.meta.get('currencySymbol')
    expect(symbol.value).toBe('¥')
    const ver = await db.meta.get('schemaVersion')
    expect(ver.value).toBe(1)
  })

  it('seedDefaults 幂等：重复调用不重复写分类', async () => {
    await seedDefaults()
    const first = (await db.categories.toArray()).length
    await seedDefaults()
    const second = (await db.categories.toArray()).length
    expect(second).toBe(first)
  })
})