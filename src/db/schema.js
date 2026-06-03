import Dexie from 'dexie'

export const db = new Dexie('moni')

db.version(1).stores({
  // ++id 自增主键；逗号后为索引字段
  transactions: '++id, type, categoryId, date, createdAt',
  categories: '++id, type, sortOrder',
  budgets: '++id, month, categoryId',
  meta: 'key', // key-value: { key, value }
})

const DEFAULT_CATEGORIES = [
  { name: '餐饮', icon: '🍜', type: 'expense', sortOrder: 1 },
  { name: '交通', icon: '🚌', type: 'expense', sortOrder: 2 },
  { name: '购物', icon: '🛍️', type: 'expense', sortOrder: 3 },
  { name: '居住', icon: '🏠', type: 'expense', sortOrder: 4 },
  { name: '娱乐', icon: '🎮', type: 'expense', sortOrder: 5 },
  { name: '医疗', icon: '💊', type: 'expense', sortOrder: 6 },
  { name: '工资', icon: '💰', type: 'income', sortOrder: 1 },
  { name: '红包', icon: '🧧', type: 'income', sortOrder: 2 },
  { name: '其他', icon: '📦', type: 'income', sortOrder: 3 },
]

export async function seedDefaults() {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd(DEFAULT_CATEGORIES)
  }
  if (!(await db.meta.get('currencySymbol'))) {
    await db.meta.put({ key: 'currencySymbol', value: '¥' })
  }
  if (!(await db.meta.get('schemaVersion'))) {
    await db.meta.put({ key: 'schemaVersion', value: 1 })
  }
}