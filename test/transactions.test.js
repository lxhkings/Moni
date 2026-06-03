import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../src/db/schema.js'
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  listByMonth,
  monthlySummary,
} from '../src/db/transactions.js'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('transactions', () => {
  it('addTransaction 写入并返回 id', async () => {
    const id = await addTransaction({
      type: 'expense', amount: 1234, categoryId: 1,
      note: '午饭', date: '2026-06-01',
    })
    expect(id).toBeTypeOf('number')
    const row = await db.transactions.get(id)
    expect(row.amount).toBe(1234)
    expect(row.createdAt).toBeTypeOf('number')
  })

  it('listByMonth 只返回该月流水，按日期倒序', async () => {
    await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: '', date: '2026-06-01' })
    await addTransaction({ type: 'expense', amount: 200, categoryId: 1, note: '', date: '2026-06-15' })
    await addTransaction({ type: 'expense', amount: 300, categoryId: 1, note: '', date: '2026-05-30' })
    const rows = await listByMonth('2026-06')
    expect(rows.length).toBe(2)
    expect(rows[0].date).toBe('2026-06-15') // 倒序
  })

  it('monthlySummary 汇总收入/支出/结余', async () => {
    await addTransaction({ type: 'income', amount: 5000, categoryId: 7, note: '', date: '2026-06-01' })
    await addTransaction({ type: 'expense', amount: 1200, categoryId: 1, note: '', date: '2026-06-02' })
    const s = await monthlySummary('2026-06')
    expect(s.income).toBe(5000)
    expect(s.expense).toBe(1200)
    expect(s.balance).toBe(3800)
  })

  it('updateTransaction 改字段', async () => {
    const id = await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: '', date: '2026-06-01' })
    await updateTransaction(id, { amount: 999 })
    expect((await db.transactions.get(id)).amount).toBe(999)
  })

  it('deleteTransaction 删除', async () => {
    const id = await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: '', date: '2026-06-01' })
    await deleteTransaction(id)
    expect(await db.transactions.get(id)).toBeUndefined()
  })
})