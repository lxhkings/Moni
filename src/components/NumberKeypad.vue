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
    <div class="pad">
      <button v-for="k in keys" :key="k" class="key" :class="{ fn: k === 'del' }" @click="press(k)">
        <svg v-if="k === 'del'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 6h11v12H9l-5-6 5-6z" /><path d="M14 10l4 4M18 10l-4 4" />
        </svg>
        <template v-else>{{ k }}</template>
      </button>
    </div>
    <button class="done" @click="emit('done')">保存</button>
  </div>
</template>

<style scoped>
.keypad { margin-top: auto; padding-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.pad { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.key {
  display: grid; place-items: center;
  padding: 16px 0;
  border: none; border-radius: 14px;
  background: var(--surface);
  box-shadow: var(--sh-sm);
  font-size: 24px; font-weight: 600; color: var(--text);
  cursor: pointer;
  transition: transform 0.08s ease, background 0.15s;
}
.key:active { transform: scale(0.95); background: var(--surface-2); }
.key.fn { color: var(--text-2); }
.key svg { width: 26px; height: 26px; }
.done {
  padding: 17px 0;
  border: none; border-radius: 16px;
  background: var(--accent-grad); color: #fff;
  font-size: 17px; font-weight: 700; letter-spacing: 0.02em;
  box-shadow: 0 8px 22px rgba(99, 102, 241, 0.4);
  cursor: pointer;
  transition: transform 0.1s ease;
}
.done:active { transform: scale(0.98); }
</style>
