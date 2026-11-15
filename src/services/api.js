// Klien API sederhana untuk backend Tanova (Fastify, semua field snake_case).
// Alamat dasar diambil dari file .env.local:  VITE_API_BASE_URL=https://tanova-backend.onrender.com/api/v1
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://tanova-backend.onrender.com/api/v1'

// Alamat server tanpa /api/v1 (dipakai untuk foto dengan alamat relatif)
export const API_ORIGIN = new URL(BASE_URL, window.location.origin).origin

// Samakan nama kunci ini dengan yang dipakai halaman login (kesepakatan tim).
const TOKEN_KEY = 'tanova_access_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY)

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * api('/ai/growth', { query: { days: 7 } })
 * api('/ai/analyze', { method: 'POST', body: formData })   // upload foto
 */
export async function api(path, { method = 'GET', query, body, signal, timeout = 60000 } = {}) {
  const url = new URL(BASE_URL + path, window.location.origin)
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }

  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (body instanceof FormData) {
    payload = body // browser mengatur Content-Type sendiri
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  // Server gratis (Render) bisa "tidur", permintaan pertama bisa lambat, jadi timeout dibuat panjang.
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  signal?.addEventListener('abort', () => ctrl.abort())

  try {
    const res = await fetch(url, { method, headers, body: payload, signal: ctrl.signal })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null

    if (!res.ok) {
      if (res.status === 401) window.dispatchEvent(new Event('tanova:unauthorized'))
      throw new ApiError(data?.message ?? data?.error ?? res.statusText, res.status, data)
    }
    return data
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('Server terlalu lama merespons. Coba lagi.', 0)
    if (err instanceof ApiError) throw err
    throw new ApiError('Tidak bisa terhubung ke server.', 0)
  } finally {
    clearTimeout(timer)
  }
}