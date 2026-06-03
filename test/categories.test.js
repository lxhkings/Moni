import { describe, it, expect, beforeEach } from 'vitest'
import { db, seedDefaults } from '../src/db/schema.js'
import { listCategories, addCategory, deleteCategory } from '../src/db/categories.js'

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

describe('categories CRUD', () => {
  it('listCategories 按 type 过滤并按 sortOrder 升序', async () => {
    await seedDefaults()
    const exp = await listCategories('expense')
    expect(exp.every((c) => c.type === 'expense')).toBe(true)
    for (let i = 1; i < exp.length; i++) {
      expect(exp[i].sortOrder).toBeGreaterThanOrEqual(exp[i - 1].sortOrder)
    }
  })

  it('addCategory 新增并返回 id', async () => {
    const id = await addCategory({ name: '宠物', icon: '🐶', type: 'expense', sortOrder: 99 })
    expect((await db.categories.get(id)).name).toBe('宠物')
  })

  it('deleteCategory 删除', async () => {
    const id = await addCategory({ name: '临时', icon: '❓', type: 'expense', sortOrder: 100 })
    await deleteCategory(id)
    expect(await db.categories.get(id)).toBeUndefined()
  })
})