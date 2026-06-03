<script setup>
import { ref, onMounted } from 'vue'
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
    <div class="topbar">
      <h2>明细</h2>
      <div class="month-pill">
        <button @click="changeMonth(-1)" aria-label="上月">‹</button>
        <span>{{ month }}</span>
        <button @click="changeMonth(1)" aria-label="下月">›</button>
      </div>
    </div>

    <div class="hero">
      <div class="hero-bg"></div>
      <span class="hero-label">本月结余</span>
      <div class="hero-balance">
        <span class="cur">¥</span>{{ centsToYuan(summary.balance) }}
      </div>
      <div class="hero-split">
        <div>
          <span class="dot income"></span>
          <small>收入</small>
          <b>{{ centsToYuan(summary.income) }}</b>
        </div>
        <div>
          <span class="dot expense"></span>
          <small>支出</small>
          <b>{{ centsToYuan(summary.expense) }}</b>
        </div>
      </div>
    </div>

    <TransactionList :transactions="txs" :category-map="categoryMap" @delete="onDelete" />
  </div>
</template>

<style scoped>
.topbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.topbar h2 { margin: 0; }

.month-pill {
  display: flex; align-items: center; gap: 4px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 999px; padding: 4px; box-shadow: var(--sh-sm);
}
.month-pill button {
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: transparent; color: var(--text-2); font-size: 18px; cursor: pointer;
}
.month-pill button:active { background: var(--surface-2); }
.month-pill span { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; padding: 0 4px; }

.hero {
  position: relative; overflow: hidden;
  border-radius: var(--r-lg);
  padding: 22px;
  margin-bottom: 22px;
  color: #fff;
  box-shadow: 0 14px 34px rgba(99, 102, 241, 0.35);
}
.hero-bg {
  position: absolute; inset: 0; z-index: 0;
  background: var(--accent-grad);
}
.hero-bg::after {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle at 85% 15%, rgba(255, 255, 255, 0.25), transparent 45%),
    radial-gradient(circle at 10% 90%, rgba(255, 255, 255, 0.12), transparent 40%);
}
.hero > :not(.hero-bg) { position: relative; z-index: 1; }
.hero-label { font-size: 13px; font-weight: 500; opacity: 0.85; }
.hero-balance {
  font-size: 38px; font-weight: 700; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums; margin: 4px 0 18px;
}
.hero-balance .cur { font-size: 22px; font-weight: 600; opacity: 0.8; margin-right: 4px; }
.hero-split {
  display: flex; gap: 12px;
}
.hero-split > div {
  flex: 1;
  display: flex; flex-direction: column;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--r-sm); padding: 12px 14px;
  backdrop-filter: blur(4px);
}
.hero-split small { font-size: 11px; opacity: 0.85; margin: 2px 0; }
.hero-split b { font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; }
.dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.dot.income { background: #6ee7b7; }
.dot.expense { background: #fda4af; }
</style>
