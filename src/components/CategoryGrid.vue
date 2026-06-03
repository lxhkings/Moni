<script setup>
import { ref, onMounted } from 'vue'
import { listCategories } from '../db/categories.js'

const props = defineProps({ type: { type: String, default: 'expense' } })
const emit = defineEmits(['select'])
const cats = ref([])
const selectedId = ref(null)

const palette = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#14b8a6']
function tint(i) { return palette[i % palette.length] }

onMounted(async () => {
  cats.value = await listCategories(props.type)
})

function pick(c) {
  selectedId.value = c.id
  emit('select', c)
}
</script>

<template>
  <div class="grid">
    <button
      v-for="(c, i) in cats" :key="c.id"
      class="cat" :class="{ active: c.id === selectedId }"
      @click="pick(c)"
    >
      <span class="bubble" :style="{ '--c': tint(i) }">{{ c.icon }}</span>
      <span class="name">{{ c.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px 8px;
}
.cat {
  display: flex; flex-direction: column; align-items: center; gap: 7px;
  border: none; background: transparent; padding: 2px; cursor: pointer;
}
.bubble {
  display: grid; place-items: center;
  width: 52px; height: 52px;
  font-size: 26px; line-height: 1;
  border-radius: 16px;
  background: color-mix(in srgb, var(--c) 14%, var(--surface));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--c) 18%, transparent);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.cat .name { font-size: 12px; font-weight: 500; color: var(--text-2); transition: color 0.18s; }
.cat.active .bubble {
  transform: translateY(-2px) scale(1.04);
  box-shadow: 0 0 0 2px var(--c), 0 8px 18px color-mix(in srgb, var(--c) 35%, transparent);
}
.cat.active .name { color: var(--c); font-weight: 600; }
</style>
