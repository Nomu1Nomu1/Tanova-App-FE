<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../components/Icon.vue'
import { aiService, API_ORIGIN, loadAiOverview } from '../services/aiService.js'
import { formatStamp, mapDiagnosis, mapRisks } from '../services/aiMappers.js'
import foto1 from '../assets/image/1.jpg'
import foto1a from '../assets/image/1a.jpg'
import foto1b from '../assets/image/1b.jpg'

/* ---------- Grafik prediksi pertumbuhan ---------- */
// Data contoh (dipakai sampai data dari server masuk)
const sampleGrowth = {
  days: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  thisWeek: [0.35, 0.4, 0.74, 0.58, 0.57, 0.73, 0.87], // 0 = Rendah, 1 = Tinggi
  lastWeek: [0.35, 0.43, 0.38, 0.5, 0.2, 0.4, 0.6],
}
const growthData = ref(sampleGrowth)

// Lebar grafik mengikuti lebar kartu, supaya tulisan sumbu tidak ikut membesar
const chartWrap = ref(null)
const chartW = ref(470)
let resizeObs
onMounted(() => {
  if (!chartWrap.value || typeof ResizeObserver === 'undefined') return
  resizeObs = new ResizeObserver(([entry]) => {
    chartW.value = Math.max(320, Math.round(entry.contentRect.width))
  })
  resizeObs.observe(chartWrap.value)
})
onBeforeUnmount(() => resizeObs?.disconnect())

const CHART_H = 128
const X0 = 50
const Y_TOP = 14
const Y_BOTTOM = 98
const yLevels = [
  { label: 'Tinggi', y: Y_TOP },
  { label: 'Sedang', y: (Y_TOP + Y_BOTTOM) / 2 },
  { label: 'Rendah', y: Y_BOTTOM },
]

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

const chart = computed(() => {
  const { days, thisWeek, lastWeek } = growthData.value
  const n = days.length
  const width = chartW.value
  const x1 = width - 24
  const xs = days.map((_, i) => X0 + ((x1 - X0) / Math.max(1, n - 1)) * i)
  const toPoints = (vals) =>
    vals.slice(0, n).map((v, i) => ({ x: xs[i], y: Y_BOTTOM - v * (Y_BOTTOM - Y_TOP) }))
  const thisLine = smooth(toPoints(thisWeek))
  return {
    width,
    days,
    xs,
    thisLine,
    lastLine: lastWeek ? smooth(toPoints(lastWeek)) : '',
    thisArea: `${thisLine} L${xs[n - 1]},${Y_BOTTOM} L${xs[0]},${Y_BOTTOM} Z`,
  }
})

/* ---------- Prediksi kebutuhan ---------- */
const needs = [
  { label: 'Volume Air', icon: 'drop', value: '45 L', pct: 72, note: '+12% vs minggu lalu' },
  { label: 'Campuran Nutrisi A', icon: 'flask', value: '120 ml', pct: 42, note: 'Estimasi untuk 7 hari mendatang' },
]

/* ---------- Prediksi hama & penyakit ---------- */
// Data contoh (dipakai sampai data dari server masuk)
const sampleRisks = {
  pest: {
    title: 'Prediksi Hama',
    icon: 'bug',
    found: 'Terdeteksi: Kutu Daun',
    time: '14:20 WIB',
    zone: 'Zona A – Tower 2',
    advice: 'Pisahkan tanaman terdampak, bersihkan kutu pada daun, lalu gunakan pestisida nabati sesuai dosis.',
  },
  disease: {
    title: 'Prediksi Penyakit',
    icon: 'sprout',
    found: 'Terdeteksi: Busuk Akar',
    time: '14:20 WIB',
    zone: 'Zona A – Tower 2',
    advice: 'Periksa akar dan buang bagian yang membusuk. Bersihkan instalasi serta tingkatkan aerasi larutan nutrisi.',
  },
}
const risksData = ref(sampleRisks)
const riskCards = computed(() => [
  risksData.value.pest ?? { title: 'Prediksi Hama', icon: 'bug', found: '' },
  risksData.value.disease ?? { title: 'Prediksi Penyakit', icon: 'sprout', found: '' },
])

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

// Foto contoh dari file lokal. Data dari server memakai foto dari server.
const galleryPhotos = [foto1, foto1a, foto1b]

// 24 gambar contoh relatif terhadap hari ini (8 per hari, urutan terbaru dulu)
const nowMs = Date.now()
const sampleShots = Array.from({ length: 24 }, (_, i) => {
  const r = results[(i * 5 + 1) % results.length]
  const dayOffset = Math.floor(i / 8)
  const d = new Date(nowMs - dayOffset * 86_400_000)
  d.setHours(15 - (i % 8), 20, 0, 0)
  const ts = d.getTime()
  return {
    id: i,
    zone: zones[i % zones.length],
    ...r,
    ts,
    stamp: formatStamp(ts),
    hue: 92 + ((i * 7) % 24),
    photo: galleryPhotos[i % galleryPhotos.length],
  }
})
const shotsData = ref(sampleShots)

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function formatShortDate(ms) {
  const d = new Date(ms)
  return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
const todayLabel = formatShortDate(nowMs)
const chartSubtitle = `Selada Romaine · ${formatShortDate(nowMs - 6 * 86_400_000)} – ${todayLabel}`

/* ---------- Memuat data dari server ---------- */
const loading = ref(true)
const notice = ref('')

onMounted(async () => {
  const { growth, shots, risks, errors } = await loadAiOverview()

  if (growth) growthData.value = growth
  if (shots.length) {
    shotsData.value = shots.map((s, i) => ({ ...s, hue: 92 + ((i * 7) % 24) }))
    risksData.value = risks
  }

  if (errors.some((e) => e.status === 401)) {
    notice.value = 'Belum login ke server, jadi halaman ini menampilkan data contoh.'
  } else if (errors.length) {
    notice.value = `${errors[0].message} Halaman ini menampilkan data contoh.`
  } else if (!growth || !shots.length) {
    notice.value = 'Server belum mengirim data untuk sebagian kartu, kartu itu memakai data contoh.'
  }
  loading.value = false
})

const query = ref('')
const resultFilter = ref('all')
const dateFilter = ref('all')
const newestFirst = ref(true)
const visible = ref(6)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const now = Date.now()
  const startOfToday = new Date().setHours(0, 0, 0, 0)
  const list = shotsData.value.filter((s) => {
    const matchText = !q || s.zone.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    const matchResult =
      resultFilter.value === 'all' || (resultFilter.value === 'ok' ? s.ok : !s.ok)
    let matchDate = true
    if (dateFilter.value !== 'all' && Number.isFinite(s.ts)) {
      if (dateFilter.value === 'today') matchDate = s.ts >= startOfToday
      else if (dateFilter.value === '7d') matchDate = s.ts >= now - 7 * 86_400_000
      else if (dateFilter.value === '30d') matchDate = s.ts >= now - 30 * 86_400_000
    }
    return matchText && matchResult && matchDate
  })
  return newestFirst.value ? list : [...list].reverse()
})
const shown = computed(() => filtered.value.slice(0, visible.value))

/* ---------- Upload foto tanaman & diagnosis ---------- */
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // sesuai MAX_UPLOAD_MB backend (5 MB)

const fileInput = ref(null)
const uploading = ref(false)
const uploadError = ref('')
const uploadResult = ref(null)
let previewObjectUrl = null

const canUpload = computed(() => {
  try {
    const role = JSON.parse(localStorage.getItem('tanova_user') || '{}')?.role
    return role !== 'viewer'
  } catch {
    return true
  }
})

function revokePreview() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl)
    previewObjectUrl = null
  }
}

function clearUpload() {
  revokePreview()
  uploadResult.value = null
  uploadError.value = ''
}

onBeforeUnmount(revokePreview)

function resolvePhotoUrl(url, fallback) {
  if (!url) return fallback
  return /^https?:/.test(url) ? url : `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`
}

async function onFileSelected(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file || uploading.value) return

  uploadError.value = ''
  if (!canUpload.value) {
    uploadError.value = 'Akun viewer tidak memiliki izin untuk mengunggah foto.'
    return
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    uploadError.value = 'Format foto harus JPG, PNG, atau WebP.'
    return
  }
  if (file.size === 0 || file.size > MAX_BYTES) {
    uploadError.value = 'Ukuran foto maksimal 5 MB dan tidak boleh kosong.'
    return
  }

  revokePreview()
  previewObjectUrl = URL.createObjectURL(file)
  uploading.value = true

  try {
    const res = await aiService.analyze(file)
    const photo = resolvePhotoUrl(res.image_url, previewObjectUrl)

    if (res.saved === false || res.is_plant === false) {
      uploadResult.value = {
        saved: false,
        photo,
        title: 'Bukan Tanaman',
        ok: false,
        conf: null,
        plant: '-',
        advice: res.message || 'Foto tidak dapat dikenali sebagai tanaman.',
      }
      return
    }

    const mapped = mapDiagnosis(res, API_ORIGIN)
    uploadResult.value = {
      saved: true,
      photo: mapped.photo || photo,
      title: mapped.name,
      ok: mapped.ok,
      conf: mapped.conf,
      plant: res.ai_result?.plant || res.details?.plant || '-',
      advice: mapped.advice || res.recommendation || 'Tidak ada rekomendasi tambahan.',
    }
    shotsData.value = [{ ...mapped, hue: 96 }, ...shotsData.value.filter((s) => typeof s.id === 'string')]
    risksData.value = mapRisks(shotsData.value)
  } catch (err) {
    uploadError.value = err.message || 'Gagal menganalisis foto tanaman.'
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="page">
    <section class="head">
      <div>
        <h1>Tanova AI</h1>
        <p>Pantau pertumbuhan, prediksi kebutuhan, dan deteksi kesehatan tanaman.</p>
      </div>
      <div class="head__actions">
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          @change="onFileSelected"
        />
        <button
          type="button"
          class="btn btn--solid"
          :disabled="uploading || !canUpload"
          :title="canUpload ? 'Maks 5 MB (JPG, PNG, WebP)' : 'Hanya admin atau operator yang dapat mengunggah'"
          @click="fileInput?.click()"
        >
          <Icon name="leaf" />
          {{ uploading ? 'Menganalisis…' : 'Upload Foto Tanaman' }}
        </button>
        <button type="button" class="btn btn--ghost">
          <Icon name="calendar" />
          {{ todayLabel }}
        </button>
      </div>
    </section>

    <p v-if="uploadError" class="notice notice--err" role="alert">{{ uploadError }}</p>

    <section v-if="uploadResult" class="card upload-res">
      <img :src="uploadResult.photo" :alt="uploadResult.title" class="upload-res__img" />
      <div class="upload-res__body">
        <div class="upload-res__top">
          <div>
            <h3>{{ uploadResult.title }}</h3>
            <small>Tanaman: {{ uploadResult.plant }}</small>
          </div>
          <div class="upload-res__tags">
            <span class="tag" :class="uploadResult.ok ? 'tag--ok' : 'tag--bad'">
              {{ uploadResult.saved ? (uploadResult.ok ? 'Sehat' : 'Terdeteksi Masalah') : 'Tidak Disimpan' }}
            </span>
            <span v-if="uploadResult.conf != null" class="pill pill--soft">{{ uploadResult.conf }}%</span>
            <button type="button" class="upload-res__close" aria-label="Tutup hasil" @click="clearUpload">×</button>
          </div>
        </div>
        <p class="advice">{{ uploadResult.advice }}</p>
      </div>
    </section>

    <p v-if="loading" class="notice notice--load" role="status">Memuat data dari server…</p>
    <p v-else-if="notice" class="notice" role="status">{{ notice }}</p>

    <!-- Baris 1: grafik + kebutuhan -->
    <section class="row row--chart">
      <article class="card panel">
        <div class="panel__head">
          <div>
            <h3>Prediksi Pertumbuhan</h3>
            <p>{{ chartSubtitle }}</p>
          </div>
          <span class="pill pill--soft pill--trend">Tren meningkat</span>
        </div>

        <div ref="chartWrap" class="chart-wrap">
        <svg
          class="chart"
          :viewBox="`0 0 ${chart.width} ${CHART_H}`"
          :height="CHART_H"
          role="img"
          aria-label="Grafik prediksi pertumbuhan Selada Romaine, tren meningkat sepanjang minggu"
        >
          <g v-for="l in yLevels" :key="l.label">
            <line :x1="X0 - 6" :x2="chart.width - 4" :y1="l.y" :y2="l.y" class="grid" />
            <text x="0" :y="l.y + 3" class="axis">{{ l.label }}</text>
          </g>
          <path :d="chart.thisArea" class="area" />
          <path v-if="chart.lastLine" :d="chart.lastLine" class="line line--last" />
          <path :d="chart.thisLine" class="line line--this" />
          <text v-for="(d, i) in chart.days" :key="i" :x="chart.xs[i]" y="120" text-anchor="middle" class="axis">{{ d }}</text>
        </svg>
        </div>

        <div class="legend">
          <span><i class="sw sw--this"></i>Prediksi minggu ini</span>
          <span v-if="chart.lastLine"><i class="sw sw--last"></i>Minggu sebelumnya</span>
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
      <article v-for="r in riskCards" :key="r.title" class="card risk">
        <div class="risk__head">
          <h3><Icon :name="r.icon" />{{ r.title }}</h3>
          <small>Analisis terakhir</small>
        </div>
        <template v-if="r.found">
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
        </template>
        <p v-else class="advice">Belum ada deteksi terbaru.</p>
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
        <label class="tool">
          <Icon name="calendar" />
          <select v-model="dateFilter" aria-label="Filter tanggal">
            <option value="all">Semua tanggal</option>
            <option value="today">Hari ini</option>
            <option value="7d">7 hari terakhir</option>
            <option value="30d">30 hari terakhir</option>
          </select>
        </label>
        <button type="button" class="tool" @click="newestFirst = !newestFirst">
          {{ newestFirst ? 'Terbaru ↓' : 'Terlama ↑' }}
        </button>
      </div>

      <div v-if="shown.length" class="shots">
        <article v-for="s in shown" :key="s.id" class="shot">
          <div class="shot__img" :style="{ '--h': s.hue }">
            <img v-if="s.photo" :src="s.photo" :alt="`Foto tanaman ${s.zone}, hasil: ${s.name}`" class="shot__photo" loading="lazy" />
            <Icon v-else name="leaf" class="shot__leaf" />
            <span class="shot__zone">{{ s.zone }}</span>
          </div>
          <div class="shot__body">
            <div>
              <b>{{ s.name }}</b>
              <small>{{ s.stamp }}</small>
            </div>
            <span v-if="s.conf != null" class="tag" :class="s.ok ? 'tag--ok' : 'tag--bad'">{{ s.conf }}%</span>
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
  max-width: none;
}

.notice {
  margin: 0;
  padding: 10px 14px;
  font-size: 11px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #f3dc8f;
  border-radius: 8px;
}
.notice--load {
  color: var(--muted);
  background: var(--green-50);
  border-color: var(--line);
}
.notice--err {
  color: var(--red-text);
  background: #fde0e0;
  border-color: #f5bcbc;
}
.upload-res {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 14px;
}
.upload-res__img {
  width: 112px;
  height: 112px;
  flex: none;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid var(--line);
}
.upload-res__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.upload-res__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}
.upload-res__top h3 {
  margin: 0;
  font-size: 14px;
  color: var(--green-900);
}
.upload-res__top small {
  font-size: 10px;
  color: var(--muted);
}
.upload-res__tags {
  display: flex;
  align-items: center;
  gap: 6px;
}
.upload-res__close {
  border: 0;
  background: transparent;
  font-size: 16px;
  line-height: 1;
  color: var(--muted);
  cursor: pointer;
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
.chart-wrap {
  width: 100%;
  margin-top: 4px;
}
.chart {
  display: block;
  width: 100%;
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
.shot__photo {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
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