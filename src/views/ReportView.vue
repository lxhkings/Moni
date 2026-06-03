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