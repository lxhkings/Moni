<script setup>
import { computed } from 'vue'
import { centsToYuan } from '../money.js'

const props = defineProps({
  transactions: { type: Array, required: true },
  categoryMap: { type: Object, required: true }, // { [id]: {name, icon} }
})
const emit = defineEmits(['delete'])

const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6']
function tint(id) { return palette[(id || 0) % palette.length] }

const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
function dayLabel(date) {
  const d = new Date(date + 'T00:00:00')
  const today = new Date().toISOString().slice(0, 10)
  if (date === today) return '今天'
  return `${date.slice(5)} ${weekdays[d.getDay()]}`
}

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
      <div class="day-head">{{ dayLabel(g.date) }}</div>
      <div class="day-card">
        <div
          v-for="t in g.items" :key="t.id" class="row"
          @click="emit('delete', t)"
        >
          <span class="icon" :style="{ '--c': tint(t.categoryId) }">
            {{ (categoryMap[t.categoryId] || {}).icon || '❓' }}
          </span>
          <div class="info">
            <span class="name">{{ (categoryMap[t.categoryId] || {}).name || '未知' }}</span>
            <span v-if="t.note" class="note">{{ t.note }}</span>
          </div>
          <span class="amt" :class="t.type">
            {{ t.type === 'expense' ? '-' : '+' }}{{ centsToYuan(t.amount) }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="groups.length === 0" class="empty">
      <div class="empty-ico">🧾</div>
      <p>本月还没有记账</p>
      <span>点下方 + 记第一笔</span>
    </div>
  </div>
</template>

<style scoped>
.day-group { margin-bottom: 18px; }
.day-head {
  font-size: 12px; font-weight: 600; color: var(--text-3);
  margin: 0 4px 8px; letter-spacing: 0.02em;
}
.day-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  box-shadow: var(--sh-sm);
  overflow: hidden;
}
.row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 14px;
  cursor: pointer;
  transition: background 0.15s;
}
.row:active { background: var(--surface-2); }
.row + .row { border-top: 1px solid var(--border); }
.row .icon {
  display: grid; place-items: center;
  width: 40px; height: 40px; flex-shrink: 0;
  font-size: 20px; border-radius: 12px;
  background: color-mix(in srgb, var(--c) 14%, var(--surface));
}
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.info .name { font-size: 15px; font-weight: 600; }
.info .note {
  font-size: 12px; color: var(--text-3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.amt { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
.amt.expense { color: var(--text); }
.amt.income { color: var(--income); }

.empty { text-align: center; padding: 56px 0; color: var(--text-3); }
.empty-ico { font-size: 44px; margin-bottom: 12px; }
.empty p { font-size: 15px; font-weight: 600; color: var(--text-2); }
.empty span { font-size: 13px; }
</style>
