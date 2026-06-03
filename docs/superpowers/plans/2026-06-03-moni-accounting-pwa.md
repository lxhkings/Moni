# Moni 记账 PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个自用、无广告、数据本地的记账 PWA，支持安卓 / iOS（加到主屏）、二维码换机迁移。

**Architecture:** 纯前端 Vue 3 + Vite，无后端。数据存 IndexedDB（Dexie 封装）。业务逻辑（金额、CRUD、迁移、二维码分片）全 TDD 覆盖；UI 视图提供完整组件代码 + 手动验证。PWA 由 vite-plugin-pwa 生成 SW/manifest，部署到免费静态托管。

**Tech Stack:** Vue 3, Vite, Vitest, fake-indexeddb, Dexie.js, pako (gzip), qrcode, jsQR, ECharts, vite-plugin-pwa。

**约定**
- 金额一律以「分」整数存储，避免浮点误差。
- 所有逻辑模块测试用 Vitest，DB 测试用 `fake-indexeddb` 注入。
- 每个任务末尾 commit。

---

## File Structure

```
Moni/
  index.html              # PWA 入口
  package.json
  vite.config.js          # Vite + PWA 插件配置
  vitest.config.js        # 测试配置 (jsdom + fake-indexeddb setup)
  test/setup.js           # 全局测试预置 (注入 fake-indexeddb)
  src/
    main.js               # 应用挂载 + router
    App.vue               # 外壳：<router-view> + 底部 4 Tab
    router.js             # 4 个路由
    money.js              # 分↔元 转换
    db/
      schema.js           # Dexie 实例 + 表定义 + 默认分类 seed
      transactions.js     # 流水 CRUD + 月度汇总
      categories.js       # 分类 CRUD
      budgets.js          # 预算 CRUD + 预算用量计算
      migration.js        # 导出/导入 JSON (gzip+base64) + 文件兜底
      qr.js               # 二维码分片切割 / 拼接还原
    components/
      NumberKeypad.vue    # 大数字键盘
      CategoryGrid.vue    # 分类图标网格
      TransactionList.vue # 按日分组流水列表
    views/
      DetailView.vue      # 明细 Tab
      AddView.vue         # 记一笔 Tab
      ReportView.vue      # 报表 Tab
      SettingsView.vue    # 我的 Tab
  test/
    money.test.js
    transactions.test.js
    categories.test.js
    budgets.test.js
    migration.test.js
    qr.test.js
  docs/
    DEPLOY.md             # 部署 + 安装说明
```

---

## Task 1: 项目脚手架

**Files:**
- Create: `package.json`, `vite.config.js`, `vitest.config.js`, `test/setup.js`, `index.html`, `src/main.js`, `src/App.vue`

- [ ] **Step 1: 初始化 npm + 装依赖**

Run:
```bash
npm init -y
npm install vue dexie pako qrcode jsqr echarts
npm install -D vite @vitejs/plugin-vue vitest jsdom fake-indexeddb vite-plugin-pwa @vue/test-utils
```

- [ ] **Step 2: 写 `vite.config.js`**（PWA 插件后续 Task 14 再加配置，先留基础）

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
})
```

- [ ] **Step 3: 写 `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    globals: true,
  },
})
```

- [ ] **Step 4: 写 `test/setup.js`**（注入 fake-indexeddb，让 DB 测试可跑）

```js
import 'fake-indexeddb/auto'
```

- [ ] **Step 5: 写 `index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <title>Moni 记账</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 6: 写 `src/App.vue`**（占位，Task 9 完善 Tab）

```vue
<template>
  <div id="moni-app">
    <h1>Moni</h1>
  </div>
</template>
```

- [ ] **Step 7: 写 `src/main.js`**（占位，Task 9 接 router）

```js
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

- [ ] **Step 8: 加 npm scripts 到 `package.json`**

在 `"scripts"` 中加入：
```json
"dev": "vite",
"build": "vite build",
"preview": "vite preview",
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 9: 验证脚手架可跑**

Run: `npm run test`
Expected: PASS（无测试文件，输出 "No test files found" 或 0 通过，命令退出 0）

Run: `npm run build`
Expected: 构建成功，生成 `dist/`

- [ ] **Step 10: Commit**

```bash
git add .gitignore package.json package-lock.json vite.config.js vitest.config.js test/setup.js index.html src/main.js src/App.vue
git commit -m "chore: scaffold Vue3 + Vite + Vitest PWA project"
```

（`.gitignore` 至少含 `node_modules/` 与 `dist/`。）

---

## Task 2: 金额工具（分↔元）

**Files:**
- Create: `src/money.js`
- Test: `test/money.test.js`

- [ ] **Step 1: 写失败测试**

`test/money.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { yuanToCents, centsToYuan, formatYuan } from '../src/money.js'

describe('money', () => {
  it('yuanToCents 把元字符串转成分整数', () => {
    expect(yuanToCents('12.34')).toBe(1234)
    expect(yuanToCents('100')).toBe(10000)
    expect(yuanToCents('0.5')).toBe(50)
    expect(yuanToCents('0.05')).toBe(5)
  })

  it('yuanToCents 四舍五入到分', () => {
    expect(yuanToCents('1.005')).toBe(101)
  })

  it('centsToYuan 把分转成两位小数元字符串', () => {
    expect(centsToYuan(1234)).toBe('12.34')
    expect(centsToYuan(5)).toBe('0.05')
    expect(centsToYuan(0)).toBe('0.00')
  })

  it('formatYuan 带货币符号', () => {
    expect(formatYuan(1234, '¥')).toBe('¥12.34')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/money.test.js`
Expected: FAIL（`yuanToCents is not a function` / 模块不存在）

- [ ] **Step 3: 写实现 `src/money.js`**

```js
// 金额统一以「分」整数存储与计算，规避浮点误差。

export function yuanToCents(yuan) {
  const n = Number(yuan)
  if (Number.isNaN(n)) throw new Error(`非法金额: ${yuan}`)
  return Math.round(n * 100)
}

export function centsToYuan(cents) {
  return (cents / 100).toFixed(2)
}

export function formatYuan(cents, symbol = '¥') {
  return `${symbol}${centsToYuan(cents)}`
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/money.test.js`
Expected: PASS（4 通过）

- [ ] **Step 5: Commit**

```bash
git add src/money.js test/money.test.js
git commit -m "feat: add money cents/yuan conversion utils"
```

---

## Task 3: 数据库 schema + 默认分类 seed

**Files:**
- Create: `src/db/schema.js`
- Test: `test/categories.test.js`（本任务先写 seed 测试，CRUD 在 Task 5 续）

- [ ] **Step 1: 写失败测试**

`test/categories.test.js`:
```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/categories.test.js`
Expected: FAIL（模块 `src/db/schema.js` 不存在）

- [ ] **Step 3: 写实现 `src/db/schema.js`**

```js
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
```

注意：测试里用 `db.meta.get('currencySymbol')` 返回 `{key, value}`，断言读 `.value`，与实现一致。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/categories.test.js`
Expected: PASS（2 通过）

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.js test/categories.test.js
git commit -m "feat: add Dexie schema with default category seed"
```

---

## Task 4: 流水 CRUD + 月度汇总

**Files:**
- Create: `src/db/transactions.js`
- Test: `test/transactions.test.js`

- [ ] **Step 1: 写失败测试**

`test/transactions.test.js`:
```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/transactions.test.js`
Expected: FAIL（`src/db/transactions.js` 不存在）

- [ ] **Step 3: 写实现 `src/db/transactions.js`**

```js
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/transactions.test.js`
Expected: PASS（5 通过）

- [ ] **Step 5: Commit**

```bash
git add src/db/transactions.js test/transactions.test.js
git commit -m "feat: add transaction CRUD and monthly summary"
```

---

## Task 5: 分类 CRUD

**Files:**
- Create: `src/db/categories.js`
- Test: 续写 `test/categories.test.js`

- [ ] **Step 1: 追加失败测试**

在 `test/categories.test.js` 顶部 import 改为：
```js
import { db, seedDefaults } from '../src/db/schema.js'
import { listCategories, addCategory, deleteCategory } from '../src/db/categories.js'
```

在文件末尾追加：
```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/categories.test.js`
Expected: FAIL（`src/db/categories.js` 不存在）

- [ ] **Step 3: 写实现 `src/db/categories.js`**

```js
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/categories.test.js`
Expected: PASS（全部通过）

- [ ] **Step 5: Commit**

```bash
git add src/db/categories.js test/categories.test.js
git commit -m "feat: add category CRUD"
```

---

## Task 6: 预算 CRUD + 用量计算

**Files:**
- Create: `src/db/budgets.js`
- Test: `test/budgets.test.js`

- [ ] **Step 1: 写失败测试**

`test/budgets.test.js`:
```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/budgets.test.js`
Expected: FAIL（`src/db/budgets.js` 不存在）

- [ ] **Step 3: 写实现 `src/db/budgets.js`**

```js
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/budgets.test.js`
Expected: PASS（5 通过）

- [ ] **Step 5: Commit**

```bash
git add src/db/budgets.js test/budgets.test.js
git commit -m "feat: add budget CRUD and usage calculation"
```

---

## Task 7: 数据导出 / 导入（gzip + base64 往返）

**Files:**
- Create: `src/db/migration.js`
- Test: `test/migration.test.js`

- [ ] **Step 1: 写失败测试**

`test/migration.test.js`:
```js
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/migration.test.js`
Expected: FAIL（`src/db/migration.js` 不存在）

- [ ] **Step 3: 写实现 `src/db/migration.js`**

```js
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
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/migration.test.js`
Expected: PASS（4 通过）

- [ ] **Step 5: Commit**

```bash
git add src/db/migration.js test/migration.test.js
git commit -m "feat: add data export/import with gzip+base64 round-trip"
```

---

## Task 8: 二维码分片 / 拼接还原

**Files:**
- Create: `src/db/qr.js`
- Test: `test/qr.test.js`

- [ ] **Step 1: 写失败测试**

`test/qr.test.js`:
```js
import { describe, it, expect } from 'vitest'
import { splitIntoFrames, reassembleFrames } from '../src/db/qr.js'

describe('qr framing', () => {
  it('小数据切成单帧', () => {
    const frames = splitIntoFrames('hello', 100)
    expect(frames.length).toBe(1)
    expect(frames[0]).toBe('MONI/0/1/hello')
  })

  it('大数据按 chunkSize 切多帧', () => {
    const payload = 'abcdefghij' // 10 字符
    const frames = splitIntoFrames(payload, 4)
    expect(frames.length).toBe(3) // 4+4+2
    expect(frames[0]).toBe('MONI/0/3/abcd')
    expect(frames[2]).toBe('MONI/2/3/ij')
  })

  it('reassembleFrames 乱序也能还原', () => {
    const frames = splitIntoFrames('abcdefghij', 4)
    const shuffled = [frames[2], frames[0], frames[1]]
    expect(reassembleFrames(shuffled)).toBe('abcdefghij')
  })

  it('reassembleFrames 缺帧返回 null', () => {
    const frames = splitIntoFrames('abcdefghij', 4)
    const partial = [frames[0], frames[2]] // 缺第 1 帧
    expect(reassembleFrames(partial)).toBe(null)
  })

  it('reassembleFrames 去重重复扫到的同一帧', () => {
    const frames = splitIntoFrames('abcdefghij', 4)
    const withDup = [frames[0], frames[0], frames[1], frames[2]]
    expect(reassembleFrames(withDup)).toBe('abcdefghij')
  })

  it('忽略非 MONI 前缀帧', () => {
    const frames = splitIntoFrames('hello', 100)
    expect(reassembleFrames(['random-qr', ...frames])).toBe('hello')
  })
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run test/qr.test.js`
Expected: FAIL（`src/db/qr.js` 不存在）

- [ ] **Step 3: 写实现 `src/db/qr.js`**

```js
// 帧格式: MONI/<index>/<total>/<payloadChunk>
const PREFIX = 'MONI'

export function splitIntoFrames(payload, chunkSize = 1000) {
  const chunks = []
  for (let i = 0; i < payload.length; i += chunkSize) {
    chunks.push(payload.slice(i, i + chunkSize))
  }
  if (chunks.length === 0) chunks.push('')
  const total = chunks.length
  return chunks.map((c, i) => `${PREFIX}/${i}/${total}/${c}`)
}

function parseFrame(text) {
  if (typeof text !== 'string' || !text.startsWith(PREFIX + '/')) return null
  // 只 split 前 3 个 '/'，payload 内可能含 '/'
  const rest = text.slice(PREFIX.length + 1)
  const firstSlash = rest.indexOf('/')
  const secondSlash = rest.indexOf('/', firstSlash + 1)
  if (firstSlash === -1 || secondSlash === -1) return null
  const index = Number(rest.slice(0, firstSlash))
  const total = Number(rest.slice(firstSlash + 1, secondSlash))
  const chunk = rest.slice(secondSlash + 1)
  if (Number.isNaN(index) || Number.isNaN(total)) return null
  return { index, total, chunk }
}

// 输入：扫到的帧文本数组（可乱序/重复/含杂帧）
// 输出：集齐则返回拼接 payload，否则 null
export function reassembleFrames(frameTexts) {
  const parsed = frameTexts.map(parseFrame).filter(Boolean)
  if (parsed.length === 0) return null
  const total = parsed[0].total
  const map = new Map()
  for (const f of parsed) {
    if (f.total !== total) continue
    map.set(f.index, f.chunk)
  }
  if (map.size !== total) return null
  let result = ''
  for (let i = 0; i < total; i++) {
    if (!map.has(i)) return null
    result += map.get(i)
  }
  return result
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run test/qr.test.js`
Expected: PASS（6 通过）

- [ ] **Step 5: 跑全量测试回归**

Run: `npm run test`
Expected: PASS（全部测试文件通过）

- [ ] **Step 6: Commit**

```bash
git add src/db/qr.js test/qr.test.js
git commit -m "feat: add QR multi-frame split/reassemble"
```

---

## Task 9: 应用外壳 + 路由 + 4 Tab

**Files:**
- Create: `src/router.js`
- Create: `src/views/DetailView.vue`, `src/views/AddView.vue`, `src/views/ReportView.vue`, `src/views/SettingsView.vue`（先占位）
- Modify: `src/App.vue`, `src/main.js`

> UI 任务以手动验证为主（无单测）。每步给完整代码。

- [ ] **Step 1: 装 vue-router**

Run: `npm install vue-router@4`

- [ ] **Step 2: 写 4 个占位视图**

`src/views/DetailView.vue`:
```vue
<template><div class="page"><h2>明细</h2></div></template>
```
`src/views/AddView.vue`:
```vue
<template><div class="page"><h2>记一笔</h2></div></template>
```
`src/views/ReportView.vue`:
```vue
<template><div class="page"><h2>报表</h2></div></template>
```
`src/views/SettingsView.vue`:
```vue
<template><div class="page"><h2>我的</h2></div></template>
```

- [ ] **Step 3: 写 `src/router.js`**

```js
import { createRouter, createWebHashHistory } from 'vue-router'
import DetailView from './views/DetailView.vue'
import AddView from './views/AddView.vue'
import ReportView from './views/ReportView.vue'
import SettingsView from './views/SettingsView.vue'

export const router = createRouter({
  history: createWebHashHistory(), // hash 模式，静态托管无需服务端路由配置
  routes: [
    { path: '/', redirect: '/detail' },
    { path: '/detail', component: DetailView },
    { path: '/add', component: AddView },
    { path: '/report', component: ReportView },
    { path: '/settings', component: SettingsView },
  ],
})
```

- [ ] **Step 4: 写 `src/App.vue`（外壳 + 底部 Tab + 全局样式）**

```vue
<template>
  <div class="app">
    <main class="content">
      <router-view />
    </main>
    <nav class="tabbar">
      <router-link to="/detail" class="tab">📋<span>明细</span></router-link>
      <router-link to="/add" class="tab tab-add">➕<span>记一笔</span></router-link>
      <router-link to="/report" class="tab">📊<span>报表</span></router-link>
      <router-link to="/settings" class="tab">👤<span>我的</span></router-link>
    </nav>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f7; color: #1c1c1e; }
.app { display: flex; flex-direction: column; height: 100vh; }
.content { flex: 1; overflow-y: auto; padding: 16px; padding-bottom: 80px; }
.page h2 { margin-bottom: 16px; }
.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; background: #fff; border-top: 1px solid #e0e0e0;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 8px 0; font-size: 20px; text-decoration: none; color: #8e8e93;
}
.tab span { font-size: 11px; margin-top: 2px; }
.tab.router-link-active { color: #007aff; }
</style>
```

- [ ] **Step 5: 改 `src/main.js` 接 router + 首启 seed**

```js
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'
import { seedDefaults } from './db/schema.js'

seedDefaults().then(() => {
  createApp(App).use(router).mount('#app')
})
```

- [ ] **Step 6: 手动验证**

Run: `npm run dev`
打开浏览器（开发者工具切手机视图），底部 4 Tab 可切换，明细/记一笔/报表/我的 各显示对应标题。

- [ ] **Step 7: Commit**

```bash
git add src/router.js src/views/ src/App.vue src/main.js package.json package-lock.json
git commit -m "feat: add app shell with bottom tabs and routing"
```

---

## Task 10: 记一笔（键盘 + 分类网格）

**Files:**
- Create: `src/components/NumberKeypad.vue`, `src/components/CategoryGrid.vue`
- Modify: `src/views/AddView.vue`

- [ ] **Step 1: 写 `src/components/CategoryGrid.vue`**

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { listCategories } from '../db/categories.js'

const props = defineProps({ type: { type: String, default: 'expense' } })
const emit = defineEmits(['select'])
const cats = ref([])
const selectedId = ref(null)

onMounted(async () => {
  cats.value = await listCategories(props.type)
})

function pick(c) {
  selectedId.value = c.id
  emit('select', c)
}
</script>

<template>
  <div class="grid">
    <button
      v-for="c in cats" :key="c.id"
      class="cat" :class="{ active: c.id === selectedId }"
      @click="pick(c)"
    >
      <span class="icon">{{ c.icon }}</span>
      <span class="name">{{ c.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.cat {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: none; background: transparent; padding: 8px; border-radius: 12px; cursor: pointer;
}
.cat .icon { font-size: 28px; }
.cat .name { font-size: 12px; color: #555; }
.cat.active { background: #e5f0ff; }
.cat.active .name { color: #007aff; }
</style>
```

- [ ] **Step 2: 写 `src/components/NumberKeypad.vue`**

```vue
<script setup>
const emit = defineEmits(['input', 'delete', 'done'])
const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', 'del']
function press(k) {
  if (k === 'del') emit('delete')
  else emit('input', k)
}
</script>

<template>
  <div class="keypad">
    <button v-for="k in keys" :key="k" class="key" @click="press(k)">
      {{ k === 'del' ? '⌫' : k }}
    </button>
    <button class="key done" @click="emit('done')">保存</button>
  </div>
</template>

<style scoped>
.keypad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: #ddd; }
.key {
  background: #fff; border: none; font-size: 22px; padding: 18px 0; cursor: pointer;
}
.key:active { background: #eee; }
.key.done { grid-column: span 3; background: #007aff; color: #fff; font-size: 18px; }
</style>
```

- [ ] **Step 3: 写 `src/views/AddView.vue`**

```vue
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import NumberKeypad from '../components/NumberKeypad.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import { addTransaction } from '../db/transactions.js'
import { yuanToCents } from '../money.js'

const router = useRouter()
const type = ref('expense')
const amountStr = ref('0')
const category = ref(null)
const note = ref('')
const date = ref(new Date().toISOString().slice(0, 10))

function onInput(k) {
  if (k === '.' && amountStr.value.includes('.')) return
  if (amountStr.value === '0' && k !== '.') amountStr.value = k
  else amountStr.value += k
}
function onDelete() {
  amountStr.value = amountStr.value.length > 1 ? amountStr.value.slice(0, -1) : '0'
}
async function onDone() {
  const cents = yuanToCents(amountStr.value)
  if (cents <= 0) { alert('请输入金额'); return }
  if (!category.value) { alert('请选分类'); return }
  await addTransaction({
    type: type.value, amount: cents, categoryId: category.value.id,
    note: note.value, date: date.value,
  })
  router.push('/detail')
}
</script>

<template>
  <div class="page add">
    <div class="type-switch">
      <button :class="{ on: type === 'expense' }" @click="type = 'expense'; category = null">支出</button>
      <button :class="{ on: type === 'income' }" @click="type = 'income'; category = null">收入</button>
    </div>
    <div class="amount">{{ amountStr }}</div>
    <CategoryGrid :type="type" :key="type" @select="category = $event" />
    <div class="meta">
      <input v-model="date" type="date" />
      <input v-model="note" placeholder="备注" />
    </div>
    <NumberKeypad @input="onInput" @delete="onDelete" @done="onDone" />
  </div>
</template>

<style scoped>
.type-switch { display: flex; gap: 8px; margin-bottom: 12px; }
.type-switch button { flex: 1; padding: 8px; border: 1px solid #ccc; background: #fff; border-radius: 8px; }
.type-switch button.on { background: #007aff; color: #fff; border-color: #007aff; }
.amount { font-size: 40px; text-align: right; margin: 12px 0; font-variant-numeric: tabular-nums; }
.meta { display: flex; gap: 8px; margin: 12px 0; }
.meta input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
</style>
```

- [ ] **Step 4: 手动验证**

Run: `npm run dev`
记一笔：切支出/收入→点数字→选分类→填日期备注→保存→跳到明细。再次记账分类网格按类型刷新。

- [ ] **Step 5: Commit**

```bash
git add src/components/NumberKeypad.vue src/components/CategoryGrid.vue src/views/AddView.vue
git commit -m "feat: add 记一笔 view with keypad and category grid"
```

---

## Task 11: 明细（列表 + 月度汇总）

**Files:**
- Create: `src/components/TransactionList.vue`
- Modify: `src/views/DetailView.vue`

- [ ] **Step 1: 写 `src/components/TransactionList.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { centsToYuan } from '../money.js'

const props = defineProps({
  transactions: { type: Array, required: true },
  categoryMap: { type: Object, required: true }, // { [id]: {name, icon} }
})
const emit = defineEmits(['delete'])

// 按 date 分组
const groups = computed(() => {
  const map = {}
  for (const t of props.transactions) {
    ;(map[t.date] ||= []).push(t)
  }
  return Object.keys(map).sort((a, b) => (a < b ? 1 : -1)).map((date) => ({ date, items: map[date] }))
})
</script>

<template>
  <div>
    <div v-for="g in groups" :key="g.date" class="day-group">
      <div class="day-head">{{ g.date }}</div>
      <div
        v-for="t in g.items" :key="t.id" class="row"
        @click="emit('delete', t)"
      >
        <span class="icon">{{ (categoryMap[t.categoryId] || {}).icon || '❓' }}</span>
        <span class="name">{{ (categoryMap[t.categoryId] || {}).name || '未知' }}</span>
        <span class="note">{{ t.note }}</span>
        <span class="amt" :class="t.type">
          {{ t.type === 'expense' ? '-' : '+' }}{{ centsToYuan(t.amount) }}
        </span>
      </div>
    </div>
    <p v-if="groups.length === 0" class="empty">本月还没有记账</p>
  </div>
</template>

<style scoped>
.day-head { font-size: 12px; color: #999; margin: 12px 0 4px; }
.row { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fff; border-radius: 10px; margin-bottom: 6px; }
.row .icon { font-size: 22px; }
.row .name { font-weight: 500; }
.row .note { color: #999; font-size: 12px; flex: 1; }
.amt { font-variant-numeric: tabular-nums; }
.amt.expense { color: #1c1c1e; }
.amt.income { color: #34c759; }
.empty { text-align: center; color: #999; margin-top: 40px; }
</style>
```

- [ ] **Step 2: 写 `src/views/DetailView.vue`**

```vue
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import TransactionList from '../components/TransactionList.vue'
import { listByMonth, monthlySummary, deleteTransaction } from '../db/transactions.js'
import { listCategories } from '../db/categories.js'
import { centsToYuan } from '../money.js'

const month = ref(new Date().toISOString().slice(0, 7))
const txs = ref([])
const summary = ref({ income: 0, expense: 0, balance: 0 })
const categoryMap = ref({})

async function load() {
  txs.value = await listByMonth(month.value)
  summary.value = await monthlySummary(month.value)
  const cats = await listCategories()
  categoryMap.value = Object.fromEntries(cats.map((c) => [c.id, c]))
}
onMounted(load)

async function onDelete(t) {
  if (confirm(`删除这条「${t.note || ''}」记录？`)) {
    await deleteTransaction(t.id)
    await load()
  }
}
function changeMonth(delta) {
  const d = new Date(month.value + '-01')
  d.setMonth(d.getMonth() + delta)
  month.value = d.toISOString().slice(0, 7)
  load()
}
</script>

<template>
  <div class="page">
    <div class="month-bar">
      <button @click="changeMonth(-1)">‹</button>
      <span>{{ month }}</span>
      <button @click="changeMonth(1)">›</button>
    </div>
    <div class="summary">
      <div><small>收入</small><b class="income">{{ centsToYuan(summary.income) }}</b></div>
      <div><small>支出</small><b>{{ centsToYuan(summary.expense) }}</b></div>
      <div><small>结余</small><b>{{ centsToYuan(summary.balance) }}</b></div>
    </div>
    <TransactionList :transactions="txs" :category-map="categoryMap" @delete="onDelete" />
  </div>
</template>

<style scoped>
.month-bar { display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 12px; }
.month-bar button { border: none; background: transparent; font-size: 22px; }
.summary { display: flex; background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.summary div { flex: 1; text-align: center; display: flex; flex-direction: column; }
.summary small { color: #999; font-size: 12px; }
.summary b { font-size: 18px; font-variant-numeric: tabular-nums; }
.summary .income { color: #34c759; }
</style>
```

- [ ] **Step 3: 手动验证**

Run: `npm run dev`
记几笔后看明细：顶部汇总正确，按日分组，月份可前后切换，点条目可删。

- [ ] **Step 4: Commit**

```bash
git add src/components/TransactionList.vue src/views/DetailView.vue
git commit -m "feat: add 明细 view with grouped list and monthly summary"
```

---

## Task 12: 报表（饼图 + 折线）

**Files:**
- Modify: `src/views/ReportView.vue`

- [ ] **Step 1: 写 `src/views/ReportView.vue`**（ECharts 饼图 + 趋势折线）

```vue
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { listByMonth } from '../db/transactions.js'
import { listCategories } from '../db/categories.js'

const month = ref(new Date().toISOString().slice(0, 7))
const pieEl = ref(null)
const lineEl = ref(null)
let pieChart = null
let lineChart = null

async function load() {
  const txs = await listByMonth(month.value)
  const cats = await listCategories()
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]))

  // 饼图：按分类汇总支出（元）
  const byCat = {}
  for (const t of txs) {
    if (t.type !== 'expense') continue
    const name = catMap[t.categoryId] || '未知'
    byCat[name] = (byCat[name] || 0) + t.amount
  }
  const pieData = Object.entries(byCat).map(([name, cents]) => ({ name, value: cents / 100 }))
  pieChart.setOption({
    title: { text: '支出分类', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    series: [{ type: 'pie', radius: '60%', data: pieData }],
  })

  // 折线：当月每日支出（元）
  const days = {}
  for (const t of txs) {
    if (t.type !== 'expense') continue
    const d = t.date.slice(8) // DD
    days[d] = (days[d] || 0) + t.amount
  }
  const xs = Object.keys(days).sort()
  lineChart.setOption({
    title: { text: '每日支出', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xs },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: xs.map((d) => days[d] / 100), smooth: true }],
  })
}

onMounted(() => {
  pieChart = echarts.init(pieEl.value)
  lineChart = echarts.init(lineEl.value)
  load()
})
onBeforeUnmount(() => { pieChart?.dispose(); lineChart?.dispose() })
watch(month, load)

function changeMonth(delta) {
  const d = new Date(month.value + '-01')
  d.setMonth(d.getMonth() + delta)
  month.value = d.toISOString().slice(0, 7)
}
</script>

<template>
  <div class="page">
    <div class="month-bar">
      <button @click="changeMonth(-1)">‹</button>
      <span>{{ month }}</span>
      <button @click="changeMonth(1)">›</button>
    </div>
    <div ref="pieEl" class="chart"></div>
    <div ref="lineEl" class="chart"></div>
  </div>
</template>

<style scoped>
.month-bar { display: flex; justify-content: center; align-items: center; gap: 16px; margin-bottom: 12px; }
.month-bar button { border: none; background: transparent; font-size: 22px; }
.chart { width: 100%; height: 280px; background: #fff; border-radius: 12px; margin-bottom: 12px; }
</style>
```

- [ ] **Step 2: 手动验证**

Run: `npm run dev`
报表：饼图显示各分类支出占比，折线显示当月每日支出，月份切换刷新。

- [ ] **Step 3: Commit**

```bash
git add src/views/ReportView.vue
git commit -m "feat: add 报表 view with ECharts pie and line charts"
```

---

## Task 13: 我的（预算 / 分类管理 / 导出 / 扫码迁移 / 货币）

**Files:**
- Modify: `src/views/SettingsView.vue`

- [ ] **Step 1: 写 `src/views/SettingsView.vue`**（含预算设置、文件导出/导入、二维码导出展示、扫码导入）

```vue
<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { db } from '../db/schema.js'
import { setBudget, getBudget, budgetUsage } from '../db/budgets.js'
import { exportToString, importFromString } from '../db/migration.js'
import { splitIntoFrames, reassembleFrames } from '../db/qr.js'
import { yuanToCents, centsToYuan } from '../money.js'

const month = ref(new Date().toISOString().slice(0, 7))
const budgetYuan = ref('')
const usage = ref(null)

async function loadBudget() {
  const b = await getBudget(month.value, null)
  budgetYuan.value = b ? centsToYuan(b.amount) : ''
  usage.value = await budgetUsage(month.value, null)
}
onMounted(loadBudget)

async function saveBudget() {
  if (!budgetYuan.value) return
  await setBudget(month.value, null, yuanToCents(budgetYuan.value))
  await loadBudget()
  alert('预算已保存')
}

// ---- 文件导出/导入（兜底备份）----
async function exportFile() {
  const payload = await exportToString()
  const blob = new Blob([payload], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `moni-backup-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
async function importFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const text = await file.text()
  if (!confirm('覆盖导入将清空当前数据，继续？')) return
  try {
    await importFromString(text, 'overwrite')
    alert('导入成功，请重启应用')
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

// ---- 二维码导出 ----
const qrFrames = ref([])
const qrIndex = ref(0)
const qrImg = ref('')
let qrTimer = null
const CHUNK = 800 // 单帧 payload 字符上限，留余量保证可扫

async function startQrExport() {
  const payload = await exportToString()
  qrFrames.value = splitIntoFrames(payload, CHUNK)
  qrIndex.value = 0
  await renderFrame()
  if (qrTimer) clearInterval(qrTimer)
  if (qrFrames.value.length > 1) {
    qrTimer = setInterval(() => {
      qrIndex.value = (qrIndex.value + 1) % qrFrames.value.length
      renderFrame()
    }, 1500) // 每 1.5s 轮播下一帧
  }
}
async function renderFrame() {
  qrImg.value = await QRCode.toDataURL(qrFrames.value[qrIndex.value], { width: 280 })
}
function stopQrExport() {
  if (qrTimer) clearInterval(qrTimer)
  qrFrames.value = []
  qrImg.value = ''
}

// ---- 扫码导入 ----
const scanning = ref(false)
const collected = ref([]) // 已扫帧文本
const scanStatus = ref('')
const videoEl = ref(null)
let stream = null
let rafId = null

async function startScan() {
  scanning.value = true
  collected.value = []
  scanStatus.value = '对准旧手机二维码…'
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  videoEl.value.srcObject = stream
  await videoEl.value.play()
  tick()
}
function tick() {
  const video = videoEl.value
  if (!scanning.value || !video) return
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height)
    if (code && code.data.startsWith('MONI/')) {
      if (!collected.value.includes(code.data)) collected.value.push(code.data)
      const payload = reassembleFrames(collected.value)
      scanStatus.value = `已扫 ${collected.value.length} 帧…`
      if (payload) {
        finishScan(payload)
        return
      }
    }
  }
  rafId = requestAnimationFrame(tick)
}
async function finishScan(payload) {
  stopScan()
  if (!confirm('覆盖导入将清空本机数据，继续？')) return
  try {
    await importFromString(payload, 'overwrite')
    alert('迁移成功，请重启应用')
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}
function stopScan() {
  scanning.value = false
  if (rafId) cancelAnimationFrame(rafId)
  if (stream) stream.getTracks().forEach((t) => t.stop())
}

// ---- 货币符号 ----
const currency = ref('¥')
onMounted(async () => {
  const m = await db.meta.get('currencySymbol')
  if (m) currency.value = m.value
})
async function saveCurrency() {
  await db.meta.put({ key: 'currencySymbol', value: currency.value })
  alert('已保存')
}
</script>

<template>
  <div class="page settings">
    <section>
      <h3>本月预算（{{ month }}）</h3>
      <div class="row">
        <input v-model="budgetYuan" type="number" placeholder="预算金额(元)" />
        <button @click="saveBudget">保存</button>
      </div>
      <p v-if="usage && usage.budget != null" :class="{ over: usage.overBudget }">
        已花 {{ centsToYuan(usage.spent) }} / {{ centsToYuan(usage.budget) }}
        <span v-if="usage.overBudget">⚠️ 已超支</span>
        <span v-else>，剩 {{ centsToYuan(usage.remaining) }}</span>
      </p>
    </section>

    <section>
      <h3>货币符号</h3>
      <div class="row">
        <input v-model="currency" maxlength="3" />
        <button @click="saveCurrency">保存</button>
      </div>
    </section>

    <section>
      <h3>换机迁移（二维码）</h3>
      <p class="hint">旧机点"显示二维码"，新机点"扫码导入"，多帧请持续对准轮播。</p>
      <div class="row">
        <button @click="startQrExport">显示二维码</button>
        <button @click="startScan">扫码导入</button>
      </div>
      <div v-if="qrImg" class="qr-box">
        <img :src="qrImg" />
        <p>第 {{ qrIndex + 1 }} / {{ qrFrames.length }} 帧</p>
        <button @click="stopQrExport">关闭</button>
      </div>
      <div v-if="scanning" class="scan-box">
        <video ref="videoEl" playsinline></video>
        <p>{{ scanStatus }}</p>
        <button @click="stopScan">取消</button>
      </div>
    </section>

    <section>
      <h3>文件备份（兜底）</h3>
      <div class="row">
        <button @click="exportFile">导出备份文件</button>
        <label class="file-btn">
          导入备份文件
          <input type="file" accept=".txt" @change="importFile" hidden />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
section { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
section h3 { font-size: 15px; margin-bottom: 10px; }
.row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.row input { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 8px; }
.row button, .file-btn {
  padding: 8px 14px; border: none; background: #007aff; color: #fff; border-radius: 8px; cursor: pointer;
}
.hint { color: #999; font-size: 12px; margin-bottom: 8px; }
.over { color: #ff3b30; }
.qr-box, .scan-box { text-align: center; margin-top: 12px; }
.qr-box img { width: 280px; height: 280px; }
.scan-box video { width: 100%; max-width: 320px; border-radius: 12px; }
</style>
```

- [ ] **Step 2: 手动验证（单机）**

Run: `npm run dev`
- 设预算→明细记超额支出→回我的看"已超支"提示。
- 点"显示二维码"出图（数据多则轮播）。
- 导出备份文件成功下载 `.txt`。
- 改货币符号保存。
- 扫码 / 摄像头需 HTTPS 或 localhost；本地 `localhost` 可测摄像头授权弹窗。

- [ ] **Step 3: Commit**

```bash
git add src/views/SettingsView.vue
git commit -m "feat: add 我的 view: budget, QR migration, file backup, currency"
```

---

## Task 14: PWA 配置（manifest + Service Worker）

**Files:**
- Modify: `vite.config.js`
- Create: `public/icon-192.png`, `public/icon-512.png`（应用图标，可用任意纯色方图占位）

- [ ] **Step 1: 准备图标**

放两张 PNG 到 `public/`：`icon-192.png`（192×192）、`icon-512.png`（512×512）。占位可用纯色方块图。

- [ ] **Step 2: 改 `vite.config.js` 接入 vite-plugin-pwa**

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // 静态托管子路径兼容
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Moni 记账',
        short_name: 'Moni',
        description: '无广告本地记账',
        theme_color: '#007aff',
        background_color: '#f5f5f7',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
})
```

- [ ] **Step 3: 构建验证**

Run: `npm run build`
Expected: 构建成功，`dist/` 内出现 `manifest.webmanifest`、`sw.js`（或 `registerSW.js`）。

Run: `npm run preview`
打开预览地址，浏览器开发者工具 Application → Manifest 显示 Moni，Service Worker 已注册。

- [ ] **Step 4: Commit**

```bash
git add vite.config.js public/icon-192.png public/icon-512.png
git commit -m "feat: add PWA manifest and service worker config"
```

---

## Task 15: 部署 + 安装文档

**Files:**
- Create: `docs/DEPLOY.md`

- [ ] **Step 1: 写 `docs/DEPLOY.md`**

```markdown
# Moni 部署与安装

## 部署到免费静态托管

构建产物在 `dist/`。任选其一：

### Vercel
1. `npm i -g vercel`
2. `npm run build`
3. `vercel --prod`（首次按提示登录、选项目）
4. 得到 HTTPS 地址，如 `https://moni-xxx.vercel.app`

### Netlify
1. `npm run build`
2. 拖 `dist/` 到 https://app.netlify.com/drop
3. 得到 HTTPS 地址

### GitHub Pages
1. `npm run build`
2. 把 `dist/` 推到 `gh-pages` 分支（或用 actions）
3. 仓库 Settings → Pages 选该分支
4. 注意子路径：若地址含子目录，`vite.config.js` 的 `base` 改为 `'/仓库名/'` 后重新构建

## 手机安装（加到主屏）

PWA 必须用 HTTPS 地址（上面托管地址自带）。

### iOS（Safari）
1. Safari 打开地址（必须 Safari，非微信/Chrome）
2. 底部「分享」→「添加到主屏幕」
3. 桌面出现 Moni 图标，点开全屏运行，不过期

### 安卓（Chrome）
1. Chrome 打开地址
2. 菜单 →「安装应用」/「添加到主屏幕」
3. 出现 Moni 图标

## 换机迁移
1. 旧机 → 我的 → 显示二维码（数据多会轮播多帧）
2. 新机 → 我的 → 扫码导入 → 持续对准旧机屏幕直到提示成功
3. 兜底：旧机导出备份文件，传给新机后导入

> 摄像头扫码需 HTTPS（托管地址满足）。本地调试用 localhost 也可。
```

- [ ] **Step 2: 跑全量测试 + 构建最终回归**

Run: `npm run test`
Expected: 全部 PASS

Run: `npm run build`
Expected: 构建成功

- [ ] **Step 3: Commit**

```bash
git add docs/DEPLOY.md
git commit -m "docs: add deploy and install guide"
```

---

## Self-Review 记录

**Spec 覆盖核对：**
| Spec 项 | 对应任务 |
|---|---|
| 单账本数据模型（4 表） | Task 3 |
| 记一笔 + 分类 | Task 10 |
| 统计报表（饼图/折线） | Task 12 |
| 预算提醒 | Task 6 + Task 13 |
| 二维码迁移（分片轮播） | Task 8 + Task 13 |
| JSON 文件兜底备份 | Task 7 + Task 13 |
| IndexedDB / Dexie | Task 3 |
| 金额分存储 | Task 2（全程使用） |
| PWA 离线 / 加主屏 | Task 14 |
| 免费静态托管 | Task 15 |
| 单元测试（CRUD/预算/往返/分片） | Task 2,4,5,6,7,8 |
| 手动验证（迁移/离线） | Task 9-13,15 |

**类型一致性：** `splitIntoFrames`/`reassembleFrames`、`exportToString`/`importFromString`、`setBudget`/`getBudget`/`budgetUsage`、`addTransaction`/`listByMonth`/`monthlySummary` 在定义任务与消费任务（Task 13）签名一致。meta 记录统一 `{key, value}` 结构。

无占位符；每个逻辑步骤含完整代码与命令。
```
