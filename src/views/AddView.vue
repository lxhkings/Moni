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