import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../src/db/schema.js'
import { addTransaction } from '../src/db/transactions.js'
import { setBudget, getBudget, budgetUsage } from '../src/db/budgets.js'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('budgets', () => {
  it('setBudget 新增总预算（categoryId 为 null）', async () => {
    await setBudget('2026-06', null, 300000)
    const b = await getBudget('2026-06', null)
    expect(b.amount).toBe(300000)
  })

  it('setBudget 重复设置同月同分类则覆盖', async () => {
    await setBudget('2026-06', null, 300000)
    await setBudget('2026-06', null, 500000)
    const b = await getBudget('2026-06', null)
    expect(b.amount).toBe(500000)
    const all = await db.budgets.where('month').equals('2026-06').toArray()
    expect(all.length).toBe(1)
  })

  it('budgetUsage 计算总预算用量与是否超支', async () => {
    await setBudget('2026-06', null, 100000) // 1000 元
    await addTransaction({ type: 'expense', amount: 60000, categoryId: 1, note: '', date: '2026-06-01' })
    await addTransaction({ type: 'expense', amount: 50000, categoryId: 2, note: '', date: '2026-06-02' })
    const u = await budgetUsage('2026-06', null)
    expect(u.budget).toBe(100000)
    expect(u.spent).toBe(110000)
    expect(u.remaining).toBe(-10000)
    expect(u.overBudget).toBe(true)
  })

  it('budgetUsage 计算分类预算只统计该分类支出', async () => {
    await setBudget('2026-06', 1, 80000)
    await addTransaction({ type: 'expense', amount: 30000, categoryId: 1, note: '', date: '2026-06-01' })
    await addTransaction({ type: 'expense', amount: 99999, categoryId: 2, note: '', date: '2026-06-02' })
    const u = await budgetUsage('2026-06', 1)
    expect(u.spent).toBe(30000)
    expect(u.remaining).toBe(50000)
    expect(u.overBudget).toBe(false)
  })

  it('budgetUsage 未设预算返回 null budget', async () => {
    const u = await budgetUsage('2026-06', null)
    expect(u.budget).toBe(null)
  })
})