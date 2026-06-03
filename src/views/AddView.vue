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

function setType(t) { type.value = t; category.value = null }
function onInput(k) {
  if (k === '.' && amountStr.value.includes('.')) return
  if (amountStr.value.includes('.') && amountStr.value.split('.')[1].length >= 2) return
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
  <div class="add" :class="type">
    <header class="add-head">
      <button class="close" @click="router.back()" aria-label="关闭">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      <div class="seg">
        <button :class="{ on: type === 'expense' }" @click="setType('expense')">支出</button>
        <button :class="{ on: type === 'income' }" @click="setType('income')">收入</button>
        <span class="seg-thumb" :style="{ transform: type === 'income' ? 'translateX(100%)' : 'none' }"></span>
      </div>
      <span class="spacer" />
    </header>

    <div class="amount-box">
      <span class="amount-label">{{ type === 'expense' ? '支出金额' : '收入金额' }}</span>
      <div class="amount">
        <span class="sign">¥</span><span class="num">{{ amountStr }}</span>
      </div>
    </div>

    <CategoryGrid :type="type" :key="type" @select="category = $event" />

    <div class="meta">
      <label class="meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
          <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 9h18M8 3v4M16 3v4" />
        </svg>
        <input v-model="date" type="date" />
      </label>
      <label class="meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
        <input v-model="note" placeholder="加个备注…" />
      </label>
    </div>

    <NumberKeypad @input="onInput" @delete="onDelete" @done="onDone" />
  </div>
</template>

<style scoped>
.add { display: flex; flex-direction: column; min-height: calc(100vh - 40px); }

.add-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 18px;
}
.close, .spacer { width: 40px; height: 40px; }
.close {
  display: grid; place-items: center;
  border: none; border-radius: 50%;
  background: var(--surface); color: var(--text-2);
  box-shadow: var(--sh-sm); cursor: pointer;
}
.close svg { width: 20px; height: 20px; }

.seg {
  position: relative;
  display: flex;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 4px;
}
.seg button {
  position: relative; z-index: 1;
  width: 72px; padding: 7px 0;
  border: none; background: transparent; cursor: pointer;
  font-size: 14px; font-weight: 600; color: var(--text-2);
  transition: color 0.2s;
}
.seg button.on { color: #fff; }
.seg-thumb {
  position: absolute; z-index: 0; top: 4px; left: 4px;
  width: 72px; height: calc(100% - 8px);
  border-radius: 999px;
  background: var(--accent-grad);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.add.income .seg-thumb { background: linear-gradient(135deg, #10b981, #34d399); }

.amount-box { text-align: center; margin: 8px 0 22px; }
.amount-label { font-size: 12px; font-weight: 600; color: var(--text-3); letter-spacing: 0.04em; }
.amount {
  display: flex; align-items: baseline; justify-content: center; gap: 4px;
  margin-top: 6px;
  font-variant-numeric: tabular-nums;
}
.amount .sign { font-size: 26px; font-weight: 600; color: var(--text-2); }
.amount .num {
  font-size: 52px; font-weight: 700; letter-spacing: -0.02em;
  background: var(--accent-grad);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.add.income .amount .num { background: linear-gradient(135deg, #10b981, #34d399); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }

.meta { display: flex; gap: 10px; margin: 20px 0; }
.meta-item {
  flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--r-sm); box-shadow: var(--sh-sm);
}
.meta-item svg { width: 18px; height: 18px; color: var(--text-3); flex-shrink: 0; }
.meta-item input {
  flex: 1; min-width: 0; border: none; background: transparent;
  font-size: 14px; color: var(--text); outline: none;
}
.meta-item input::placeholder { color: var(--text-3); }
</style>
