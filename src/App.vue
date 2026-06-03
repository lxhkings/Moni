<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const isAdd = computed(() => route.path === '/add')
</script>

<template>
  <div class="app">
    <main class="content" :class="{ 'no-tabbar': isAdd }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav v-if="!isAdd" class="tabbar">
      <router-link to="/detail" class="tab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="16" rx="3" /><path d="M7 9h10M7 13h10M7 17h6" />
        </svg>
        <span>明细</span>
      </router-link>

      <router-link to="/report" class="tab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 20V10M12 20V4M19 20v-7" />
        </svg>
        <span>报表</span>
      </router-link>

      <router-link to="/add" class="tab tab-fab" aria-label="记一笔">
        <span class="fab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </router-link>

      <router-link to="/settings" class="tab">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
        <span>我的</span>
      </router-link>
    </nav>
  </div>
</template>

<style>
:root {
  --bg: #f5f6fb;
  --surface: #ffffff;
  --surface-2: #f0f2f8;
  --text: #0e1525;
  --text-2: #5b6478;
  --text-3: #97a1b6;
  --border: rgba(14, 21, 37, 0.07);
  --accent: #6366f1;
  --accent-2: #8b5cf6;
  --accent-grad: linear-gradient(135deg, #6366f1, #8b5cf6);
  --accent-soft: rgba(99, 102, 241, 0.1);
  --income: #10b981;
  --expense: #f43f5e;
  --r-sm: 12px;
  --r: 18px;
  --r-lg: 26px;
  --sh-sm: 0 1px 2px rgba(14, 21, 37, 0.06);
  --sh: 0 6px 22px rgba(14, 21, 37, 0.08);
  --sh-fab: 0 10px 26px rgba(99, 102, 241, 0.45);
  --tabbar-bg: rgba(255, 255, 255, 0.82);
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b0e16;
    --surface: #161b27;
    --surface-2: #1f2533;
    --text: #eaeef6;
    --text-2: #9aa5bc;
    --text-3: #6b7488;
    --border: rgba(255, 255, 255, 0.08);
    --accent-soft: rgba(99, 102, 241, 0.18);
    --sh-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
    --sh: 0 6px 22px rgba(0, 0, 0, 0.45);
    --tabbar-bg: rgba(22, 27, 39, 0.82);
  }
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}
button { font-family: inherit; }

.app { display: flex; flex-direction: column; height: 100vh; }
.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px 110px;
  -webkit-overflow-scrolling: touch;
}
.content.no-tabbar { padding-bottom: 20px; }

.page h2 { font-size: 22px; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.02em; }

/* —— 底栏 —— */
.tabbar {
  position: fixed;
  left: 16px; right: 16px; bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  height: 64px;
  background: var(--tabbar-bg);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: var(--sh);
}
.tab {
  flex: 1;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px;
  text-decoration: none;
  color: var(--text-3);
  transition: color 0.2s;
}
.tab svg { width: 24px; height: 24px; }
.tab span { font-size: 10.5px; font-weight: 600; letter-spacing: 0.01em; }
.tab.router-link-active { color: var(--accent); }

.tab-fab { flex: 0 0 64px; }
.fab {
  display: grid; place-items: center;
  width: 56px; height: 56px;
  margin-top: -28px;
  border-radius: 20px;
  background: var(--accent-grad);
  color: #fff;
  box-shadow: var(--sh-fab);
  transition: transform 0.15s ease;
}
.fab svg { width: 26px; height: 26px; }
.tab-fab:active .fab { transform: scale(0.92); }

/* —— 路由切换动画 —— */
.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* —— 通用卡片 —— */
.card {
  background: var(--surface);
  border-radius: var(--r);
  box-shadow: var(--sh-sm);
  border: 1px solid var(--border);
}
</style>
