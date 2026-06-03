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