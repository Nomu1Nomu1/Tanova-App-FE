<script setup>
import { computed, ref } from 'vue'
import Icon from '../components/Icon.vue'
import AddAlertModal from '../components/AddAlertModal.vue'

const props = defineProps({
  mode: { type: String, default: 'Otomatis' },
})

const isManual = computed(() => props.mode === 'Manual')

// Pompa air bisa dinyalakan/dimatikan hanya di mode manual
const pumpOn = ref(true)

// Slider kontrol sensor (tampil di mode manual)
const controls = ref([
  { name: 'Sensor pH', value: 5, min: 0, max: 10, step: 1, decimals: 0, unit: 'pH' },
  { name: 'Sensor EC/TDS', value: 1.42, min: 0, max: 2.84, step: 0.01, decimals: 2, unit: 'mS/cm' },
  { name: 'Sensor Suhu', value: 30, min: 0, max: 60, step: 1, decimals: 0, unit: '°C' },
])

function pct(c) {
  return `${((c.value - c.min) / (c.max - c.min)) * 100}%`
}

const metrics = [
  { label: 'pH Larutan', value: '3.2', unit: 'pH', icon: 'drop', note: 'Target 5.8–6.2 · Stabil' },
  { label: 'EC / TDS', value: '1.42', unit: 'mS/cm', icon: 'activity', note: 'Target 1.3–1.5 · Konsisten' },
  { label: 'Suhu Air', value: '32', unit: '°C', icon: 'thermo', note: 'Target 20–24 °C · Stabil' },
  { label: 'Level Tangki', value: '82', unit: '%', icon: 'tank', note: 'Target ≥ 75% · Aman' },
]

const sensors = [
  { name: 'Sensor pH', date: 'Kalibrasi terakhir: 9 September 2026' },
  { name: 'Sensor EC/TDS', date: 'Kalibrasi terakhir: 1 September 2026' },
  { name: 'Sensor DHT22', date: 'Kalibrasi terakhir: 3 September 2026' },
]

const alerts = ref([
  { text: 'Suhu air 32°C', badge: 'Warning', type: 'warning', icon: 'warn' },
  { text: 'pH terlalu rendah', badge: 'Alert', type: 'alert', icon: 'info' },
  { text: 'Level tangki sudah aman', badge: 'OK', type: 'ok', icon: 'bell' },
])

// Modal Tambah Peringatan
const showAlertModal = ref(false)
const levelMap = {
  info: { type: 'ok', badge: 'Info', icon: 'info' },
  warning: { type: 'warning', badge: 'Warning', icon: 'warn' },
  critical: { type: 'alert', badge: 'Alert', icon: 'info' },
}

function addAlert(data) {
  const l = levelMap[data.level]
  alerts.value.unshift({ text: data.name, badge: l.badge, type: l.type, icon: l.icon })
  showAlertModal.value = false
}

const logs = [
  { text: 'AI Mendeteksi Gambar', date: '10 Oktober 2026' },
  { text: 'AI Mendeteksi Gambar', date: '10 Oktober 2026' },
  { text: 'AI Mendeteksi Gambar', date: '10 Oktober 2026' },
  { text: 'AI Mendeteksi Gambar', date: '10 Oktober 2026' },
]

const recommendations = [
  'Pastikan pH larutan stabil antara 5.8–6.2.',
  'Periksa debit pompa dan level tangki nutrisi.',
  'Pantau kesehatan akar dan kelembapan greenhouse.',
]
</script>

<template>
  <div class="page">
    <section class="head">
      <div>
        <h1>Dashboard Device</h1>
        <p>Senin, 10 September 2026 · Update terakhir: 08:42 WIB · Selada</p>
      </div>
      <div class="head__actions">
        <button type="button" class="btn btn--ghost">
          <Icon name="calendar" />
          10 Sep 2026
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
          <i class="chip"><Icon :name="m.icon" /></i>
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
          <span class="pill pill--soft">1 Aktif</span>
        </div>

        <div class="item item--lg">
          <span class="item__left">
            <Icon name="drop" />
            <b>Pompa Air</b>
          </span>
          <button
            v-if="isManual"
            type="button"
            class="pill pill-btn"
            :class="pumpOn ? 'pill--on' : 'pill--off'"
            :aria-pressed="pumpOn"
            @click="pumpOn = !pumpOn"
          >
            {{ pumpOn ? 'ON' : 'OFF' }}
          </button>
          <span v-else class="pill pill--on">ON</span>
        </div>

        <h4>Kalibrasi Sensor</h4>
        <template v-if="isManual">
          <div v-for="c in controls" :key="c.name" class="item item--slider">
            <Icon name="tank" />
            <label class="slider__wrap">
              <b>{{ c.name }}</b>
              <input
                v-model.number="c.value"
                class="slider"
                type="range"
                :min="c.min"
                :max="c.max"
                :step="c.step"
                :style="{ '--pct': pct(c) }"
                :aria-label="c.name"
              />
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
            <b class="ok">OK</b>
          </div>
        </template>
      </article>

      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Peringatan &amp; Notifikasi</h3>
            <p>1 warning · 1 critical</p>
          </div>
          <span class="pill pill--soft">1 Notifikasi</span>
        </div>

        <div v-for="a in alerts" :key="a.text" class="alert" :class="`alert--${a.type}`">
          <span class="item__left">
            <Icon :name="a.icon" />
            <b>{{ a.text }}</b>
          </span>
          <span class="badge">{{ a.badge }}</span>
        </div>

        <h4>Tanaman di Hidroponik</h4>
        <div class="plant">
          <Icon name="leaf" />
          <b>Selada Romaine</b>
          <small>45 hari tanam</small>
        </div>
      </article>
    </section>

    <!-- Baris 3 -->
    <section class="row">
      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Log Aktivitas &amp; Telemetri</h3>
            <p>0 entri terbaru</p>
          </div>
          <button type="button" class="btn btn--tiny">
            <Icon name="download" />
            Ekspor CSV
          </button>
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
          <button type="button" class="btn btn--tiny">
            <Icon name="history" />
            Riwayat
          </button>
        </div>

        <div class="diag">
          <div class="diag__img">
            <Icon name="leaf" />
          </div>
          <div class="diag__info">
            <div class="diag__title">
              <b>Tip Burn (Defisiensi Kalsium)</b>
              <span class="pill pill--orange">Sedang</span>
            </div>
            <div class="diag__conf">
              <span>Confidence</span><b>87.3%</b>
            </div>
            <div class="bar"><i style="width: 87.3%"></i></div>
            <small>Tanaman: Selada Romaine · Zona 1 · 08:35 WIB</small>
          </div>
        </div>

        <h4>Rekomendasi AI</h4>
        <ul class="reco">
          <li v-for="r in recommendations" :key="r">{{ r }}</li>
        </ul>
      </article>
    </section>

    <AddAlertModal v-if="showAlertModal" @close="showAlertModal = false" @save="addAlert" />
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
</style>