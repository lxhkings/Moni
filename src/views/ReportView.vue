<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { listByMonth } from '../db/transactions.js'
import { listCategories } from '../db/categories.js'
import { centsToYuan } from '../money.js'

const month = ref(new Date().toISOString().slice(0, 7))
const pieEl = ref(null)
const lineEl = ref(null)
const totalExpense = ref(0)
let pieChart = null
let lineChart = null

const PALETTE = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6']
function isDark() { return window.matchMedia('(prefers-color-scheme: dark)').matches }
function theme() {
  const dark = isDark()
  return {
    text: dark ? '#9aa5bc' : '#5b6478',
    axis: dark ? 'rgba(255,255,255,0.08)' : 'rgba(14,21,37,0.08)',
    tip: dark ? '#1f2533' : '#ffffff',
  }
}

async function load() {
  const txs = await listByMonth(month.value)
  const cats = await listCategories()
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]))
  const t = theme()

  // 饼图：按分类汇总支出（元）
  const byCat = {}
  let total = 0
  for (const tx of txs) {
    if (tx.type !== 'expense') continue
    const name = catMap[tx.categoryId] || '未知'
    byCat[name] = (byCat[name] || 0) + tx.amount
    total += tx.amount
  }
  totalExpense.value = total
  const pieData = Object.entries(byCat)
    .map(([name, cents]) => ({ name, value: cents / 100 }))
    .sort((a, b) => b.value - a.value)
  pieChart.setOption({
    color: PALETTE,
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)', backgroundColor: t.tip, borderWidth: 0, textStyle: { color: t.text } },
    legend: { bottom: 0, textStyle: { color: t.text }, itemWidth: 10, itemHeight: 10, icon: 'circle' },
    series: [{
      type: 'pie', radius: ['52%', '72%'], center: ['50%', '44%'],
      avoidLabelOverlap: true, itemStyle: { borderColor: t.tip, borderWidth: 3 },
      label: { show: false }, labelLine: { show: false }, data: pieData,
    }],
  }, true)

  // 折线：当月每日支出（元）
  const days = {}
  for (const tx of txs) {
    if (tx.type !== 'expense') continue
    const d = tx.date.slice(8) // DD
    days[d] = (days[d] || 0) + tx.amount
  }
  const xs = Object.keys(days).sort()
  lineChart.setOption({
    grid: { left: 8, right: 16, top: 16, bottom: 4, containLabel: true },
    tooltip: { trigger: 'axis', backgroundColor: t.tip, borderWidth: 0, textStyle: { color: t.text } },
    xAxis: {
      type: 'category', data: xs, boundaryGap: false,
      axisLine: { lineStyle: { color: t.axis } }, axisTick: { show: false },
      axisLabel: { color: t.text, fontSize: 11 },
    },
    yAxis: {
      type: 'value', splitLine: { lineStyle: { color: t.axis } },
      axisLabel: { color: t.text, fontSize: 11 },
    },
    series: [{
      type: 'line', data: xs.map((d) => days[d] / 100), smooth: true,
      symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 3, color: '#6366f1' },
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(99,102,241,0.28)' },
          { offset: 1, color: 'rgba(99,102,241,0)' },
        ]),
      },
    }],
  }, true)
}

let mql
function onScheme() { load() }
onMounted(() => {
  pieChart = echarts.init(pieEl.value)
  lineChart = echarts.init(lineEl.value)
  load()
  mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', onScheme)
})
onBeforeUnmount(() => {
  pieChart?.dispose(); lineChart?.dispose()
  mql?.removeEventListener('change', onScheme)
})
watch(month, load)

function changeMonth(delta) {
  const d = new Date(month.value + '-01')
  d.setMonth(d.getMonth() + delta)
  month.value = d.toISOString().slice(0, 7)
}
</script>

<template>
  <div class="page">
    <div class="topbar">
      <h2>报表</h2>
      <div class="month-pill">
        <button @click="changeMonth(-1)" aria-label="上月">‹</button>
        <span>{{ month }}</span>
        <button @click="changeMonth(1)" aria-label="下月">›</button>
      </div>
    </div>

    <section class="card chart-card">
      <header class="chart-head">
        <span class="title">支出分类</span>
        <span class="total">¥{{ centsToYuan(totalExpense) }}</span>
      </header>
      <div ref="pieEl" class="chart"></div>
    </section>

    <section class="card chart-card">
      <header class="chart-head">
        <span class="title">每日支出趋势</span>
      </header>
      <div ref="lineEl" class="chart line"></div>
    </section>
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

.chart-card { padding: 16px; margin-bottom: 16px; }
.chart-head {
  display: flex; align-items: baseline; justify-content: space-between;
  margin-bottom: 4px;
}
.chart-head .title { font-size: 15px; font-weight: 700; }
.chart-head .total {
  font-size: 15px; font-weight: 700; color: var(--expense);
  font-variant-numeric: tabular-nums;
}
.chart { width: 100%; height: 300px; }
.chart.line { height: 240px; }
</style>
