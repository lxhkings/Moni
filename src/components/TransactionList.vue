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