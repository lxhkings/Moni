import { db } from './schema.js'

export async function addTransaction(tx) {
  return db.transactions.add({ ...tx, createdAt: Date.now() })
}

export async function updateTransaction(id, changes) {
  return db.transactions.update(id, changes)
}

export async function deleteTransaction(id) {
  return db.transactions.delete(id)
}

// month 形如 '2026-06'，date 字段形如 '2026-06-15'，前缀匹配即可
export async function listByMonth(month) {
  const all = await db.transactions
    .filter((t) => t.date.startsWith(month))
    .toArray()
  return all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
}

export async function monthlySummary(month) {
  const rows = await listByMonth(month)
  let income = 0
  let expense = 0
  for (const r of rows) {
    if (r.type === 'income') income += r.amount
    else expense += r.amount
  }
  return { income, expense, balance: income - expense }
}