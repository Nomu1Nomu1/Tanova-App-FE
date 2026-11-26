// Mengubah respons API Tanova AI (snake_case, bentuk bisa bervariasi) menjadi data yang
// dipakai tampilan. Semua fungsi murni (tanpa fetch) supaya mudah dites.
//
// Nama field di bawah masih PERKIRAAN: tiap field dicoba dari beberapa kemungkinan nama.
// Setelah contoh JSON dari backend ada, cukup rapikan daftar nama di sini.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const HEALTHY = /sehat|healthy|normal/i
const PEST = /hama|pest|aphid|kutu|ulat|thrips|tungau|whitefly/i
const DISEASE = /penyakit|disease|busuk|rot|bercak|spot|blight|mildew|jamur|fungus|layu|wilt|burn|defisiensi|deficien/i

/** Ambil nilai pertama yang ada dari beberapa kemungkinan nama field. */
export function pick(obj, keys, fallback) {
  if (obj && typeof obj === 'object') {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
    }
  }
  return fallback
}

/** Ambil daftar dari array langsung atau dari pembungkus seperti { data: { items: [...] } }. */
export function toList(raw, depth = 0) {
  if (Array.isArray(raw)) return raw
  if (!raw || typeof raw !== 'object' || depth > 2) return []
  for (const key of ['items', 'data', 'results', 'rows', 'list', 'records', 'points', 'history', 'diagnoses']) {
    if (raw[key] !== undefined) {
      const list = toList(raw[key], depth + 1)
      if (list.length) return list
    }
  }
  return []
}

/** Teks dari string, array, atau objek (untuk rekomendasi). */
export function toText(v) {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(toText).filter(Boolean).join(' ')
  if (v && typeof v === 'object') return toText(pick(v, ['text', 'description', 'title', 'message', 'recommendation'], ''))
  return ''
}

/** String tanggal / angka (detik atau milidetik) -> milidetik, atau NaN. */
export function parseTime(v) {
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v
  if (typeof v === 'string') return Date.parse(v)
  return NaN
}

const pad = (n) => String(n).padStart(2, '0')

// Waktu WIB (UTC+7) dari milidetik
function wib(ms) {
  const d = new Date(ms + 7 * 3600 * 1000)
  return { d: d.getUTCDate(), m: d.getUTCMonth(), y: d.getUTCFullYear(), hh: pad(d.getUTCHours()), mm: pad(d.getUTCMinutes()), dow: d.getUTCDay() }
}
export const formatTime = (ms) => `${wib(ms).hh}:${wib(ms).mm} WIB`
export function formatStamp(ms) {
  const w = wib(ms)
  return `${w.d} ${MONTHS[w.m]} ${w.y} · ${w.hh}:${w.mm} WIB`
}

/**
 * Data tren pertumbuhan -> { days, thisWeek, lastWeek } dengan nilai 0..1 untuk grafik.
 * 7 titik terakhir = minggu ini, 7 titik sebelumnya = minggu sebelumnya (kalau ada).
 * Mengembalikan null kalau data tidak bisa dipakai.
 */
export function mapGrowth(raw) {
  const rows = toList(raw)
    .map((p) => ({
      t: parseTime(pick(p, ['date', 'recorded_at', 'measured_at', 'created_at', 'timestamp', 'day'])),
      v: Number(pick(p, ['health_score', 'growth_score', 'score', 'height', 'height_cm', 'value'])),
    }))
    .filter((p) => Number.isFinite(p.v))
  if (rows.length < 2) return null
  if (rows.every((r) => Number.isFinite(r.t))) rows.sort((a, b) => a.t - b.t)

  const current = rows.slice(-7)
  const previous = rows.length >= 14 ? rows.slice(-14, -7) : null

  const all = [...current, ...(previous ?? [])].map((r) => r.v)
  const min = Math.min(...all)
  const max = Math.max(...all)
  const norm = (v) => (max === min ? 0.5 : (v - min) / (max - min))

  return {
    days: current.map((r, i) => (Number.isFinite(r.t) ? DAYS[wib(r.t).dow] : DAYS[(i + 1) % 7])),
    thisWeek: current.map((r) => norm(r.v)),
    lastWeek: previous ? previous.map((r) => norm(r.v)) : null,
  }
}

/** Satu diagnosis dari API -> bentuk yang dipakai galeri dan kartu hama/penyakit. */
export function mapDiagnosis(item, assetBase = '') {
  const name = toText(pick(item, ['diagnosis', 'result', 'label', 'condition', 'disease_name', 'name', 'title'], '')) || 'Tidak diketahui'
  const category = String(pick(item, ['category', 'type', 'kind', 'class'], ''))
  const severity = String(pick(item, ['severity', 'status'], ''))

  let conf = Number(pick(item, ['confidence', 'confidence_score', 'accuracy', 'probability']))
  conf = Number.isFinite(conf) ? Math.round(conf <= 1 ? conf * 100 : conf) : null

  const ok = pick(item, ['is_healthy'], false) === true || HEALTHY.test(name) || /^(none|healthy|sehat)$/i.test(severity)

  let kind = 'other'
  if (ok) kind = 'healthy'
  else if (/pest|hama/i.test(category)) kind = 'pest'
  else if (/disease|penyakit/i.test(category)) kind = 'disease'
  else if (/nutrient|leaf_health/i.test(category)) kind = 'disease' // gangguan nutrisi / kesehatan daun
  else if (PEST.test(name)) kind = 'pest'
  else if (DISEASE.test(name)) kind = 'disease'

  let photo = pick(item, ['photo_url', 'image_url', 'photo', 'image', 'picture_url', 'thumbnail_url', 'file_url'], null)
  if (typeof photo !== 'string') photo = null
  else if (!/^https?:/.test(photo)) photo = assetBase + (photo.startsWith('/') ? photo : `/${photo}`)

  const ts = parseTime(pick(item, ['captured_at', 'created_at', 'taken_at', 'timestamp', 'date']))

  return {
    id: pick(item, ['id', 'diagnosis_id', '_id'], null),
    zone: String(pick(item, ['zone', 'zone_name', 'location', 'device_name', 'greenhouse_name'], 'Zona -')),
    name,
    ok,
    kind,
    conf,
    photo,
    advice: toText(pick(item, ['recommendation', 'recommended_actions', 'recommendations', 'advice', 'solution', 'suggestion'], '')),
    ts,
    stamp: Number.isFinite(ts) ? formatStamp(ts) : '',
    time: Number.isFinite(ts) ? formatTime(ts) : '',
  }
}

/** Daftar diagnosis dari API, terbaru di atas. */
export function mapDiagnoses(raw, assetBase = '') {
  const list = toList(raw).map((d) => mapDiagnosis(d, assetBase))
  if (list.length && list.every((d) => Number.isFinite(d.ts))) list.sort((a, b) => b.ts - a.ts)
  return list
}

/** Deteksi terbaru untuk kartu "Prediksi Hama" dan "Prediksi Penyakit" (null kalau belum ada). */
export function mapRisks(list) {
  const card = (title, icon, d) =>
    d && {
      title,
      icon,
      found: `Terdeteksi: ${d.name}`,
      time: d.time || '-',
      zone: d.zone,
      advice: d.advice || 'Belum ada rekomendasi dari AI.',
    }
  return {
    pest: card('Prediksi Hama', 'bug', list.find((d) => d.kind === 'pest')) ?? null,
    disease: card('Prediksi Penyakit', 'sprout', list.find((d) => d.kind === 'disease')) ?? null,
  }
}