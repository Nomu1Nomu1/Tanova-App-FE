
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function request(endpoint, options = {}) {
  const headers = {}

  if (options.body) {
    headers['Content-Type'] = 'application/json'
  }

  if (options.headers) {
    Object.assign(headers, options.headers)
  }

  const token = localStorage.getItem('tanova_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message ||
        errorData.detail ||
        `Terjadi kesalahan server: ${response.status}`,
      )
    }

    if (response.status === 204) return null

    return response.json()
  } catch (error) {
    console.error('API Request Error:', error)
    throw error
  }
}

export const api = {
  // AUTH
  async login(credentials) {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  async refreshToken(refreshToken) {
    return request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  },

  // USERS
  async getMe() {
    return request('/users/me')
  },

  async getUsers() {
    return request('/users')
  },

  async createUser(userData) {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  async patchUser(id, userData) {
    return request(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    })
  },

  async updateUser(id, userData) {
    return this.patchUser(id, userData)
  },

  async resetUserPassword(id, passwordData) {
    return request(`/users/${id}/password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    })
  },

  async deleteUser(id) {
    return request(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  async assignUserGreenhouses(id, greenhouseIds) {
    return request(`/users/${id}/greenhouses`, {
      method: 'PUT',
      body: JSON.stringify({ greenhouse_ids: greenhouseIds }),
    })
  },

  // GREENHOUSES
  async getGreenhouses() {
    return request('/greenhouses')
  },

  async createGreenhouse(data) {
    return request('/greenhouses', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async patchGreenhouse(id, data) {
    return request(`/greenhouses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  async deleteGreenhouse(id) {
    return request(`/greenhouses/${id}`, {
      method: 'DELETE',
    })
  },

  // DEVICES
  async getDevices() {
    return request('/devices')
  },

  async addDevice(deviceData) {
    return request('/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    })
  },

  async patchDevice(id, deviceData) {
    return request(`/devices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(deviceData),
    })
  },

  async deleteDevice(id) {
    return request(`/devices/${id}`, {
      method: 'DELETE',
    })
  },

  // THINGSBOARD CONNECTION
  async testDeviceConnection(data) {
    return request('/devices/connection/test', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async testSavedDeviceConnection(id) {
    return request(`/devices/${id}/connection/test`, {
      method: 'POST',
    })
  },

  async updateDeviceConnection(id, data) {
    return request(`/devices/${id}/connection`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // DASHBOARD OVERVIEW
  async getDashboardOverview(deviceId) {
    const params = new URLSearchParams()

    if (deviceId) {
      params.set('device_id', deviceId)
    }

    const query = params.toString()
    return request(`/dashboard/overview${query ? `?${query}` : ''}`)
  },

  // DASHBOARD REALTIME SSE
  async getDashboardStream(deviceId, signal, interval = 5) {
    const token = localStorage.getItem('tanova_token')

    if (!token) {
      throw new Error('Token autentikasi tidak ditemukan. Silakan login ulang.')
    }

    const params = new URLSearchParams({
      device_id: deviceId,
      interval: String(interval),
    })

    return fetch(`${API_BASE_URL}/dashboard/stream?${params.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      signal,
    })
  },

  // TELEMETRY HISTORY
  async getTelemetryHistory(deviceId, options = {}) {
    const params = new URLSearchParams({
      device_id: deviceId,
    })

    if (options.metrics) params.set('metrics', options.metrics)
    if (options.from) params.set('from', options.from)
    if (options.to) params.set('to', options.to)
    if (options.interval) params.set('interval', options.interval)
    if (options.agg) params.set('agg', options.agg)
    if (options.limit) params.set('limit', String(options.limit))

    return request(`/telemetry/history?${params.toString()}`)
  },
}
