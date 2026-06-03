import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'
import { seedDefaults } from './db/schema.js'

seedDefaults().then(() => {
  createApp(App).use(router).mount('#app')
})