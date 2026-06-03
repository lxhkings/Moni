<template>
  <div class="app">
    <main class="content">
      <router-view />
    </main>
    <nav class="tabbar">
      <router-link to="/detail" class="tab">📋<span>明细</span></router-link>
      <router-link to="/add" class="tab tab-add">➕<span>记一笔</span></router-link>
      <router-link to="/report" class="tab">📊<span>报表</span></router-link>
      <router-link to="/settings" class="tab">👤<span>我的</span></router-link>
    </nav>
  </div>
</template>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f7; color: #1c1c1e; }
.app { display: flex; flex-direction: column; height: 100vh; }
.content { flex: 1; overflow-y: auto; padding: 16px; padding-bottom: 80px; }
.page h2 { margin-bottom: 16px; }
.tabbar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; background: #fff; border-top: 1px solid #e0e0e0;
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  padding: 8px 0; font-size: 20px; text-decoration: none; color: #8e8e93;
}
.tab span { font-size: 11px; margin-top: 2px; }
.tab.router-link-active { color: #007aff; }
</style>