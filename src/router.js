import { createRouter, createWebHashHistory } from 'vue-router'
import DetailView from './views/DetailView.vue'
import AddView from './views/AddView.vue'
import ReportView from './views/ReportView.vue'
import SettingsView from './views/SettingsView.vue'

export const router = createRouter({
  history: createWebHashHistory(), // hash 模式，静态托管无需服务端路由配置
  routes: [
    { path: '/', redirect: '/detail' },
    { path: '/detail', component: DetailView },
    { path: '/add', component: AddView },
    { path: '/report', component: ReportView },
    { path: '/settings', component: SettingsView },
  ],
})