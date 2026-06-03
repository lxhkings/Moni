<script setup>
import { ref, onMounted } from 'vue'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { db } from '../db/schema.js'
import { setBudget, getBudget, budgetUsage } from '../db/budgets.js'
import { exportToString, importFromString } from '../db/migration.js'
import { splitIntoFrames, reassembleFrames } from '../db/qr.js'
import { yuanToCents, centsToYuan } from '../money.js'

const month = ref(new Date().toISOString().slice(0, 7))
const budgetYuan = ref('')
const usage = ref(null)

async function loadBudget() {
  const b = await getBudget(month.value, null)
  budgetYuan.value = b ? centsToYuan(b.amount) : ''
  usage.value = await budgetUsage(month.value, null)
}
onMounted(loadBudget)

async function saveBudget() {
  if (!budgetYuan.value) return
  await setBudget(month.value, null, yuanToCents(budgetYuan.value))
  await loadBudget()
  alert('预算已保存')
}

// ---- 文件导出/导入（兜底备份）----
async function exportFile() {
  const payload = await exportToString()
  const blob = new Blob([payload], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `moni-backup-${Date.now()}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
async function importFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const text = await file.text()
  if (!confirm('覆盖导入将清空当前数据，继续？')) return
  try {
    await importFromString(text, 'overwrite')
    alert('导入成功，请重启应用')
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}

// ---- 二维码导出 ----
const qrFrames = ref([])
const qrIndex = ref(0)
const qrImg = ref('')
let qrTimer = null
const CHUNK = 800 // 单帧 payload 字符上限，留余量保证可扫

async function startQrExport() {
  const payload = await exportToString()
  qrFrames.value = splitIntoFrames(payload, CHUNK)
  qrIndex.value = 0
  await renderFrame()
  if (qrTimer) clearInterval(qrTimer)
  if (qrFrames.value.length > 1) {
    qrTimer = setInterval(() => {
      qrIndex.value = (qrIndex.value + 1) % qrFrames.value.length
      renderFrame()
    }, 1500) // 每 1.5s 轮播下一帧
  }
}
async function renderFrame() {
  qrImg.value = await QRCode.toDataURL(qrFrames.value[qrIndex.value], { width: 280 })
}
function stopQrExport() {
  if (qrTimer) clearInterval(qrTimer)
  qrFrames.value = []
  qrImg.value = ''
}

// ---- 扫码导入 ----
const scanning = ref(false)
const collected = ref([]) // 已扫帧文本
const scanStatus = ref('')
const videoEl = ref(null)
let stream = null
let rafId = null

async function startScan() {
  scanning.value = true
  collected.value = []
  scanStatus.value = '对准旧手机二维码…'
  stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  videoEl.value.srcObject = stream
  await videoEl.value.play()
  tick()
}
function tick() {
  const video = videoEl.value
  if (!scanning.value || !video) return
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(img.data, img.width, img.height)
    if (code && code.data.startsWith('MONI/')) {
      if (!collected.value.includes(code.data)) collected.value.push(code.data)
      const payload = reassembleFrames(collected.value)
      scanStatus.value = `已扫 ${collected.value.length} 帧…`
      if (payload) {
        finishScan(payload)
        return
      }
    }
  }
  rafId = requestAnimationFrame(tick)
}
async function finishScan(payload) {
  stopScan()
  if (!confirm('覆盖导入将清空本机数据，继续？')) return
  try {
    await importFromString(payload, 'overwrite')
    alert('迁移成功，请重启应用')
  } catch (err) {
    alert('导入失败：' + err.message)
  }
}
function stopScan() {
  scanning.value = false
  if (rafId) cancelAnimationFrame(rafId)
  if (stream) stream.getTracks().forEach((t) => t.stop())
}

// ---- 货币符号 ----
const currency = ref('¥')
onMounted(async () => {
  const m = await db.meta.get('currencySymbol')
  if (m) currency.value = m.value
})
async function saveCurrency() {
  await db.meta.put({ key: 'currencySymbol', value: currency.value })
  alert('已保存')
}
</script>

<template>
  <div class="page settings">
    <h2>我的</h2>

    <section class="card">
      <h3>本月预算 <span class="sub">{{ month }}</span></h3>
      <div class="row">
        <input v-model="budgetYuan" type="number" placeholder="预算金额 (元)" />
        <button class="primary" @click="saveBudget">保存</button>
      </div>
      <div v-if="usage && usage.budget != null" class="budget">
        <div class="bar">
          <span
            class="fill" :class="{ over: usage.overBudget }"
            :style="{ width: Math.min(100, (usage.spent / usage.budget) * 100) + '%' }"
          ></span>
        </div>
        <p :class="{ over: usage.overBudget }">
          已花 {{ centsToYuan(usage.spent) }} / {{ centsToYuan(usage.budget) }}
          <span v-if="usage.overBudget">· ⚠️ 已超支</span>
          <span v-else>· 剩 {{ centsToYuan(usage.remaining) }}</span>
        </p>
      </div>
    </section>

    <section class="card">
      <h3>货币符号</h3>
      <div class="row">
        <input v-model="currency" maxlength="3" />
        <button class="primary" @click="saveCurrency">保存</button>
      </div>
    </section>

    <section class="card">
      <h3>换机迁移 <span class="sub">二维码</span></h3>
      <p class="hint">旧机点「显示二维码」，新机点「扫码导入」，多帧请持续对准轮播。</p>
      <div class="row">
        <button class="ghost" @click="startQrExport">显示二维码</button>
        <button class="ghost" @click="startScan">扫码导入</button>
      </div>
      <div v-if="qrImg" class="qr-box">
        <img :src="qrImg" />
        <p>第 {{ qrIndex + 1 }} / {{ qrFrames.length }} 帧</p>
        <button class="ghost" @click="stopQrExport">关闭</button>
      </div>
      <div v-if="scanning" class="scan-box">
        <video ref="videoEl" playsinline></video>
        <p>{{ scanStatus }}</p>
        <button class="ghost" @click="stopScan">取消</button>
      </div>
    </section>

    <section class="card">
      <h3>文件备份 <span class="sub">兜底</span></h3>
      <div class="row">
        <button class="ghost" @click="exportFile">导出备份文件</button>
        <label class="ghost file-btn">
          导入备份文件
          <input type="file" accept=".txt" @change="importFile" hidden />
        </label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.settings h2 { margin-bottom: 16px; }
section { padding: 18px; margin-bottom: 14px; }
section h3 {
  font-size: 15px; font-weight: 700; margin-bottom: 12px;
  display: flex; align-items: baseline; gap: 8px;
}
section h3 .sub { font-size: 12px; font-weight: 500; color: var(--text-3); }
.row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.row input {
  flex: 1; min-width: 120px; padding: 11px 14px;
  border: 1px solid var(--border); border-radius: var(--r-sm);
  background: var(--surface-2); color: var(--text); font-size: 14px; outline: none;
}
.row input:focus { box-shadow: 0 0 0 2px var(--accent-soft); }
button, .file-btn {
  padding: 11px 18px; border: none; border-radius: var(--r-sm);
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.primary {
  background: var(--accent-grad); color: #fff;
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}
.ghost {
  flex: 1; background: var(--accent-soft); color: var(--accent);
}
.primary:active, .ghost:active { transform: scale(0.97); }
.hint { color: var(--text-3); font-size: 12.5px; line-height: 1.5; margin-bottom: 12px; }

.budget { margin-top: 14px; }
.bar { height: 8px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
.fill {
  display: block; height: 100%; border-radius: 999px;
  background: var(--accent-grad); transition: width 0.4s ease;
}
.fill.over { background: linear-gradient(135deg, #f43f5e, #fb7185); }
.budget p { font-size: 13px; color: var(--text-2); margin-top: 8px; font-variant-numeric: tabular-nums; }
.budget p.over { color: var(--expense); font-weight: 600; }

.qr-box, .scan-box { text-align: center; margin-top: 16px; }
.qr-box img { width: 240px; height: 240px; border-radius: var(--r-sm); }
.qr-box p, .scan-box p { font-size: 13px; color: var(--text-2); margin: 10px 0; }
.qr-box .ghost, .scan-box .ghost { flex: none; padding: 9px 20px; }
.scan-box video { width: 100%; max-width: 300px; border-radius: var(--r); }
</style>