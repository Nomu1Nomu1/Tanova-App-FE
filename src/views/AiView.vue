<script setup>
import { computed, ref } from 'vue'
import Icon from '../components/Icon.vue'

/* ---------- Grafik prediksi pertumbuhan ---------- */
const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const thisWeek = [0.35, 0.4, 0.74, 0.58, 0.57, 0.73, 0.87] // 0 = Rendah, 1 = Tinggi
const lastWeek = [0.35, 0.43, 0.38, 0.5, 0.2, 0.4, 0.6]

const X0 = 50
const X1 = 450
const Y_TOP = 14
const Y_BOTTOM = 98
const yLevels = [
  { label: 'Tinggi', y: Y_TOP },
  { label: 'Sedang', y: (Y_TOP + Y_BOTTOM) / 2 },
  { label: 'Rendah', y: Y_BOTTOM },
]

const xs = days.map((_, i) => X0 + ((X1 - X0) / (days.length - 1)) * i)
const toPoints = (vals) => vals.map((v, i) => ({ x: xs[i], y: Y_BOTTOM - v * (Y_BOTTOM - Y_TOP) }))

// Kurva halus (Catmull-Rom -> Bezier)
function smooth(pts) {
  let d = `M${pts[0].x},${pts[0].y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`
  }
  return d
}

const thisLine = smooth(toPoints(thisWeek))
const lastLine = smooth(toPoints(lastWeek))
const thisArea = `${thisLine} L${X1},${Y_BOTTOM} L${X0},${Y_BOTTOM} Z`

/* ---------- Prediksi kebutuhan ---------- */
const needs = [
  { label: 'Volume Air', icon: 'drop', value: '45 L', pct: 72, note: '+12% vs minggu lalu' },
  { label: 'Campuran Nutrisi A', icon: 'flask', value: '120 ml', pct: 42, note: 'Estimasi untuk 7 hari mendatang' },
]

/* ---------- Prediksi hama & penyakit ---------- */
const risks = [
  {
    title: 'Prediksi Hama',
    icon: 'bug',
    found: 'Terdeteksi: Kutu Daun',
    time: '14:20 WIB',
    zone: 'Zona A – Tower 2',
    advice: 'Pisahkan tanaman terdampak, bersihkan kutu pada daun, lalu gunakan pestisida nabati sesuai dosis.',
  },
  {
    title: 'Prediksi Penyakit',
    icon: 'sprout',
    found: 'Terdeteksi: Busuk Akar',
    time: '14:20 WIB',
    zone: 'Zona A – Tower 2',
    advice: 'Periksa akar dan buang bagian yang membusuk. Bersihkan instalasi serta tingkatkan aerasi larutan nutrisi.',
  },
]

/* ---------- Galeri gambar (data contoh) ---------- */
const zones = ['Zona A · Tower 2', 'Zona A · Tower 2', 'Zona A · Tower 1', 'Zona B · Tower 1', 'Zona B · Tower 2', 'Zona C · Tower 1']
const results = [
  { name: 'Sehat', ok: true, conf: 96 },
  { name: 'Sehat', ok: true, conf: 93 },
  { name: 'Kutu Daun', ok: false, conf: 88 },
  { name: 'Sehat', ok: true, conf: 95 },
  { name: 'Busuk Akar', ok: false, conf: 81 },
  { name: 'Tip Burn', ok: false, conf: 87 },
]

// 24 gambar, 8 per hari (10, 9, 8 Okt), urutan terbaru dulu
const shots = Array.from({ length: 24 }, (_, i) => {
  const r = results[(i * 5 + 1) % results.length]
  return {
    id: i,
    zone: zones[i % zones.length],
    ...r,
    stamp: `${10 - Math.floor(i / 8)} Okt 2026 · ${String(15 - (i % 8)).padStart(2, '0')}:20 WIB`,
    hue: 92 + ((i * 7) % 24),
  }
})

const query = ref('')
const resultFilter = ref('all')
const newestFirst = ref(true)
const visible = ref(6)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = shots.filter((s) => {
    const matchText = !q || s.zone.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    const matchResult =
      resultFilter.value === 'all' || (resultFilter.value === 'ok' ? s.ok : !s.ok)
    return matchText && matchResult
  })
  return newestFirst.value ? list : [...list].reverse()
})
const shown = computed(() => filtered.value.slice(0, visible.value))
</script>

<template>
  <div class="page">
    <section class="head">
      <div>
        <h1>Tanova AI</h1>
        <p>Pantau pertumbuhan, prediksi kebutuhan, dan deteksi kesehatan tanaman.</p>
      </div>
      <div class="head__actions">
        <button type="button" class="btn btn--ghost">
          <Icon name="calendar" />
          10 Okt 2026
        </button>
      </div>
    </section>

    <!-- Baris 1: grafik + kebutuhan -->
    <section class="row row--chart">
      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Prediksi Pertumbuhan</h3>
            <p>Selada Romaine · 5–11 Oktober 2026</p>
          </div>
          <span class="pill pill--soft pill--trend">Tren meningkat</span>
        </div>

        <svg
          class="chart"
          viewBox="0 0 470 128"
          role="img"
          aria-label="Grafik prediksi pertumbuhan Selada Romaine, tren meningkat sepanjang minggu"
        >
          <g v-for="l in yLevels" :key="l.label">
            <line :x1="X0 - 6" :x2="X1 + 20" :y1="l.y" :y2="l.y" class="grid" />
            <text x="0" :y="l.y + 3" class="axis">{{ l.label }}</text>
          </g>
          <path :d="thisArea" class="area" />
          <path :d="lastLine" class="line line--last" />
          <path :d="thisLine" class="line line--this" />
          <text v-for="(d, i) in days" :key="d" :x="xs[i]" y="120" text-anchor="middle" class="axis">{{ d }}</text>
        </svg>

        <div class="legend">
          <span><i class="sw sw--this"></i>Prediksi minggu ini</span>
          <span><i class="sw sw--last"></i>Minggu sebelumnya</span>
        </div>
      </article>

      <article class="card panel">
        <h3 class="with-icon"><Icon name="sprout" />Prediksi Kebutuhan</h3>
        <p class="lead">Tanova AI akan memprediksi kebutuhan hidroponikmu berdasarkan laju pertumbuhan saat ini.</p>

        <div v-for="n in needs" :key="n.label" class="need">
          <div class="need__top">
            <span><Icon :name="n.icon" />{{ n.label }}</span>
            <b>{{ n.value }}</b>
          </div>
          <div class="meter"><i :style="{ width: n.pct + '%' }"></i></div>
          <small>{{ n.note }}</small>
        </div>
      </article>
    </section>

    <!-- Baris 2: hama & penyakit -->
    <section class="risks">
      <article v-for="r in risks" :key="r.title" class="card risk">
        <div class="risk__head">
          <h3><Icon :name="r.icon" />{{ r.title }}</h3>
          <small>Analisis terakhir</small>
        </div>
        <div class="found">
          <span>{{ r.found }}</span>
          <Icon name="warnFill" />
        </div>
        <dl class="meta">
          <div><dt>Waktu</dt><dd>{{ r.time }}</dd></div>
          <div><dt>Zona</dt><dd>{{ r.zone }}</dd></div>
        </dl>
        <h4>Rekomendasi Penyelesaian</h4>
        <p class="advice">{{ r.advice }}</p>
      </article>
    </section>

    <!-- Baris 3: galeri -->
    <section class="card gallery">
      <div class="panel__head">
        <div>
          <h3>Galeri Gambar Tanaman</h3>
          <p>Riwayat pengambilan kamera dan ringkasan hasil deteksi AI.</p>
        </div>
        <span class="pill pill--soft">{{ filtered.length }} gambar</span>
      </div>

      <div class="tools">
        <label class="search">
          <Icon name="search" />
          <input v-model="query" type="text" placeholder="Cari zona atau hasil deteksi..." />
        </label>
        <label class="tool">
          <Icon name="filter" />
          <select v-model="resultFilter" aria-label="Filter hasil">
            <option value="all">Semua hasil</option>
            <option value="ok">Sehat</option>
            <option value="issue">Terdeteksi masalah</option>
          </select>
        </label>
        <button type="button" class="tool">
          <Icon name="calendar" />
          8–10 Okt 2026
        </button>
        <button type="button" class="tool" @click="newestFirst = !newestFirst">
          {{ newestFirst ? 'Terbaru ↓' : 'Terlama ↑' }}
        </button>
      </div>

      <div v-if="shown.length" class="shots">
        <article v-for="s in shown" :key="s.id" class="shot">
          <div class="shot__img" :style="{ '--h': s.hue }">
            <span class="shot__zone">{{ s.zone }}</span>
            <Icon name="leaf" class="shot__leaf" />
          </div>
          <div class="shot__body">
            <div>
              <b>{{ s.name }}</b>
              <small>{{ s.stamp }}</small>
            </div>
            <span class="tag" :class="s.ok ? 'tag--ok' : 'tag--bad'">{{ s.conf }}%</span>
          </div>
        </article>
      </div>
      <p v-else class="empty">Tidak ada gambar yang cocok dengan pencarianmu.</p>

      <button
        v-if="shown.length < filtered.length"
        type="button"
        class="btn btn--ghost more"
        @click="visible += 6"
      >
        Muat lebih banyak
      </button>
    </section>
  </div>
</template>

<style scoped>
.head p {
  max-width: 60ch;
}

.row.row--chart {
  grid-template-columns: 2.1fr 1fr;
}

.panel h3.with-icon {
  display: flex;
  align-items: center;
  gap: 6px;
}
.with-icon .icon {
  width: 14px;
  height: 14px;
  color: var(--green-700);
}
.pill--trend {
  align-self: flex-start;
  color: var(--green-700);
}

/* ---------- Grafik ---------- */
.chart {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 4px;
}
.grid {
  stroke: #e8ecdc;
  stroke-width: 1;
}
.axis {
  font-size: 9.5px;
  fill: var(--muted);
}
.area {
  fill: #eaf3d3;
  opacity: 0.8;
}
.line {
  fill: none;
  stroke-linecap: round;
}
.line--this {
  stroke: #4f7a28;
  stroke-width: 2.2;
}
.line--last {
  stroke: #a9c27a;
  stroke-width: 1.6;
  stroke-dasharray: 5 4;
}
.legend {
  display: flex;
  justify-content: center;
  gap: 22px;
  margin-top: 6px;
  font-size: 10px;
  color: var(--muted);
}
.legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sw {
  width: 16px;
  height: 0;
  border-top: 2px solid;
}
.sw--this {
  border-color: #4f7a28;
}
.sw--last {
  border-color: #a9c27a;
}

/* ---------- Prediksi kebutuhan ---------- */
.lead {
  font-size: 10.5px;
  line-height: 1.45;
  color: var(--muted);
}
.need {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: #f7f8f4;
  border: 1px solid #e4e8d9;
  border-radius: 10px;
}
.need__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 10.5px;
  color: var(--muted);
}
.need__top span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.need__top .icon {
  width: 13px;
  height: 13px;
  color: var(--green-900);
}
.need__top b {
  font-size: 14px;
  font-weight: 700;
  color: var(--green-900);
}
.meter {
  height: 5px;
  background: #e4e8d9;
  border-radius: 999px;
  overflow: hidden;
}
.meter i {
  display: block;
  height: 100%;
  background: var(--green-900);
  border-radius: 999px;
}
.need small {
  align-self: flex-end;
  font-size: 9.5px;
  color: var(--muted);
}

/* ---------- Hama & penyakit ---------- */
.risks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.risk {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px 18px;
  border-top: 4px solid #e03a3a;
}
.risk__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.risk h3 {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--green-900);
}
.risk h3 .icon {
  width: 14px;
  height: 14px;
  color: #d93a3a;
}
.risk__head small {
  font-size: 10px;
  color: var(--muted);
}
.found {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 12px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--red-text);
  background: #fde0e0;
  border-radius: 8px;
}
.found .icon {
  width: 14px;
  height: 14px;
}
.meta {
  display: flex;
  gap: 36px;
  margin: 2px 0 0;
}
.meta dt {
  font-size: 10px;
  color: var(--muted);
}
.meta dd {
  margin: 2px 0 0;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--green-900);
}
.risk h4 {
  margin-top: 4px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--green-900);
}
.advice {
  font-size: 10px;
  line-height: 1.5;
  color: var(--muted);
}

/* ---------- Galeri ---------- */
.gallery {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 16px;
}
.tools {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.search,
.tool {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  font: inherit;
  font-size: 10.5px;
  color: var(--text);
  background: #fff;
  border: 1px solid #dfe5d2;
  border-radius: 8px;
}
.search {
  flex: 1;
  min-width: 200px;
}
.search input,
.tool select {
  font: inherit;
  font-size: 10.5px;
  color: var(--text);
  background: transparent;
  border: 0;
  outline: none;
}
.search input {
  flex: 1;
  min-width: 0;
}
.search input::placeholder {
  color: var(--muted);
}
.tool select {
  cursor: pointer;
}
button.tool {
  cursor: pointer;
}
button.tool:hover,
.tool:hover {
  background: var(--green-50);
}
.search:focus-within,
.tool:focus-within {
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(147, 186, 57, 0.2);
}
.search .icon,
.tool .icon {
  width: 13px;
  height: 13px;
  color: var(--green-900);
}

.shots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.shot {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e6ebdb;
  border-radius: 12px;
}
.shot__img {
  position: relative;
  display: grid;
  place-items: center;
  height: 110px;
  background: linear-gradient(135deg, hsl(var(--h) 38% 34%), hsl(calc(var(--h) + 18) 42% 52%));
}
.shot__leaf {
  width: 38px;
  height: 38px;
  color: rgba(255, 255, 255, 0.35);
}
.shot__zone {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 3px 9px;
  font-size: 9px;
  color: var(--green-900);
  background: #fff;
  border-radius: 999px;
}
.shot__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
}
.shot__body b {
  display: block;
  font-size: 11px;
  color: var(--green-900);
}
.shot__body small {
  display: block;
  margin-top: 2px;
  font-size: 9px;
  color: var(--muted);
}
.tag {
  padding: 3px 8px;
  font-size: 9px;
  font-weight: 700;
  border-radius: 999px;
}
.tag--ok {
  color: var(--green-900);
  background: var(--green-100);
}
.tag--bad {
  color: var(--red-text);
  background: #fde0e0;
}
.empty {
  padding: 24px 0;
  font-size: 11px;
  text-align: center;
  color: var(--muted);
}
.more {
  align-self: center;
}

@media (max-width: 1100px) {
  .shots {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 860px) {
  .row.row--chart,
  .risks {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .shots {
    grid-template-columns: 1fr;
  }
}
</style>