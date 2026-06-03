import { db } from './schema.js'

// categoryId 为 null 表示总预算
export async function setBudget(month, categoryId, amount) {
  const existing = await getBudget(month, categoryId)
  if (existing) {
    return db.budgets.update(existing.id, { amount })
  }
  return db.budgets.add({ month, categoryId, amount })
}

export async function getBudget(month, categoryId) {
  const rows = await db.budgets.where('month').equals(month).toArray()
  return rows.find((b) => b.categoryId === categoryId) || null
}

export async function budgetUsage(month, categoryId) {
  const b = await getBudget(month, categoryId)
  const txs = await db.transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(month))
    .toArray()
  const spent = txs
    .filter((t) => categoryId == null || t.categoryId === categoryId)
    .reduce((sum, t) => sum + t.amount, 0)
  const budget = b ? b.amount : null
  return {
    budget,
    spent,
    remaining: budget == null ? null : budget - spent,
    overBudget: budget == null ? false : spent > budget,
  }
}