// Pemanggil endpoint grup "Tanova AI".
//
// Disamakan dengan file API milik teman FE:
//  - alamat server yang sama (/api/v1)
//  - token dibaca dari localStorage dengan kunci 'tanova_token'
// Supaya tidak ada dua file api.js yang bentrok, pemanggil dasarnya (request) ditulis di sini.
// TODO: kalau file API teman nanti mengekspor fungsi request, ganti request di bawah dengan itu.
//
// Nama parameter diambil dari dokumentasi OpenAPI (/docs/json). Bentuk RESPONS belum
// didokumentasikan ("Default Response"), jadi aiMappers.js masih memakai perkiraan nama field.
import { mapDiagnoses, mapGrowth, mapRisks } from './aiMappers.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://tanova-backend.onrender.com/api/v1'
const TOKEN_KEY = 'tanova_token'
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(path, { method = 'GET', query, body, timeout = 60000 } = {}) {
  const url = new URL(API_BASE_URL + path, window.location.origin)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }

  const headers = { Accept: 'application/json' }
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body // browser mengatur Content-Type sendiri
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  // Server gratis (Render) bisa "tidur", permintaan pertama bisa lambat.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)

  try {
    const res = await fetch(url, { method, headers, body: payload, signal: ctrl.signal })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    if (!res.ok) throw new ApiError(data?.message ?? data?.detail ?? res.statusText, res.status, data)
    return data
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (err.name === 'AbortError') throw new ApiError('Server terlalu lama merespons. Coba lagi.', 0)
    throw new ApiError('Tidak bisa terhubung ke server.', 0)
  } finally {
    clearTimeout(timer)
  }
}

export const aiService = {
  // Grafik tren pertumbuhan. Query: device_id, from, to, limit (bawaan 365), greenhouse_id
  growth: (params) => request('/ai/growth', { query: params }),

  // Prediksi skor kesehatan. Query: device_id, history_days (3-90), days (1-14), greenhouse_id
  prediction: (params) => request('/ai/prediction', { query: { days: 7, ...params } }),

  // Riwayat diagnosis. Query: page, limit, device_id, category, severity, action_status, from, to
  //   category: leaf_health | nutrient | pest | disease | other
  //   severity: none | low | medium | high
  diagnoses: (params) => request('/ai/diagnoses', { query: params }),
  diagnosis: (id) => request(`/ai/diagnoses/${id}`),

  // Rekomendasi AI yang masih pending. Query: device_id, limit (1-50), greenhouse_id
  recommendations: (params) => request('/ai/recommendations', { query: params }),

  // Tandai tindak lanjut: pending | done | dismissed
  setAction: (id, actionStatus) =>
    request(`/ai/diagnoses/${id}/action`, { method: 'PATCH', body: { action_status: actionStatus } }),

  // Kirim foto untuk dianalisis AI (Gemini). Field form: "image" (file) dan device_id.
  // Kalau foto bukan tanaman / terlalu gelap, server membalas saved: false.
  analyze: (file, deviceId) => {
    const form = new FormData()
    form.append('image', file)
    if (deviceId) form.append('device_id', deviceId)
    return request('/ai/analyze', { method: 'POST', body: form })
  },
}

/**
 * Memuat data halaman Tanova AI sekaligus. Bagian yang gagal tidak membuat bagian lain gagal.
 * Mengembalikan { growth, shots, risks, errors }.
 */
export async function loadAiOverview() {
  const [g, d] = await Promise.allSettled([aiService.growth(), aiService.diagnoses({ limit: 24 })])

  // Saat pengembangan, bentuk asli respons dicetak di Console (F12) untuk mencocokkan nama field.
  if (import.meta.env.DEV) {
    console.debug('[Tanova AI] respons /ai/growth', g.status === 'fulfilled' ? g.value : g.reason)
    console.debug('[Tanova AI] respons /ai/diagnoses', d.status === 'fulfilled' ? d.value : d.reason)
  }

  const errors = [g, d].filter((r) => r.status === 'rejected').map((r) => r.reason)
  const growth = g.status === 'fulfilled' ? mapGrowth(g.value) : null
  const shots = d.status === 'fulfilled' ? mapDiagnoses(d.value, API_ORIGIN) : []

  return { growth, shots, risks: mapRisks(shots), errors }
}