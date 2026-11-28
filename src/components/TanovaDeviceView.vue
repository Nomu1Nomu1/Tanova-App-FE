<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { api } from '../services/api'

const searchQuery = ref('')
const selectedStatus = ref('Semua Status')

const devicesList = ref([])
const selectedDevice = ref(null)
const overviewData = ref(null)

const loading = ref(false)
const overviewError = ref('')
const lastUpdatedAt = ref(null)
const isRefreshingOverview = ref(false)
const realtimeStatus = ref('Menghubungkan')

let refreshTimer = null
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

//LOAD DEVICES
async function loadDevices() {
  loading.value = true

  try {
    const response = await api.getDevices()
    devicesList.value = getArrayResponse(response)

    if (devicesList.value.length > 0) {
      const currentId = selectedDevice.value?.id || selectedDevice.value?._id

      const target =
        devicesList.value.find((device) => (device.id || device._id) === currentId) ||
        devicesList.value[0]

      await selectDevice(target)
    } else {
      stopRealtime()
      selectedDevice.value = null
      overviewData.value = null
      lastUpdatedAt.value = null
    }
  } catch (error) {
    console.error('Gagal memuat perangkat:', error)
    overviewError.value = error.message || 'Gagal memuat perangkat.'
  } finally {
    loading.value = false
  }
}

//OVERVIEW
async function fetchOverview(deviceId) {
  if (!deviceId || isRefreshingOverview.value) return

  const requestId = ++overviewRequestId
  isRefreshingOverview.value = true

  try {
    const response = await api.getDashboardOverview(deviceId)

    if (requestId !== overviewRequestId) return

    const data = unwrapResponse(response)

    overviewData.value = data || {}
    lastUpdatedAt.value = new Date()
    overviewError.value = ''
  } catch (error) {
    if (requestId !== overviewRequestId) return

    overviewError.value = error.message || 'Gagal mengambil data dashboard.'
    console.error('Overview error:', error)
  } finally {
    if (requestId === overviewRequestId) {
      isRefreshingOverview.value = false
    }
  }
}

//SSE PAYLOAD HANDLER
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
    // Beberapa implementasi stream mengirim object metrik secara langsung.
    overviewData.value = {
      ...overviewData.value,
      metrics: data,
    }
  }

  // Pertahankan status koneksi jika event menyediakannya.
  if (data.connection) {
    overviewData.value = {
      ...overviewData.value,
      connection: data.connection,
    }
  }

  if (typeof data.online === 'boolean') {
    overviewData.value.online = data.online
  }

  lastUpdatedAt.value = new Date()
  overviewError.value = ''
}

//SSE PARSER
function processSseBlock(block) {
  const lines = block.split(/\r?\n/)
  const dataLines = []

  let eventName = 'message'

  for (const line of lines) {
    if (line.startsWith(':')) continue

    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim()
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
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

//SSE CONNECTION
async function connectDashboardStream(deviceId) {
  stopRealtime()

  if (!deviceId) return

  streamController = new AbortController()
  const currentController = streamController

  realtimeStatus.value = 'Menghubungkan'

  try {
    const response = await api.getDashboardStream(deviceId, currentController.signal, 5)

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '')
      throw new Error(`SSE gagal (${response.status}): ${errorBody || response.statusText}`)
    }

    if (!response.body) {
      throw new Error('Browser tidak mendukung pembacaan stream.')
    }

    realtimeStatus.value = 'Terhubung'

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { value, done } = await reader.read()

      if (done) break
      if (currentController.signal.aborted) break

      buffer += decoder.decode(value, { stream: true })

      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() || ''

      for (const block of blocks) {
        processSseBlock(block)
      }
    }

    if (!currentController.signal.aborted) {
      throw new Error('Koneksi SSE terputus.')
    }
  } catch (error) {
    if (currentController.signal.aborted) return

    console.error('SSE error:', error)
    realtimeStatus.value = 'Polling'
    overviewError.value = 'Stream real-time tidak tersedia. Menggunakan pembaruan berkala.'

    startPolling(deviceId)
  }
}

//POLLING FALLBACK
function startPolling(deviceId) {
  stopPolling()

  if (!deviceId) return

  fetchOverview(deviceId)

  refreshTimer = window.setInterval(() => {
    if (!isRefreshingOverview.value) {
      fetchOverview(deviceId)
    }
  }, 5000)
}

function stopPolling() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function stopRealtime() {
  stopPolling()

  if (streamController) {
    streamController.abort()
    streamController = null
  }

  realtimeStatus.value = 'Terputus'
}

//DEVICE SELECTION
async function selectDevice(device) {
  const deviceId = device.id || device._id

  if (!deviceId) {
    console.error('Device tidak memiliki ID:', device)
    return
  }

  stopRealtime()

  overviewRequestId += 1
  isRefreshingOverview.value = false

  selectedDevice.value = device
  overviewData.value = null
  lastUpdatedAt.value = null
  overviewError.value = ''

  await fetchOverview(deviceId)

  // Setelah overview awal, mulai SSE.
  connectDashboardStream(deviceId)
}

//SENSOR MAPPING
const metricAliases = {
  ph: ['ph', 'pH', 'ph_value'],
  ec: ['ec', 'ec_value'],
  tds: ['tds', 'tds_value'],
  water_temp: ['water_temp', 'temp_water', 'suhu_air'],
  air_temp: ['air_temp', 'temp_air', 'suhu_udara'],
  humidity: ['humidity', 'hum', 'kelembapan'],
  waterflow: ['waterflow', 'water_flow'],
  tank_level: ['tank_level', 'level_tangki'],
}

function unwrapMetricValue(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  if (typeof value === 'object') {
    return value.value ?? value.val ?? value.reading ?? value.latest ?? null
  }

  return value
}

function getMetricValue(metrics, sensor) {
  if (!metrics || !sensor) return null

  const keys = [sensor.tb_key?.trim(), ...(metricAliases[sensor.type] || [sensor.type])].filter(
    Boolean,
  )

  // Coba key yang sudah dikonfigurasi pada sensor.
  for (const key of keys) {
    const value = unwrapMetricValue(metrics[key])

    if (value !== null) return value
  }

  // Jika backend membungkus data dalam objek telemetry/data.
  const nestedSources = [metrics.latest, metrics.values, metrics.data, metrics.telemetry]

  for (const source of nestedSources) {
    if (!source || typeof source !== 'object') continue

    for (const key of keys) {
      const value = unwrapMetricValue(source[key])

      if (value !== null) return value
    }
  }

  return null
}

function formatCalDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const sensors = computed(() => {
  if (!selectedDevice.value) return []

  const deviceSensors = selectedDevice.value.sensors || []
  const metrics = overviewData.value?.metrics || {}
  const calibItems = overviewData.value?.calibration?.items || []

  return deviceSensors.map((sensor) => {
    let rawValue = getMetricValue(metrics, sensor)
    const hasValue = rawValue !== null

    if (hasValue && sensor.type === 'humidity' && !isNaN(rawValue)) {
      rawValue = Number(rawValue).toFixed(1)
    }

    // Data kalibrasi ada di overview.calibration.items (dicocokkan lewat id, lalu tipe sensor)
    const sensorId = sensor.id || sensor._id
    const cal =
      calibItems.find((c) => c.sensor_id && c.sensor_id === sensorId) ||
      calibItems.find((c) => c.sensor_type && c.sensor_type === sensor.type)

    return {
      id: sensorId || sensor.tb_key || sensor.type,
      name: sensor.name || sensor.type?.toUpperCase() || 'Sensor',
      desc: `Tipe: ${sensor.type || '-'} · Key: ${sensor.tb_key || '-'}`,
      unit: sensor.unit || '',
      value: hasValue ? `${rawValue} ${sensor.unit || ''}`.trim() : '-',
      status: hasValue ? 'Data diterima' : 'Menunggu data',
      calibration: formatCalDate(cal?.last_calibrated_at) || sensor.last_calibrated || '-',
      nextCal: formatCalDate(cal?.due_at) || sensor.next_due_at || '-',
      urgent: Boolean(sensor.needs_calibration),
      hasValue,
    }
  })
})

//CONNECTION STATUS
const connectionStatus = computed(() => {
  const online = overviewData.value?.connection?.online ?? overviewData.value?.online

  if (online === true) return 'Terhubung'
  if (online === false) return 'Terputus'

  return 'Tidak diketahui'
})

// Status koneksi satu perangkat dari daftar /devices (ada di device.connection.online)
function deviceConnectionLabel(device) {
  const online = device.connection?.online ?? device.online

  if (online === true) return 'Terhubung'
  if (online === false) return 'Terputus'

  return 'Tidak diketahui'
}

// Perangkat yang sedang dipilih memakai status dari overview (lebih baru)
function rowStatus(device) {
  const isSelected =
    (device.id || device._id) === (selectedDevice.value?.id || selectedDevice.value?._id)

  return isSelected ? connectionStatus.value : deviceConnectionLabel(device)
}

//ACTUATOR
const pumpStatus = computed(() => {
  const actuators = overviewData.value?.actuators || selectedDevice.value?.actuators || []

  const pump = actuators.find(
    (actuator) => actuator.type === 'pump' || actuator.name?.toLowerCase().includes('pompa'),
  )

  if (pump) {
    const state = pump.state ?? pump.status

    if (state === 'on') return 'Menyala'
    if (state === 'off') return 'Mati'
  }

  const value = overviewData.value?.pump ?? overviewData.value?.water_pump

  if (value === true || value === 'on') return 'Menyala'
  if (value === false || value === 'off') return 'Mati'

  return 'Tidak diketahui'
})

//FILTER & SUMMARY
const filteredDevices = computed(() => {
  return devicesList.value.filter((device) => {
    const nameMatch =
      device.name?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (device.tb_device_id || '').toLowerCase().includes(searchQuery.value.toLowerCase())

    const status = rowStatus(device)

    const statusMatch = selectedStatus.value === 'Semua Status' || status === selectedStatus.value

    return nameMatch && statusMatch
  })
})

const totalDevicesCount = computed(() => devicesList.value.length)

const connectedDevicesCount = computed(
  () => devicesList.value.filter((device) => rowStatus(device) === 'Terhubung').length,
)

const disconnectedDevicesCount = computed(
  () => devicesList.value.filter((device) => rowStatus(device) === 'Terputus').length,
)

//ACTIONS
async function handleRefresh() {
  if (!selectedDevice.value) {
    await loadDevices()
    return
  }

  await fetchOverview(selectedDevice.value.id || selectedDevice.value._id)
}

function handleAddDevice() {
  alert('Pengelolaan dan penambahan perangkat dilakukan melalui Panel Administrator.')
}

async function handleCalibrate() {
  if (!selectedDevice.value) {
    alert('Pilih perangkat terlebih dahulu.')
    return
  }

  alert(`Memulai proses kalibrasi untuk perangkat: ${selectedDevice.value.name}`)
}

//LIFECYCLE
onMounted(() => {
  loadDevices()
})

onBeforeUnmount(() => {
  overviewRequestId += 1
  stopRealtime()
})
</script>

<template>
  <div class="tanova-device-container">
    <!-- Header Section -->
    <div class="header-section">
      <div>
        <h1 class="page-title">Pengelolaan Perangkat</h1>
        <p class="page-subtitle">
          Pantau koneksi, kelola sensor, dan jaga akurasi pengukuran hidroponik Anda.
        </p>
      </div>
      <div class="header-buttons">
        <button @click="handleRefresh" class="btn-secondary">
          <i class="fa-solid fa-rotate"></i> Segarkan
        </button>
        <button @click="handleAddDevice" class="btn-primary">
          <i class="fa-solid fa-plus"></i> Tambah Perangkat
        </button>
      </div>
    </div>

    <!-- 4 Metric Cards Grid -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div>
          <span class="metric-label">Total Perangkat</span>
          <div class="metric-value">{{ totalDevicesCount }}</div>
          <span class="metric-sub">terdaftar di sistem</span>
        </div>
        <div class="metric-icon-box green-light"><i class="fa-solid fa-hard-drive"></i></div>
      </div>

      <div class="metric-card">
        <div>
          <span class="metric-label">Perangkat Terhubung</span>
          <div class="metric-value">{{ connectedDevicesCount }}</div>
          <span class="metric-sub text-danger">{{ disconnectedDevicesCount }} terputus</span>
        </div>
        <div class="metric-icon-box green-light"><i class="fa-solid fa-wifi"></i></div>
      </div>

      <div class="metric-card">
        <div>
          <span class="metric-label">Sensor Aktif</span>
          <div class="metric-value">{{ sensors.length }}</div>
          <span class="metric-sub">terdeteksi di perangkat</span>
        </div>
        <div class="metric-icon-box green-light"><i class="fa-solid fa-wave-square"></i></div>
      </div>

      <div class="metric-card">
        <div>
          <span class="metric-label">Mode Sistem</span>
          <div
            class="metric-value"
            style="font-size: 18px; margin-top: 4px; text-transform: uppercase"
          >
            {{ selectedDevice?.mode || 'Auto' }}
          </div>
          <span class="metric-sub text-warning">pengaturan aktif</span>
        </div>
        <div class="metric-icon-box green-light"><i class="fa-solid fa-sliders"></i></div>
      </div>
    </div>

    <!-- Daftar Perangkat Section -->
    <div class="card-section mb-24">
      <div class="table-header-row">
        <div class="table-title-group">
          <h3 class="section-title">Daftar Perangkat</h3>
          <span class="badge-count">{{ filteredDevices.length }} perangkat</span>
        </div>
        <div class="table-filter-group">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon-fa"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama atau ID"
              class="search-input"
            />
          </div>
          <select v-model="selectedStatus" class="filter-select">
            <option>Semua Status</option>
            <option>Terhubung</option>
            <option>Terputus</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="custom-table">
          <thead>
            <tr>
              <th>NAMA PERANGKAT</th>
              <th>THINGSBOARD ID</th>
              <th>GREENHOUSE</th>
              <th>KONEKSI</th>
              <th>SENSOR</th>
              <th class="text-right">TINDAKAN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" style="text-align: center; padding: 20px; color: #666">
                Memuat perangkat...
              </td>
            </tr>
            <tr v-else-if="filteredDevices.length === 0">
              <td colspan="6" style="text-align: center; padding: 20px; color: #666">
                Tidak ada perangkat ditemukan.
              </td>
            </tr>
            <tr
              v-for="dev in filteredDevices"
              :key="dev.id || dev._id"
              @click="selectDevice(dev)"
              :class="{
                'row-highlight':
                  (selectedDevice?.id || selectedDevice?._id) === (dev.id || dev._id),
              }"
              style="cursor: pointer"
            >
              <td>
                <div class="device-name-cell">
                  <div class="dev-icon-box"><i class="fa-solid fa-server"></i></div>
                  <div>
                    <div class="dev-main-text">{{ dev.name }}</div>
                    <div class="dev-sub-text">
                      ID: <code>{{ dev.id || dev._id }}</code>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <code>{{ dev.tb_device_id || '-' }}</code>
              </td>
              <td>{{ dev.greenhouse?.name || dev.greenhouse_name || 'Zona Utama' }}</td>
              <td>
                <span
                  :class="[
                    'status-pill',
                    rowStatus(dev) === 'Terhubung' ? 'status-connected' : 'status-disconnected',
                  ]"
                >
                  ● {{ rowStatus(dev) }}
                </span>
              </td>
              <td>{{ dev.sensors?.length || 0 }} aktif</td>
              <td class="text-right">
                <button class="action-icon-btn"><i class="fa-solid fa-gear"></i></button>
                <i class="fa-solid fa-chevron-right arrow-right"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Bottom Split Grid -->
    <div class="bottom-split-grid">
      <!-- Kiri: Sensor & Aktuator -->
      <div class="card-section">
        <div class="sensor-header-row">
          <div>
            <h3 class="section-title">Sensor & Aktuator</h3>
            <p class="section-desc">
              {{ selectedDevice?.name || 'Pilih perangkat' }} · {{ sensors.length }} sensor
              terhubung
            </p>
          </div>
          <span class="badge-otomatis">● Mode: {{ selectedDevice?.mode || 'auto' }}</span>
        </div>
        <p class="section-desc">
          Status realtime:
          <strong>{{ realtimeStatus }}</strong>
        </p>

        <p v-if="lastUpdatedAt" class="section-desc">
          Sinkronisasi terakhir:
          {{ lastUpdatedAt.toLocaleTimeString('id-ID') }}
        </p>

        <p v-if="overviewError" class="section-desc text-danger">
          {{ overviewError }}
        </p>
        <p v-if="overviewError" class="section-desc text-danger">{{ overviewError }}</p>
        <div class="table-wrapper mb-16"></div>

        <div class="table-wrapper mb-16">
          <table class="custom-table sensor-table">
            <thead>
              <tr>
                <th>SENSOR</th>
                <th>PEMBACAAN</th>
                <th>STATUS</th>
                <th>KALIBRASI TERAKHIR</th>
                <th class="text-right">TINDAKAN</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sensors.length === 0">
                <td colspan="5" style="text-align: center; color: #777; padding: 15px">
                  Belum ada sensor terdaftar pada perangkat ini.
                </td>
              </tr>
              <tr v-for="(sensor, idx) in sensors" :key="idx">
                <td>
                  <div class="sensor-name-cell">
                    <div class="sensor-dot-icon"></div>
                    <div>
                      <div class="dev-main-text">{{ sensor.name }}</div>
                      <div class="dev-sub-text">{{ sensor.desc }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="sensor-value-bold">{{ sensor.value }}</span>
                </td>
                <td>
                  <span
                    :class="[
                      'status-pill',
                      sensor.hasValue ? 'status-connected' : 'status-disconnected',
                    ]"
                    >● {{ sensor.status }}</span
                  >
                </td>
                <td>
                  <div class="cal-date-text">{{ sensor.calibration }}</div>
                  <div class="cal-next-text">{{ sensor.nextCal }}</div>
                </td>
                <td class="text-right"><button class="btn-atur">Atur</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Aktuator Pompa Air Bar -->
        <div class="actuator-bar">
          <div class="actuator-left">
            <i class="fa-solid fa-bolt pump-icon-fa"></i>
            <span class="actuator-text"
              ><strong>Aktuator / Pompa</strong> Status terkini dari sistem</span
            >
          </div>
          <span class="badge-menyala">● {{ pumpStatus }}</span>
        </div>
      </div>

      <!-- Kanan: Kalibrasi & Info -->
      <div class="card-section">
        <h3 class="section-title calibration-title">Kalibrasi & Kontrol</h3>

        <button @click="handleCalibrate" class="btn-primary full-width mb-24">
          <i class="fa-solid fa-bolt"></i> Mulai Kalibrasi Sensor
        </button>

        <div class="history-header">
          <span class="history-title-label">Informasi Perangkat</span>
        </div>
        <div class="history-footer-note" style="margin-top: 8px">
          <span class="info-circle-sm">i</span> Zona: {{ selectedDevice?.zone || '-' }}<br />
          Catatan: {{ selectedDevice?.notes || 'Tidak ada catatan khusus.' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tanova-device-container {
  padding: 30px;
  font-family: sans-serif;
  background: #f8faf6;
  min-height: 100vh;
  box-sizing: border-box;
}
.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  padding: 12px 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}
.brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-icon {
  width: 36px;
  height: 36px;
  background: #93ba39;
  color: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.brand-title {
  font-size: 18px;
  font-weight: bold;
  color: #222;
}
.top-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}
.icon-btn-top {
  width: 36px;
  height: 36px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #555;
}
.profile-avatar-top {
  width: 36px;
  height: 36px;
  background: #e5f2cc;
  color: #93ba39;
  font-weight: bold;
  font-size: 13px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #111;
  margin: 0 0 4px 0;
}
.page-subtitle {
  font-size: 14px;
  color: #666;
  margin: 0;
}
.header-buttons {
  display: flex;
  gap: 12px;
}
.btn-secondary {
  padding: 10px 18px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-secondary:hover {
  background: #f5f5f5;
}
.btn-primary {
  padding: 10px 20px;
  background: #93ba39;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-primary:hover {
  background: #82a532;
}
.full-width {
  width: 100%;
  justify-content: center;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.metric-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.metric-label {
  font-size: 13px;
  color: #666;
  display: block;
  margin-bottom: 6px;
}
.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #111;
  margin-bottom: 2px;
}
.metric-sub {
  font-size: 12px;
  color: #555;
}
.text-danger {
  color: #d9534f;
  font-weight: 500;
}
.text-warning {
  color: #f0ad4e;
  font-weight: 500;
}
.metric-icon-box {
  width: 36px;
  height: 36px;
  background: #e5f2cc;
  color: #93ba39;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
}
.card-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
}
.mb-24 {
  margin-bottom: 24px;
}
.mb-16 {
  margin-bottom: 16px;
}
.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.table-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #111;
  margin: 0;
}
.section-desc {
  font-size: 13px;
  color: #666;
  margin: 2px 0 0 0;
}
.calibration-title {
  margin-bottom: 16px !important;
}
.badge-count {
  background: #f1f5ee;
  color: #555;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 500;
}
.table-filter-group {
  display: flex;
  gap: 12px;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 13px;
  width: 220px;
  background: #fff;
}
.search-input:focus {
  border-color: #93ba39;
  outline: none;
}
.search-icon-fa {
  position: absolute;
  left: 10px;
  color: #888;
  font-size: 12px;
}
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  color: #333;
}
.table-wrapper {
  overflow-x: auto;
}
.custom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}
.custom-table th {
  color: #777;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.5px;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}
.custom-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}
.device-name-cell,
.sensor-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dev-icon-box {
  width: 36px;
  height: 36px;
  background: #e5f2cc;
  color: #93ba39;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.dev-main-text {
  font-weight: bold;
  color: #222;
}
.dev-sub-text {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
.text-dark {
  color: #333;
}
.status-pill {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}
.status-connected {
  background: #e5f2cc;
  color: #558b2f;
}
.status-disconnected {
  background: #fde8e8;
  color: #d9534f;
}
.text-right {
  text-align: right;
}
.action-icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  padding: 4px;
}
.arrow-right {
  color: #aaa;
  font-size: 11px;
  margin-left: 8px;
}
.bottom-split-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
.sensor-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.badge-otomatis {
  background: #e5f2cc;
  color: #558b2f;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}
.sensor-dot-icon {
  width: 8px;
  height: 8px;
  background: #93ba39;
  border-radius: 50%;
}
.sensor-value-bold {
  font-weight: bold;
  color: #111;
}
.cal-date-text {
  font-size: 12px;
  color: #333;
}
.cal-next-text {
  font-size: 11px;
  color: #666;
  margin-top: 1px;
}
.btn-atur {
  padding: 6px 14px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  color: #333;
}
.btn-atur:hover {
  background: #f5f5f5;
}
.actuator-bar {
  background: #f4f8ed;
  border: 1px solid #d4edda;
  padding: 14px 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.actuator-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #333;
}
.pump-icon-fa {
  color: #93ba39;
}
.badge-menyala {
  background: #e5f2cc;
  color: #558b2f;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 500;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.history-title-label {
  font-size: 13px;
  font-weight: bold;
  color: #333;
}
.history-footer-note {
  font-size: 11px;
  color: #666;
  line-height: 1.4;
}
.info-circle-sm {
  width: 12px;
  height: 12px;
  background: #ccc;
  color: #fff;
  border-radius: 50%;
  font-size: 9px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* =====================================================
   RESPONSIVE (HP & tablet) — hanya mengatur layout,
   tampilan desktop tidak berubah
   ===================================================== */

/* Cegah elemen grid/flex melebar melebihi layar */
.metric-card,
.card-section,
.bottom-split-grid > * {
  min-width: 0;
}

.dev-sub-text code,
.dev-main-text,
.page-subtitle,
.section-desc {
  overflow-wrap: anywhere;
}

/* Tablet */
@media (max-width: 1024px) {
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bottom-split-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* HP */
@media (max-width: 768px) {
  .tanova-device-container {
    padding: 16px;
  }

  /* Header: judul di atas, tombol di bawah */
  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    margin-bottom: 18px;
  }

  .page-title {
    font-size: 22px;
  }

  .header-buttons {
    width: 100%;
    gap: 10px;
  }

  .header-buttons .btn-secondary,
  .header-buttons .btn-primary {
    flex: 1;
    justify-content: center;
    min-height: 40px;
  }

  /* Kartu metrik */
  .metrics-grid {
    gap: 12px;
    margin-bottom: 18px;
  }

  .metric-card {
    padding: 14px;
    gap: 8px;
  }

  .metric-icon-box {
    flex: none;
  }

  .card-section {
    padding: 16px;
  }

  .mb-24 {
    margin-bottom: 18px;
  }

  /* Header tabel + filter: ditumpuk */
  .table-header-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .table-filter-group {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .search-box {
    width: 100%;
  }

  .search-input {
    width: 100%;
    box-sizing: border-box;
  }

  .filter-select {
    width: 100%;
    box-sizing: border-box;
  }

  /* 16px mencegah browser iOS melakukan zoom otomatis saat input difokus */
  .search-input,
  .filter-select {
    font-size: 16px;
  }

  /* Tabel tetap utuh & bisa digeser ke samping */
  .table-wrapper {
    -webkit-overflow-scrolling: touch;
  }

  .custom-table {
    min-width: 680px;
  }

  .sensor-table {
    min-width: 600px;
  }

  .custom-table th,
  .custom-table td {
    white-space: nowrap;
  }

  /* Header sensor boleh turun baris */
  .sensor-header-row {
    flex-wrap: wrap;
    gap: 8px;
  }

  /* Bar aktuator boleh turun baris */
  .actuator-bar {
    flex-wrap: wrap;
    gap: 10px;
  }

  .btn-atur {
    min-height: 32px;
  }

  .btn-primary.full-width {
    min-height: 42px;
  }
}

/* HP kecil */
@media (max-width: 400px) {
  .tanova-device-container {
    padding: 12px;
  }

  .metrics-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .header-buttons {
    flex-direction: column;
  }
}
</style>
