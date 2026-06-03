import { db } from './schema.js'

export async function listCategories(type) {
  const rows = type
    ? await db.categories.where('type').equals(type).toArray()
    : await db.categories.toArray()
  return rows.sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function addCategory(cat) {
  return db.categories.add(cat)
}

export async function deleteCategory(id) {
  return db.categories.delete(id)
}