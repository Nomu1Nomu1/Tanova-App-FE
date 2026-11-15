// Fungsi pemanggil endpoint grup "Tanova AI".
// Nama parameter di bawah diambil dari dokumentasi OpenAPI (/docs/json).
// Bentuk RESPONS belum didokumentasikan ("Default Response"), jadi pengubah data
// di aiMappers.js masih memakai perkiraan nama field.
import { api, API_ORIGIN } from './api.js'
import { mapDiagnoses, mapGrowth, mapRisks } from './aiMappers.js'

export const aiService = {
  // Grafik tren pertumbuhan. Query: device_id, from, to, limit (bawaan 365), greenhouse_id
  growth: (params) => api('/ai/growth', { query: params }),

  // Prediksi skor kesehatan. Query: device_id, history_days (3-90), days (1-14), greenhouse_id
  prediction: (params) => api('/ai/prediction', { query: { days: 7, ...params } }),

  // Riwayat diagnosis. Query: page, limit, device_id, category, severity, action_status, from, to
  //   category: leaf_health | nutrient | pest | disease | other
  //   severity: none | low | medium | high
  diagnoses: (params) => api('/ai/diagnoses', { query: params }),
  diagnosis: (id) => api(`/ai/diagnoses/${id}`),

  // Rekomendasi AI yang masih pending. Query: device_id, limit (1-50), greenhouse_id
  recommendations: (params) => api('/ai/recommendations', { query: params }),

  // Tandai tindak lanjut: pending | done | dismissed
  setAction: (id, actionStatus) =>
    api(`/ai/diagnoses/${id}/action`, { method: 'PATCH', body: { action_status: actionStatus } }),

  // Kirim foto untuk dianalisis AI (Gemini). Field form: "image" (file) dan device_id.
  // Kalau foto bukan tanaman / terlalu gelap, server membalas saved: false.
  analyze: (file, deviceId) => {
    const form = new FormData()
    form.append('image', file)
    if (deviceId) form.append('device_id', deviceId)
    return api('/ai/analyze', { method: 'POST', body: form })
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