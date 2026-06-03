<script setup>
import { ref, onMounted } from 'vue'
import { listCategories } from '../db/categories.js'

const props = defineProps({ type: { type: String, default: 'expense' } })
const emit = defineEmits(['select'])
const cats = ref([])
const selectedId = ref(null)

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
      v-for="c in cats" :key="c.id"
      class="cat" :class="{ active: c.id === selectedId }"
      @click="pick(c)"
    >
      <span class="icon">{{ c.icon }}</span>
      <span class="name">{{ c.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.cat {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: none; background: transparent; padding: 8px; border-radius: 12px; cursor: pointer;
}
.cat .icon { font-size: 28px; }
.cat .name { font-size: 12px; color: #555; }
.cat.active { background: #e5f0ff; }
.cat.active .name { color: #007aff; }
</style>