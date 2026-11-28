<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from '../components/Icon.vue'
import AddAlertModal from '../components/AddAlertModal.vue'
import { api } from '../services/api'

// Foto diagnosis disajikan backend dari /uploads (di luar prefix /api/v1)
const API_ORIGIN = new URL(import.meta.env.VITE_API_BASE_URL || '/', window.location.href).origin

const props = defineProps({
  mode: { type: String, default: 'Otomatis' },
})
const emit = defineEmits(['navigate'])

const isManual = computed(() => props.mode === 'Manual')

// ==============================
// DATE & TIME HELPERS
// ==============================
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]
const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDateIndo(dateInput) {
  if (!dateInput) return '-'
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return String(dateInput)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function formatTimeWib(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date()
  return `${pad(d.getHours())}:${pad(d.getMinutes())} WIB`
}

const currentDate = new Date()
const headerButtonDate = computed(() => {
  return `${currentDate.getDate()} ${SHORT_MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
})

// ==============================
// STATE MANAGEMENT
// ==============================
const loading = ref(false)
const errorMessage = ref('')
const devicesList = ref([])
const activeDevice = ref(null)
const overviewData = ref(null)
const lastUpdatedAt = ref(new Date())

// Pompa air
const pumpOn = ref(true)
const pumpActuator = ref(null)
const isTogglingPump = ref(false)

// Sensor calibration & sliders (mode manual)
const controls = ref([
  { name: 'Sensor pH', value: 5, min: 0, max: 10, step: 0.1, decimals: 1, unit: 'pH' },
  { name: 'Sensor EC/TDS', value: 1.42, min: 0, max: 2.84, step: 0.01, decimals: 2, unit: 'mS/cm' },
  { name: 'Sensor Suhu', value: 30, min: 0, max: 60, step: 1, decimals: 0, unit: '°C' },
])

function pct(c) {
  return `${((c.value - c.min) / (c.max - c.min)) * 100}%`
}

const sensors = ref([])
const greenhouse = ref(null)

// Alerts
const alerts = ref([])
const alertRaw = ref([])
const showAlertModal = ref(false)
const levelMap = {
  info: { type: 'ok', badge: 'Info', icon: 'info' },
  warning: { type: 'warning', badge: 'Warning', icon: 'warn' },
  critical: { type: 'alert', badge: 'Alert', icon: 'info' },
}

// Log = gabungan diagnosis AI + notifikasi peringatan sensor (notifikasi AI tidak diulang, sudah ada di diagnosis)
const isExporting = ref(false)

// AI Diagnosis & Recommendations
const diagnosisRaw = ref([])
const latestDiagnosis = computed(() => diagnosisRaw.value[0] || null)
const recommendations = ref([])

const logs = computed(() => {
  const entries = [
    ...alertRaw.value
      .filter((a) => a.source !== 'ai')
      .map((a) => ({ text: a.title || a.message || 'Peringatan sensor', ts: a.created_at })),
    ...diagnosisRaw.value.map((d) => ({ text: `Diagnosis AI: ${d.label}`, ts: d.created_at || d.captured_at })),
  ]
  return entries
    .sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts))
    .slice(0, 5)
    .map((e) => ({ text: e.text, date: `${formatDateIndo(e.ts)}, ${formatTimeWib(e.ts)}` }))
})

// Realtime & Polling control
let refreshTimer = null
let slowTimer = null
let streamController = null
let overviewRequestId = 0

function unwrapResponse(response) {
  return response?.data ?? response
}

function getArrayResponse(response) {
  const data = unwrapResponse(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.devices)) return data.devices
  return []
}

// ==============================
// METRICS EXTRACTION
// ==============================
function unwrapMetricValue(value) {
  if (value === undefined || value === null || value === '') return null
  if (typeof value === 'object') {
    return value.value ?? value.val ?? value.reading ?? value.latest ?? null
  }
  return value
}

function findMetricValue(metrics, keys) {
  if (!metrics || typeof metrics !== 'object') return null

  for (const key of keys) {
    const val = unwrapMetricValue(metrics[key])
    if (val !== null) return val
  }

  const nested = [metrics.latest, metrics.values, metrics.data, metrics.telemetry]
  for (const n of nested) {
    if (!n || typeof n !== 'object') continue
    for (const key of keys) {
      const val = unwrapMetricValue(n[key])
      if (val !== null) return val
    }
  }

  return null
}

const currentMetrics = computed(() => {
  return overviewData.value?.metrics || overviewData.value?.telemetry || {}
})

const metrics = computed(() => {
  const m = currentMetrics.value

  // 1. pH
  const phRaw = findMetricValue(m, ['ph', 'pH', 'ph_value', 'sensor_ph'])
  const phNum = phRaw !== null ? Number(phRaw) : null
  const phVal = phNum !== null && !isNaN(phNum) ? phNum.toFixed(1) : '-'
  let phNote = 'Target 5.8–6.2 · Tidak ada data'
  if (phNum !== null && !isNaN(phNum)) {
    phNote = 'Target 5.8–6.2 · Stabil'
    if (phNum < 5.8) phNote = 'Target 5.8–6.2 · Terlalu Rendah'
    else if (phNum > 6.2) phNote = 'Target 5.8–6.2 · Terlalu Tinggi'
  }

  // 2. EC / TDS
  const ecRaw = findMetricValue(m, ['ec', 'ec_value', 'tds', 'tds_value', 'sensor_ec'])
  const ecNum = ecRaw !== null ? Number(ecRaw) : null
  const ecVal = ecNum !== null && !isNaN(ecNum) ? ecNum.toFixed(2) : '-'
  let ecNote = 'Target 1.3–1.5 · Tidak ada data'
  if (ecNum !== null && !isNaN(ecNum)) {
    ecNote = 'Target 1.3–1.5 · Konsisten'
    if (ecNum < 1.3) ecNote = 'Target 1.3–1.5 · Nutrisi Rendah'
    else if (ecNum > 1.5) ecNote = 'Target 1.3–1.5 · Nutrisi Tinggi'
  }

  // 3. Suhu Air
  const tempRaw = findMetricValue(m, ['water_temp', 'temp_water', 'suhu_air', 'temp', 'temperature'])
  const tempNum = tempRaw !== null ? Number(tempRaw) : null
  const tempVal = tempNum !== null && !isNaN(tempNum) ? tempNum.toFixed(1) : '-'
  let tempNote = 'Target 20–24 °C · Tidak ada data'
  if (tempNum !== null && !isNaN(tempNum)) {
    tempNote = 'Target 20–24 °C · Stabil'
    if (tempNum < 20) tempNote = 'Target 20–24 °C · Suhu Rendah'
    else if (tempNum > 24) tempNote = 'Target 20–24 °C · Suhu Hangat'
  }

  // 4. Level Tangki
  const tankRaw = findMetricValue(m, ['tank_level', 'level_tangki', 'water_level', 'tank'])
  const tankNum = tankRaw !== null ? Number(tankRaw) : null
  const tankVal = tankNum !== null && !isNaN(tankNum) ? Math.round(tankNum).toString() : '-'
  let tankNote = 'Target ≥ 75% · Tidak ada data'
  if (tankNum !== null && !isNaN(tankNum)) {
    tankNote = 'Target ≥ 75% · Aman'
    if (tankNum < 75) tankNote = 'Target ≥ 75% · Level Rendah'
  }

  return [
    { label: 'pH Larutan', value: phVal, unit: 'pH', icon: 'drop', note: phNote },
    { label: 'EC / TDS', value: ecVal, unit: 'mS/cm', icon: 'activity', note: ecNote },
    { label: 'Suhu Air', value: tempVal, unit: '°C', icon: 'thermo', note: tempNote },
    { label: 'Level Tangki', value: tankVal, unit: '%', icon: 'tank', note: tankNote },
  ]
})

// Header subtitle
const headerSubtitle = computed(() => {
  const dayName = DAYS[currentDate.getDay()]
  const dateStr = `${currentDate.getDate()} ${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  const timeStr = formatTimeWib(lastUpdatedAt.value)
  const plant = plantName.value
  return `${dayName}, ${dateStr} · Update terakhir: ${timeStr} · ${plant}`
})

const plantName = computed(() => {
  return (
    greenhouse.value?.plant_type ||
    activeDevice.value?.plant_type ||
    overviewData.value?.crop ||
    '-'
  )
})

// Umur tanam dihitung dari tanggal perangkat/greenhouse dibuat (backend belum punya tanggal tanam)
const plantDays = computed(() => {
  const start = greenhouse.value?.created_at || activeDevice.value?.created_at
  if (!start) return ''
  return `${Math.max(0, Math.floor((Date.now() - Date.parse(start)) / 86_400_000))} hari tanam`
})

// ==============================
// ACTUATORS & PUMP
// ==============================
function syncActuators(data) {
  const actuators = data?.actuators || activeDevice.value?.actuators || []
  const pump = actuators.find(
    (a) => a.type === 'pump' || a.name?.toLowerCase().includes('pompa'),
  )

  if (pump) {
    pumpActuator.value = pump
    const st = pump.state ?? pump.status
    if (st === 'on' || pump.is_active === true) pumpOn.value = true
    else if (st === 'off' || pump.is_active === false) pumpOn.value = false
  } else {
    const pVal = data?.pump ?? data?.water_pump
    if (pVal !== undefined && pVal !== null) {
      pumpOn.value = pVal === true || pVal === 'on'
    }
  }
}

async function togglePump() {
  if (!isManual.value || isTogglingPump.value) return

  const targetState = !pumpOn.value
  isTogglingPump.value = true

  try {
    if (pumpActuator.value?.id) {
      await api.controlActuator(pumpActuator.value.id, {
        state: targetState ? 'on' : 'off',
      })
    }
    pumpOn.value = targetState
  } catch (error) {
    console.error('Gagal mengubah status pompa:', error)
    alert(error.message || 'Gagal mengubah status pompa air.')
  } finally {
    isTogglingPump.value = false
  }
}

// ==============================
// DATA FETCHING: OVERVIEW & REALTIME
// ==============================
async function fetchOverview(deviceId) {
  if (!deviceId) return
  const requestId = ++overviewRequestId

  try {
    const res = await api.getDashboardOverview(deviceId)
    if (requestId !== overviewRequestId) return

    const data = unwrapResponse(res) || {}
    overviewData.value = data
    lastUpdatedAt.value = new Date()
    syncActuators(data)
  } catch (error) {
    if (requestId !== overviewRequestId) return
    console.warn('Gagal memuat overview:', error)
  }
}

function updateFromStream(payload) {
  if (!payload || typeof payload !== 'object') return
  const data = payload.data ?? payload
  const incomingMetrics = data.metrics ?? data.telemetry ?? payload.metrics ?? null

  if (incomingMetrics && typeof incomingMetrics === 'object') {
    overviewData.value = {
      ...overviewData.value,
      ...data,
      metrics: incomingMetrics,
    }
  } else {
    overviewData.value = {
      ...overviewData.value,
      metrics: data,
    }
  }

  syncActuators(overviewData.value)
  lastUpdatedAt.value = new Date()
}

function processSseBlock(block) {
  const lines = block.split(/\r?\n/)
  const dataLines = []
  let eventName = 'message'

  for (const line of lines) {
    if (line.startsWith(':')) continue
    if (line.startsWith('event:')) eventName = line.slice(6).trim()
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim())
  }

  if (dataLines.length === 0) return
  const rawData = dataLines.join('\n')

  try {
    const payload = JSON.parse(rawData)
    if (eventName === 'metrics' || eventName === 'message') {
      updateFromStream(payload)
    }
  } catch (error) {
    console.warn('Format event SSE bukan JSON valid:', rawData, error)
  }
}

async function connectDashboardStream(deviceId) {
  stopRealtime()
  if (!deviceId) return

  streamController = new AbortController()
  const currentController = streamController

  try {
    const response = await api.getDashboardStream(deviceId, currentController.signal, 5)
    if (!response.ok || !response.body) throw new Error('SSE stream tidak tersedia')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done || currentController.signal.aborted) break
      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() || ''
      for (const block of blocks) {
        processSseBlock(block)
      }
    }
    // Stream ditutup server tanpa error: tetap ambil data lewat polling
    if (!currentController.signal.aborted) startPolling(deviceId)
  } catch {
    if (currentController.signal.aborted) return
    startPolling(deviceId)
  }
}

function startPolling(deviceId) {
  stopPolling()
  if (!deviceId) return

  fetchOverview(deviceId)
  refreshTimer = window.setInterval(() => {
    fetchOverview(deviceId)
  }, 5000)
}

function stopPolling() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function stopRealtime() {
  stopPolling()
  if (streamController) {
    streamController.abort()
    streamController = null
  }
}

// ==============================
// CALIBRATIONS, ALERTS & LOGS
// ==============================
async function loadCalibrations(deviceId) {
  try {
    const res = await api.getCalibrations(deviceId)
    const statusLabel = {
      ok: 'OK',
      due_soon: 'Segera Kalibrasi',
      overdue: 'Perlu Kalibrasi',
      never: 'Belum Dikalibrasi',
    }
    sensors.value = getArrayResponse(res).map((item) => ({
      name: item.sensor_name || `Sensor ${item.sensor_type || ''}`,
      date: item.last_calibrated_at
        ? `Kalibrasi terakhir: ${formatDateIndo(item.last_calibrated_at)}`
        : 'Belum pernah dikalibrasi',
      status: statusLabel[item.status] || 'OK',
    }))
  } catch (error) {
    console.warn('Gagal memuat kalibrasi:', error)
  }
}

async function loadGreenhouse() {
  try {
    const ghId = activeDevice.value?.greenhouse_id
    greenhouse.value = getArrayResponse(await api.getGreenhouses()).find((g) => g.id === ghId) || null
  } catch (error) {
    console.warn('Gagal memuat greenhouse:', error)
  }
}

async function loadAlerts() {
  try {
    const res = await api.getAlertNotifications({ limit: 5 })
    const items = getArrayResponse(res)
    alertRaw.value = items

    {
      alerts.value = items.map((item) => {
        const sev = (item.severity || item.level || 'warning').toLowerCase()
        let type = 'warning'
        let badge = 'Warning'
        let icon = 'warn'

        if (sev === 'critical' || sev === 'alert' || sev === 'danger') {
          type = 'alert'
          badge = 'Alert'
          icon = 'info'
        } else if (sev === 'info' || sev === 'ok' || sev === 'normal') {
          type = 'ok'
          badge = item.unread === false ? 'OK' : 'Info'
          icon = 'bell'
        }

        return {
          id: item.id,
          text: item.title || item.message || 'Peringatan sensor',
          badge: item.badge || badge,
          type,
          icon,
        }
      })
    }
  } catch (error) {
    console.warn('Gagal memuat notifikasi alerts:', error)
  }
}

async function handleAddAlert(data) {
  try {
    const metricMap = {
      temp: 'water_temp',
      ec: 'ec',
      ph: 'ph',
      level: 'tank_level',
    }
    const operatorMap = {
      lt: '<',
      gt: '>',
      eq: '>=',
    }

    const payload = {
      name: data.name,
      metric: metricMap[data.parameter] || data.parameter,
      operator: operatorMap[data.condition] || '<',
      threshold: Number(data.threshold),
      severity: data.level || 'warning',
      is_active: true,
    }

    const devId = activeDevice.value?.id || activeDevice.value?._id
    if (devId) payload.device_id = devId

    await api.createAlertRule(payload)
    await loadAlerts()
  } catch (error) {
    console.error('Gagal menambahkan aturan peringatan:', error)
    // Optimistic fallback
    const l = levelMap[data.level] || levelMap.warning
    alerts.value.unshift({ text: data.name, badge: l.badge, type: l.type, icon: l.icon })
  } finally {
    showAlertModal.value = false
  }
}

async function handleExportCsv() {
  if (isExporting.value) return
  isExporting.value = true

  try {
    const devId = activeDevice.value?.id || activeDevice.value?._id
    let blob
    if (devId) {
      blob = await api.exportTelemetryCsv(devId)
    } else {
      blob = await api.exportActivityLogs()
    }

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tanova-telemetry-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Gagal mengekspor CSV:', error)
    alert(error.message || 'Gagal mengekspor CSV telemetri.')
  } finally {
    isExporting.value = false
  }
}

// ==============================
// AI DIAGNOSES & RECOMMENDATIONS
// ==============================
async function loadAiData() {
  try {
    const ghId = activeDevice.value?.greenhouse_id
    const scopeQuery = ghId ? { greenhouse_id: ghId } : {}
    const [diagRes, recoRes] = await Promise.allSettled([
      api.getAiDiagnoses({ limit: 5, ...scopeQuery }),
      api.getAiRecommendations({ limit: 3, ...scopeQuery }),
    ])

    if (diagRes.status === 'fulfilled') {
      diagnosisRaw.value = getArrayResponse(diagRes.value)
    }

    if (recoRes.status === 'fulfilled') {
      // Pakai langkah tindakan bila ada, jika tidak teks rekomendasi utamanya
      recommendations.value = getArrayResponse(recoRes.value)
        .flatMap((r) => (r.recommended_actions?.length ? r.recommended_actions : [r.recommendation]))
        .map((a) => (typeof a === 'string' ? a : a?.text || a?.action))
        .filter(Boolean)
        .slice(0, 4)
    }
  } catch (error) {
    console.warn('Gagal memuat data AI:', error)
  }
}

const SEVERITY_LABEL = { none: 'Sehat', low: 'Ringan', medium: 'Sedang', high: 'Tinggi' }

const diagnosisTitle = computed(() => latestDiagnosis.value?.label || 'Belum ada diagnosis')
// confidence di backend 0–1
const diagnosisConfidence = computed(() => {
  const c = latestDiagnosis.value?.confidence
  return c === null || c === undefined ? 0 : Math.round(c * 1000) / 10
})
const diagnosisSeverity = computed(() => SEVERITY_LABEL[latestDiagnosis.value?.severity] || '-')
const diagnosisBadgeClass = computed(() => {
  return latestDiagnosis.value?.severity === 'none' ? 'pill--on' : 'pill--orange'
})
const diagnosisPhoto = computed(() => {
  const url = latestDiagnosis.value?.image_url
  if (!url) return null
  return /^https?:/.test(url) ? url : `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
})
const diagnosisSubtitle = computed(() => {
  const d = latestDiagnosis.value
  if (!d) return `Tanaman: ${plantName.value}`
  const t = d.captured_at || d.created_at
  const source = d.details?.source === 'camera' || d.device_id ? 'Kamera ESP' : 'Upload'
  return `Tanaman: ${d.details?.plant || plantName.value} · ${source} · ${formatDateIndo(t)}, ${formatTimeWib(t)}`
})

// ==============================
// INITIALIZATION
// ==============================
async function initDashboard() {
  loading.value = true
  errorMessage.value = ''

  try {
    const devRes = await api.getDevices()
    devicesList.value = getArrayResponse(devRes)

    if (devicesList.value.length > 0) {
      activeDevice.value = devicesList.value[0]
      const devId = activeDevice.value.id || activeDevice.value._id

      await Promise.allSettled([
        fetchOverview(devId),
        loadCalibrations(devId),
        loadGreenhouse(),
        loadAlerts(),
        loadAiData(),
      ])

      connectDashboardStream(devId)
    } else {
      // Tidak ada device, tetap muat notifikasi & diagnosis umum
      await Promise.allSettled([
        loadAlerts(),
        loadAiData(),
      ])
    }
  } catch (error) {
    console.error('Gagal inisialisasi dashboard:', error)
    errorMessage.value = error.message || 'Gagal memuat data dashboard.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.mode,
  async (newMode) => {
    const devId = activeDevice.value?.id || activeDevice.value?._id
    if (devId) {
      try {
        await api.setDeviceMode(devId, newMode === 'Manual' ? 'manual' : 'auto')
      } catch (err) {
        console.warn('Gagal menyinkronkan mode perangkat:', err)
      }
    }
  },
)

onMounted(async () => {
  await initDashboard()
  // Alert & diagnosis tidak ada di stream SSE, jadi disegarkan berkala
  slowTimer = window.setInterval(() => {
    loadAlerts()
    loadAiData()
  }, 30000)
})

onBeforeUnmount(() => {
  stopRealtime()
  clearInterval(slowTimer)
})
</script>

<template>
  <div class="page">
    <section class="head">
      <div>
        <h1>Dashboard Device</h1>
        <p>{{ headerSubtitle }}</p>
      </div>
      <div class="head__actions">
        <button type="button" class="btn btn--ghost" title="Segarkan data dashboard" @click="initDashboard">
          <Icon name="calendar" />
          {{ headerButtonDate }}
        </button>
        <button type="button" class="btn btn--solid" @click="showAlertModal = true">
          <Icon name="bell" />
          Tambah Peringatan
        </button>
      </div>
    </section>

    <!-- Kartu metrik -->
    <section class="metrics">
      <article v-for="m in metrics" :key="m.label" class="card metric">
        <div class="metric__top">
          <span>{{ m.label }}</span>
          <i class="chip">
            <Icon :name="m.icon" />
          </i>
        </div>
        <div class="metric__value">
          <b>{{ m.value }}</b><small>{{ m.unit }}</small>
        </div>
        <p>{{ m.note }}</p>
      </article>
    </section>

    <!-- Baris 2 -->
    <section class="row">
      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Kontrol Aktuator</h3>
            <p>{{ isManual ? 'Mode manual' : 'Mode otomatis aktif' }}</p>
          </div>
          <span class="pill pill--soft">{{ pumpOn ? '1 Aktif' : '0 Aktif' }}</span>
        </div>

        <div class="item item--lg">
          <span class="item__left">
            <Icon name="drop" />
            <b>Pompa Air</b>
          </span>
          <button v-if="isManual" type="button" class="pill pill-btn" :class="pumpOn ? 'pill--on' : 'pill--off'"
            :aria-pressed="pumpOn" :disabled="isTogglingPump" @click="togglePump">
            {{ isTogglingPump ? '...' : (pumpOn ? 'ON' : 'OFF') }}
          </button>
          <span v-else class="pill" :class="pumpOn ? 'pill--on' : 'pill--off'">
            {{ pumpOn ? 'ON' : 'OFF' }}
          </span>
        </div>

        <h4>Kalibrasi Sensor</h4>
        <template v-if="isManual">
          <div v-for="c in controls" :key="c.name" class="item item--slider">
            <Icon name="tank" />
            <label class="slider__wrap">
              <b>{{ c.name }}</b>
              <input v-model.number="c.value" class="slider" type="range" :min="c.min" :max="c.max" :step="c.step"
                :style="{ '--pct': pct(c) }" :aria-label="c.name" />
            </label>
            <span class="value-chip">{{ c.value.toFixed(c.decimals) }} {{ c.unit }}</span>
          </div>
        </template>

        <template v-else>
          <div v-for="s in sensors" :key="s.name" class="item">
            <span class="item__left">
              <Icon name="tank" />
              <span>
                <b>{{ s.name }}</b>
                <small>{{ s.date }}</small>
              </span>
            </span>
            <b class="ok">{{ s.status || 'OK' }}</b>
          </div>
        </template>
      </article>

      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Peringatan &amp; Notifikasi</h3>
            <p>{{ alerts.length }} peringatan terdaftar</p>
          </div>
          <span class="pill pill--soft">{{ alerts.length }} Notifikasi</span>
        </div>

        <div v-if="alerts.length === 0" class="alert alert--ok">
          <span class="item__left">
            <Icon name="bell" /><b>Tidak ada peringatan</b>
          </span>
        </div>
        <div v-for="(a, idx) in alerts" :key="a.id || idx" class="alert" :class="`alert--${a.type}`">
          <span class="item__left">
            <Icon :name="a.icon" />
            <b>{{ a.text }}</b>
          </span>
          <span class="badge">{{ a.badge }}</span>
        </div>

        <h4>Tanaman di Hidroponik</h4>
        <div class="plant">
          <Icon name="leaf" />
          <b>{{ plantName }}</b>
          <small>{{ plantDays }}</small>
        </div>
      </article>
    </section>

    <!-- Baris 3 -->
    <section class="row">
      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Log Diagnosis &amp; Peringatan</h3>
            <p>{{ logs.length }} entri terbaru</p>
          </div>
          <button type="button" class="btn btn--tiny" :disabled="isExporting" @click="handleExportCsv">
            <Icon name="download" />
            {{ isExporting ? 'Mengunduh...' : 'Ekspor CSV' }}
          </button>
        </div>

        <div v-if="logs.length === 0" class="item item--log">
          <span class="item__left">
            <Icon name="bell" />
            <b>Belum ada diagnosis atau peringatan</b>
          </span>
        </div>
        <div v-for="(l, i) in logs" :key="i" class="item item--log">
          <span class="item__left">
            <Icon name="bell" />
            <b>{{ l.text }}</b>
          </span>
          <small>{{ l.date }}</small>
        </div>
      </article>

      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Diagnosis AI Tanaman</h3>
            <p>Deteksi otomatis dari kamera node</p>
          </div>
          <button type="button" class="btn btn--tiny" @click="emit('navigate', 'ai')">
            <Icon name="history" />
            Riwayat
          </button>
        </div>

        <div class="diag">
          <div class="diag__img">
            <img v-if="diagnosisPhoto" :src="diagnosisPhoto" alt="Foto daun selada" />
            <Icon v-else name="leaf" />
          </div>
          <div class="diag__info">
            <div class="diag__title">
              <b>{{ diagnosisTitle }}</b>
              <span class="pill" :class="diagnosisBadgeClass">{{ diagnosisSeverity }}</span>
            </div>
            <div class="diag__conf">
              <span>Confidence</span><b>{{ diagnosisConfidence }}%</b>
            </div>
            <div class="bar"><i :style="{ width: `${diagnosisConfidence}%` }"></i></div>
            <small>{{ diagnosisSubtitle }}</small>
          </div>
        </div>

        <h4>Rekomendasi AI</h4>
        <ul class="reco">
          <li v-if="recommendations.length === 0">Belum ada rekomendasi tindakan.</li>
          <li v-for="(r, i) in recommendations" :key="i">{{ r }}</li>
        </ul>
      </article>
    </section>

    <AddAlertModal v-if="showAlertModal" :device-name="activeDevice?.name || 'Tanova Grove – 1'"
      @close="showAlertModal = false" @save="handleAddAlert" />
  </div>
</template>

<style scoped>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  font-size: 10px;
  background: var(--green-100);
  border-radius: 8px;
}

.item--lg {
  padding: 10px 12px;
  font-size: 11px;
}

.item--log {
  padding: 13px 14px;
}

.item__left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.item__left .icon {
  width: 13px;
  height: 13px;
}

.item small {
  display: block;
  font-size: 8.5px;
  color: var(--muted);
}

.item--log small {
  font-size: 9px;
}

.ok {
  font-size: 9px;
}

/* Tombol ON/OFF pompa (mode manual) */
.pill-btn {
  font: inherit;
  font-size: 9px;
  font-weight: 600;
  border: 0;
  cursor: pointer;
}

.pill--off {
  padding: 3px 12px;
  color: var(--muted);
  background: #d9dfcb;
}

/* Slider kontrol (mode manual) */
.item--slider {
  gap: 10px;
  padding: 9px 12px;
}

.slider__wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 10px;
  color: var(--green-900);
}

.slider {
  --pct: 50%;
  width: 100%;
  height: 5px;
  margin: 0;
  background: linear-gradient(to right, var(--green-500) var(--pct), #fff var(--pct));
  border-radius: 999px;
  outline: none;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  width: 11px;
  height: 11px;
  background: var(--green-900);
  border: 0;
  border-radius: 50%;
  appearance: none;
  -webkit-appearance: none;
}

.slider::-moz-range-thumb {
  width: 11px;
  height: 11px;
  background: var(--green-900);
  border: 0;
  border-radius: 50%;
}

.slider:focus-visible {
  box-shadow: 0 0 0 3px rgba(147, 186, 57, 0.35);
}

.value-chip {
  flex: none;
  min-width: 50px;
  padding: 7px 10px;
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  color: var(--green-900);
  background: var(--green-500);
  border-radius: 8px;
}

/* Peringatan */
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  font-size: 10px;
  border-radius: 8px;
}

.alert .item__left .icon {
  width: 13px;
  height: 13px;
}

.alert .badge {
  padding: 3px 10px;
  font-size: 9px;
  font-weight: 600;
  color: #fff;
  border-radius: 999px;
}

.alert--warning {
  color: var(--yellow-text);
  background: var(--yellow-bg);
}

.alert--warning .badge {
  background: var(--orange);
}

.alert--alert {
  color: var(--red-text);
  background: var(--red-bg);
}

.alert--alert .badge {
  background: var(--red);
}

.alert--ok {
  color: var(--green-900);
  background: #dbe9b9;
}

.alert--ok .badge {
  background: var(--green-700);
}

.item__left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plant {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px;
  font-size: 10px;
  color: var(--green-900);
  background: var(--green-100);
  border-radius: 8px;
}

.plant .icon {
  color: var(--green-700);
}

.plant small {
  font-size: 8.5px;
  color: var(--muted);
}

/* Diagnosis AI */
.diag {
  display: flex;
  gap: 10px;
}

.diag__img {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex: none;
  color: #fff;
  background: linear-gradient(135deg, #4d7c0f, #84a83a);
  border-radius: 8px;
  overflow: hidden;
}

.diag__img img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.diag__img .icon {
  width: 24px;
  height: 24px;
}

.diag__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.diag__title {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
  font-size: 10px;
  color: var(--green-900);
}

.diag__conf {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: var(--muted);
}

.bar {
  height: 4px;
  background: #dbe5c3;
  border-radius: 999px;
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: var(--green-700);
}

.diag__info small {
  font-size: 8px;
  color: var(--muted);
}

.reco {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 10px 12px;
  list-style: none;
  background: var(--green-100);
  border-radius: 8px;
}

.reco li {
  position: relative;
  padding-left: 12px;
  font-size: 9px;
  line-height: 1.35;
  color: var(--muted);
}

.reco li::before {
  content: '';
  position: absolute;
  top: 3px;
  left: 0;
  width: 5px;
  height: 5px;
  background: var(--green-500);
  border-radius: 50%;
}

/* =====================================================
   RESPONSIVE (HP & tablet) — hanya mengatur layout,
   tampilan desktop tidak berubah
   ===================================================== */

/* Cegah elemen flex/grid melebar melebihi layar */
.page,
.card,
.panel,
.item,
.alert,
.metric {
  min-width: 0;
}

.item__left b,
.alert .item__left b,
.diag__title b,
.reco li,
.head p {
  overflow-wrap: anywhere;
}

/* Tablet */
@media (max-width: 1024px) {
  .metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* HP */
@media (max-width: 768px) {
  .page {
    max-width: 100%;
    overflow-x: hidden;
  }

  /* Header: judul di atas, tombol di bawah */
  .head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .head__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .head__actions .btn {
    flex: 1 1 140px;
    justify-content: center;
    min-height: 38px;
  }

  /* Kartu metrik 2 kolom */
  .metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  /* Baris panel jadi 1 kolom (ditumpuk) */
  .row {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }

  /* Header panel boleh turun baris jika sempit */
  .panel__head {
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Ukuran sentuh tombol kecil */
  .btn--tiny {
    min-height: 32px;
  }

  .pill-btn {
    min-width: 44px;
    min-height: 26px;
  }

  /* Slider lebih mudah disentuh */
  .slider {
    height: 6px;
  }

  .slider::-webkit-slider-thumb {
    width: 16px;
    height: 16px;
  }

  .slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
  }

  /* Log: teks & tanggal boleh turun baris */
  .item--log {
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .item--log small {
    margin-left: 21px;
  }

  /* Item kalibrasi: status tidak terpotong */
  .item .ok {
    flex: none;
    text-align: right;
  }
}

/* HP kecil */
@media (max-width: 380px) {
  .metrics {
    grid-template-columns: minmax(0, 1fr);
  }

  .head__actions .btn {
    flex-basis: 100%;
  }

  .item--slider {
    flex-wrap: wrap;
  }

  .item--slider .slider__wrap {
    flex: 1 1 100%;
    order: 3;
  }

  .value-chip {
    margin-left: auto;
  }
}
</style>