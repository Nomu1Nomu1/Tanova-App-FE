<script setup>
import { ref } from 'vue'

const searchQuery = ref('')
const selectedStatus = ref('Semua Status')

const devices = ref([
  {
    name: 'Tanova Grove - 1',
    code: 'TNV-GRV-001',
    statusTag: 'Dipilih',
    location: 'Zona 1 · Selada',
    connection: 'Terhubung',
    sensorCount: '4 / 4 aktif',
    sync: 'Baru saja',
  },
  {
    name: 'Tanova Grove - 2',
    code: 'TNV-GRV-002',
    statusTag: '',
    location: 'Zona 2 · Selada',
    connection: 'Terhubung',
    sensorCount: '4 / 4 aktif',
    sync: '1 menit lalu',
  },
  {
    name: 'Tanova Grove - 3',
    code: 'TNV-GRV-003',
    statusTag: '',
    location: 'Zona 3 · Selada',
    connection: 'Terputus',
    sensorCount: '0 / 4 aktif',
    sync: '07:58 WIB',
  },
])

const sensors = ref([
  {
    name: 'pH Larutan',
    desc: 'Probe pH · A01',
    value: '6.0 pH',
    status: 'Aktif',
    calibration: '9 Sep 2026',
    nextCal: 'Berikutnya 9 Okt',
  },
  {
    name: 'EC / TDS',
    desc: 'Probe EC · A02',
    value: '1.42 mS/cm',
    status: 'Aktif',
    calibration: '1 Sep 2026',
    nextCal: 'Jadwal hari ini',
    urgent: true,
  },
  {
    name: 'Suhu Air',
    desc: 'DS18B20 · D01',
    value: '23.4 °C',
    status: 'Aktif',
    calibration: '3 Sep 2026',
    nextCal: 'Berikutnya 3 Okt',
  },
  {
    name: 'Level Tangki',
    desc: 'Ultrasonik · D02',
    value: '82 %',
    status: 'Aktif',
    calibration: '3 Sep 2026',
    nextCal: 'Berikutnya 3 Okt',
  },
])

function handleRefresh() {
  alert('Memperbarui data perangkat...')
}

function handleAddDevice() {
  alert('Form tambah perangkat dibuka.')
}

function handleCalibrate() {
  alert('Memulai kalibrasi EC / TDS...')
}
</script>

<template>
  <div class="tanova-device-container">
    <!-- Top Header Bar -->
    <div class="top-header">
      <div class="brand-box">
        <div class="brand-icon">
          <i class="fa-solid fa-seedling"></i>
        </div>
        <span class="brand-title">Tanova</span>
      </div>
      <div class="top-actions">
        <button class="icon-btn-top" title="Notifikasi">
          <i class="fa-solid fa-bell"></i>
        </button>
        <div class="profile-avatar-top">BS</div>
      </div>
    </div>

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
          <div class="metric-value">3</div>
          <span class="metric-sub">di 3 zona</span>
        </div>
        <div class="metric-icon-box green-light">
          <i class="fa-solid fa-hard-drive"></i>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <span class="metric-label">Perangkat Terhubung</span>
          <div class="metric-value">2</div>
          <span class="metric-sub text-danger">1 terputus</span>
        </div>
        <div class="metric-icon-box green-light">
          <i class="fa-solid fa-wifi"></i>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <span class="metric-label">Sensor Aktif</span>
          <div class="metric-value">8</div>
          <span class="metric-sub">dari 12 sensor</span>
        </div>
        <div class="metric-icon-box green-light">
          <i class="fa-solid fa-wave-square"></i>
        </div>
      </div>

      <div class="metric-card">
        <div>
          <span class="metric-label">Perlu Kalibrasi</span>
          <div class="metric-value">1</div>
          <span class="metric-sub text-warning">sensor EC / TDS</span>
        </div>
        <div class="metric-icon-box green-light">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
      </div>
    </div>

    <!-- Daftar Perangkat Section -->
    <div class="card-section mb-24">
      <div class="table-header-row">
        <div class="table-title-group">
          <h3 class="section-title">Daftar Perangkat</h3>
          <span class="badge-count">3 perangkat</span>
        </div>
        <div class="table-filter-group">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass search-icon-fa"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari nama atau ID perangkat"
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

      <!-- Table Wrapper -->
      <div class="table-wrapper">
        <table class="custom-table">
          <thead>
            <tr>
              <th>NAMA PERANGKAT</th>
              <th>LOKASI</th>
              <th>KONEKSI</th>
              <th>SENSOR</th>
              <th>SINKRONISASI</th>
              <th class="text-right">TINDAKAN</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(dev, index) in devices"
              :key="index"
              :class="{ 'row-highlight': dev.statusTag }"
            >
              <td>
                <div class="device-name-cell">
                  <div class="dev-icon-box">
                    <i class="fa-solid fa-server"></i>
                  </div>
                  <div>
                    <div class="dev-main-text">{{ dev.name }}</div>
                    <div class="dev-sub-text">
                      {{ dev.code }} <span v-if="dev.statusTag" class="tag-dipilih">· Dipilih</span>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <span class="text-dark">{{ dev.location }}</span>
              </td>
              <td>
                <span
                  :class="[
                    'status-pill',
                    dev.connection === 'Terhubung' ? 'status-connected' : 'status-disconnected',
                  ]"
                >
                  ● {{ dev.connection }}
                </span>
              </td>
              <td>
                <span class="text-dark">{{ dev.sensorCount }}</span>
              </td>
              <td>
                <div class="sync-cell">
                  <i class="fa-solid fa-rotate-right sync-icon-fa"></i> {{ dev.sync }}
                </div>
              </td>
              <td class="text-right">
                <button class="action-icon-btn" title="Pengaturan">
                  <i class="fa-solid fa-gear"></i>
                </button>
                <i class="fa-solid fa-chevron-right arrow-right"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer-info">
        Menampilkan 3 dari 3 perangkat
        <span class="float-right">1 Oktober 2026 · Pembaruan terakhir: 08:42 WIB</span>
      </div>
    </div>

    <!-- Bottom Split Grid (Sensor & Kalibrasi) -->
    <div class="bottom-split-grid">
      <!-- Kiri: Sensor & Aktuator -->
      <div class="card-section">
        <div class="sensor-header-row">
          <div>
            <h3 class="section-title">Sensor & Aktuator</h3>
            <p class="section-desc">Tanova Grove - 1 · Zona 1 · 4 sensor terhubung</p>
          </div>
          <span class="badge-otomatis">● Otomatis</span>
        </div>

        <!-- Tabel Sensor -->
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
                  <span class="status-pill status-connected">● {{ sensor.status }}</span>
                </td>
                <td>
                  <div class="cal-date-text">{{ sensor.calibration }}</div>
                  <div :class="['cal-next-text', sensor.urgent ? 'text-warning-bold' : '']">
                    {{ sensor.nextCal }}
                  </div>
                </td>
                <td class="text-right">
                  <button class="btn-atur">Atur</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Aktuator Pompa Air Bar -->
        <div class="actuator-bar">
          <div class="actuator-left">
            <i class="fa-solid fa-bolt pump-icon-fa"></i>
            <span class="actuator-text"
              ><strong>Pompa Air</strong> Dikendalikan otomatis oleh sistem</span
            >
          </div>
          <span class="badge-menyala"
            >● Menyala <i class="fa-solid fa-gear" style="font-size: 10px; margin-left: 2px"></i
          ></span>
        </div>
      </div>

      <!-- Kanan: Kalibrasi Sensor -->
      <div class="card-section">
        <h3 class="section-title calibration-title">Kalibrasi Sensor</h3>

        <!-- Warning Box -->
        <div class="cal-warning-box">
          <div class="warning-icon-box"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div>
            <div class="warning-title">EC / TDS perlu kalibrasi</div>
            <div class="warning-desc">
              Jadwal kalibrasi hari ini. Gunakan larutan standar 1.413 mS/cm agar hasil tetap
              akurat.
            </div>
          </div>
        </div>

        <button @click="handleCalibrate" class="btn-primary full-width mb-24">
          <i class="fa-solid fa-bolt"></i> Mulai Kalibrasi EC / TDS
        </button>

        <div class="history-header">
          <span class="history-title-label">Kalibrasi Terbaru</span>
          <a href="#" class="lihat-semua-link" @click.prevent>Lihat semua</a>
        </div>

        <!-- History Items -->
        <div class="history-item">
          <span class="check-icon-circle"
            ><i class="fa-solid fa-check" style="font-size: 10px"></i
          ></span>
          <div class="history-content">
            <div class="history-name">Sensor pH · Berhasil</div>
            <div class="history-time">9 Sep 2026 · 16:20 WIB</div>
          </div>
        </div>

        <div class="history-item">
          <span class="check-icon-circle"
            ><i class="fa-solid fa-check" style="font-size: 10px"></i
          ></span>
          <div class="history-content">
            <div class="history-name">Sensor Suhu Air · Berhasil</div>
            <div class="history-time">3 Sep 2026 · 09:15 WIB</div>
          </div>
        </div>

        <div class="history-footer-note">
          <span class="info-circle-sm">i</span> Lakukan kalibrasi rutin setiap 30 hari atau setelah
          penggantian sensor.
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

/* Top Header */
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

/* Header Section */
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

/* Metrics Grid */
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

/* Card Section */
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

.mb-4 {
  margin-bottom: 4px;
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

/* Tables */
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

.row-highlight {
  background: #fcfef9;
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

.tag-dipilih {
  color: #558b2f;
  font-weight: 500;
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

.sync-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #555;
}

.sync-icon-fa {
  color: #888;
  font-size: 11px;
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

.table-footer-info {
  font-size: 12px;
  color: #666;
  margin-top: 16px;
}

.float-right {
  float: right;
}

/* Bottom Split Grid */
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

.text-warning-bold {
  color: #d9822b;
  font-weight: 500;
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

/* Actuator Bar */
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

/* Kalibrasi Sensor Panel */
.cal-warning-box {
  background: #fdfae5;
  border: 1px solid #fae199;
  padding: 14px;
  border-radius: 8px;
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.warning-icon-box {
  font-size: 16px;
  color: #f0ad4e;
}

.warning-title {
  font-size: 13px;
  font-weight: bold;
  color: #8a6d3b;
  margin-bottom: 2px;
}

.warning-desc {
  font-size: 12px;
  color: #8a6d3b;
  line-height: 1.4;
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

.lihat-semua-link {
  font-size: 12px;
  color: #93ba39;
  text-decoration: none;
}

.lihat-semua-link:hover {
  text-decoration: underline;
}

.history-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 10px;
}

.check-icon-circle {
  width: 18px;
  height: 18px;
  background: #e5f2cc;
  color: #558b2f;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.history-name {
  font-size: 13px;
  font-weight: 500;
  color: #222;
}

.history-time {
  font-size: 11px;
  color: #666;
  margin-top: 1px;
}

.history-footer-note {
  margin-top: 16px;
  font-size: 11px;
  color: #666;
  display: flex;
  gap: 6px;
  align-items: flex-start;
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
  flex-shrink: 0;
}
</style>
