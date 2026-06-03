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