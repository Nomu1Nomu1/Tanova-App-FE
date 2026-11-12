<script setup>
import { ref } from 'vue'

const activeTab = ref('devices')

// State data simulasi
const devicesList = ref([
  { id: 1, name: 'Tanova Grove - 1', tbId: 'tb-dev-001', greenhouse: 'Greenhouse Zona 1', status: 'Terhubung' },
  { id: 2, name: 'Tanova Grove - 2', tbId: 'tb-dev-002', greenhouse: 'Greenhouse Zona 2', status: 'Terhubung' },
])

const greenhousesList = ref([
  { id: 'gh-01', name: 'Greenhouse Zona 1', location: 'Blok A', deviceCount: 1, owner: 'budi_user' },
  { id: 'gh-02', name: 'Greenhouse Zona 2', location: 'Blok B', deviceCount: 1, owner: 'siti_user' },
])

const usersList = ref([
  { id: 1, fullName: 'Budi Santoso', username: 'budi_user', email: 'budi@tanova.com', phone: '081234567890', role: 'User', assignedGreenhouses: ['Greenhouse Zona 1'], status: 'Aktif' },
  { id: 2, fullName: 'Siti Aminah', username: 'siti_user', email: 'siti@tanova.com', phone: '089876543210', role: 'User', assignedGreenhouses: ['Greenhouse Zona 2'], status: 'Aktif' },
])

// State Modal Tambah Device
const showAddDeviceModal = ref(false)
const newDevice = ref({
  name: '',
  thingsboardId: '',
  tbUrl: 'https://thingsboard.cloud',
  tbUsername: '',
  tbPassword: '',
  greenhouseOption: 'existing',
  selectedGreenhouse: '',
  newGreenhouseName: '',
  newGreenhouseLocation: ''
})

// State Modal Tambah User (Sesuai spesifikasi sistem)
const showAddUserModal = ref(false)
const newUser = ref({
  fullName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  role: 'User',
  selectedGreenhouses: []
})

function handleOpenAddDevice() {
  showAddDeviceModal.value = true
}

function handleCloseDeviceModal() {
  showAddDeviceModal.value = false
}

function handleOpenAddUser() {
  showAddUserModal.value = true
}

function handleCloseUserModal() {
  showAddUserModal.value = false
}

function handleSaveDevice() {
  if (!newDevice.value.name || !newDevice.value.thingsboardId) {
    alert('Nama device dan ThingsBoard Device ID wajib diisi!')
    return
  }

  let targetGreenhouseName = ''

  if (newDevice.value.greenhouseOption === 'existing') {
    if (!newDevice.value.selectedGreenhouse) {
      alert('Silakan pilih greenhouse yang tersedia!')
      return
    }
    const foundGh = greenhousesList.value.find(g => g.id === newDevice.value.selectedGreenhouse)
    targetGreenhouseName = foundGh ? foundGh.name : ''
    if (foundGh) foundGh.deviceCount++
  } else {
    if (!newDevice.value.newGreenhouseName) {
      alert('Nama greenhouse baru wajib diisi!')
      return
    }
    const newGhId = `gh-0${greenhousesList.value.length + 1}`
    targetGreenhouseName = newDevice.value.newGreenhouseName
    greenhousesList.value.push({
      id: newGhId,
      name: newDevice.value.newGreenhouseName,
      location: newDevice.value.newGreenhouseLocation || '-',
      deviceCount: 1,
      owner: 'Belum ditetapkan'
    })
  }

  devicesList.value.push({
    id: devicesList.value.length + 1,
    name: newDevice.value.name,
    tbId: newDevice.value.thingsboardId,
    greenhouse: targetGreenhouseName,
    status: 'Terhubung'
  })

  showAddDeviceModal.value = false
  newDevice.value = {
    name: '',
    thingsboardId: '',
    tbUrl: 'https://thingsboard.cloud',
    tbUsername: '',
    tbPassword: '',
    greenhouseOption: 'existing',
    selectedGreenhouse: '',
    newGreenhouseName: '',
    newGreenhouseLocation: ''
  }
}

function handleSaveUser() {
  if (!newUser.value.fullName || !newUser.value.username || !newUser.value.email || !newUser.value.password) {
    alert('Nama lengkap, username, email, dan password wajib diisi!')
    return
  }

  // Cek keunikan username/email sederhana
  const existingUser = usersList.value.find(u => u.username === newUser.value.username || u.email === newUser.value.email)
  if (existingUser) {
    alert('Username atau email sudah terdaftar. Username dan email harus unik!')
    return
  }

  usersList.value.push({
    id: usersList.value.length + 1,
    fullName: newUser.value.fullName,
    username: newUser.value.username,
    email: newUser.value.email,
    phone: newUser.value.phone || '-',
    role: newUser.value.role,
    assignedGreenhouses: [...newUser.value.selectedGreenhouses],
    status: 'Aktif'
  })

  showAddUserModal.value = false
  newUser.value = {
    fullName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'User',
    selectedGreenhouses: []
  }
}
</script>

<template>
  <div class="admin-container">
    <!-- Admin Header -->
    <div class="admin-header">
      <div>
        <h1 class="admin-title"><i class="fa-solid fa-shield-halved"></i> Panel Administrator Tanova</h1>
        <p class="admin-subtitle">Kelola perangkat, greenhouse, dan hak akses akun pengguna sistem.</p>
      </div>
      <div class="admin-badge">
        <span><i class="fa-solid fa-user-shield"></i> Admin Mode</span>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="admin-tabs">
      <button 
        @click="activeTab = 'devices'" 
        :class="['tab-btn', activeTab === 'devices' ? 'active' : '']"
      >
        <i class="fa-solid fa-server"></i> Manajemen Device
      </button>
      <button 
        @click="activeTab = 'greenhouses'" 
        :class="['tab-btn', activeTab === 'greenhouses' ? 'active' : '']"
      >
        <i class="fa-solid fa-house-chimney-window"></i> Manajemen Greenhouse
      </button>
      <button 
        @click="activeTab = 'users'" 
        :class="['tab-btn', activeTab === 'users' ? 'active' : '']"
      >
        <i class="fa-solid fa-users-gear"></i> Manajemen Akun User
      </button>
    </div>

    <!-- Tab Content: Manajemen Device -->
    <div v-if="activeTab === 'devices'" class="admin-card">
      <div class="card-header-flex">
        <div>
          <h3 class="section-title">Daftar Perangkat Terdaftar</h3>
          <p class="section-desc">Hubungkan device baru ke ThingsBoard dan tetapkan ke greenhouse.</p>
        </div>
        <button @click="handleOpenAddDevice" class="btn-primary-admin">
          <i class="fa-solid fa-plus"></i> Tambah Device Baru
        </button>
      </div>

      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>NAMA DEVICE</th>
              <th>THINGSBOARD ID</th>
              <th>GREENHOUSE</th>
              <th>STATUS KONEKSI</th>
              <th class="text-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="dev in devicesList" :key="dev.id">
              <td><strong>{{ dev.name }}</strong></td>
              <td><code>{{ dev.tbId }}</code></td>
              <td>{{ dev.greenhouse }}</td>
              <td><span class="pill-connected"><i class="fa-solid fa-circle status-dot"></i> {{ dev.status }}</span></td>
              <td class="text-right action-buttons-cell">
                <button class="btn-action" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-action text-danger" title="Hapus"><i class="fa-solid fa-trash-can"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab Content: Manajemen Greenhouse -->
    <div v-if="activeTab === 'greenhouses'" class="admin-card">
      <div class="card-header-flex">
        <div>
          <h3 class="section-title">Daftar Greenhouse</h3>
          <p class="section-desc">Setiap greenhouse memiliki ID permanen dan terikat dengan kepemilikan user.</p>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID GREENHOUSE</th>
              <th>NAMA GREENHOUSE</th>
              <th>LOKASI</th>
              <th>JUMLAH DEVICE</th>
              <th>PEMILIK AKUN</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gh in greenhousesList" :key="gh.id">
              <td><code>{{ gh.id }}</code></td>
              <td><strong>{{ gh.name }}</strong></td>
              <td>{{ gh.location }}</td>
              <td>{{ gh.deviceCount }} Device</td>
              <td><span class="user-pill"><i class="fa-solid fa-user"></i> {{ gh.owner }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tab Content: Manajemen Akun User -->
    <div v-if="activeTab === 'users'" class="admin-card">
      <div class="card-header-flex">
        <div>
          <h3 class="section-title">Manajemen Akun Pengguna</h3>
          <p class="section-desc">Buat akun, atur hak akses greenhouse, dan reset kredensial user.</p>
        </div>
        <button @click="handleOpenAddUser" class="btn-primary-admin">
          <i class="fa-solid fa-user-plus"></i> Buat Akun User
        </button>
      </div>

      <div class="table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>NAMA LENGKAP</th>
              <th>USERNAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>GREENHOUSE DIAKSES</th>
              <th>STATUS</th>
              <th class="text-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="usr in usersList" :key="usr.id">
              <td><strong>{{ usr.fullName }}</strong></td>
              <td>{{ usr.username }}</td>
              <td>{{ usr.email }}</td>
              <td>{{ usr.role }}</td>
              <td>
                <span v-for="gh in usr.assignedGreenhouses" :key="gh" class="greenhouse-badge">
                  {{ gh }}
                </span>
                <span v-if="!usr.assignedGreenhouses.length" class="text-muted">-</span>
              </td>
              <td><span class="pill-active"><i class="fa-solid fa-circle status-dot"></i> {{ usr.status }}</span></td>
              <td class="text-right action-buttons-cell">
                <button class="btn-action" title="Ubah Password"><i class="fa-solid fa-key"></i></button>
                <button class="btn-action" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                <button class="btn-action text-danger" title="Nonaktifkan"><i class="fa-solid fa-ban"></i></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- MODAL TAMBAH DEVICE -->
    <div v-if="showAddDeviceModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title"><i class="fa-solid fa-server"></i> Tambah & Hubungkan Device Baru</h3>
          <button @click="handleCloseDeviceModal" class="btn-close"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Device</label>
            <input v-model="newDevice.name" type="text" placeholder="Contoh: Tanova Grove - 3" class="form-input" />
          </div>

          <div class="form-group">
            <label>ThingsBoard Device ID</label>
            <input v-model="newDevice.thingsboardId" type="text" placeholder="Masukkan ID Device ThingsBoard" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>URL ThingsBoard</label>
              <input v-model="newDevice.tbUrl" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Username ThingsBoard</label>
              <input v-model="newDevice.tbUsername" type="text" placeholder="Username TB" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Password ThingsBoard</label>
            <input v-model="newDevice.tbPassword" type="password" placeholder="Password TB" class="form-input" />
          </div>

          <hr class="form-divider" />

          <label class="form-label-title">Penetapan Greenhouse</label>
          
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="newDevice.greenhouseOption" value="existing" />
              Hubungkan ke greenhouse yang sudah tersedia
            </label>
            <label class="radio-label">
              <input type="radio" v-model="newDevice.greenhouseOption" value="new" />
              Buat greenhouse baru sekaligus hubungkan
            </label>
          </div>

          <div v-if="newDevice.greenhouseOption === 'existing'" class="form-group mt-2">
            <label>Pilih Greenhouse</label>
            <select v-model="newDevice.selectedGreenhouse" class="form-input">
              <option disabled value="">-- Pilih Greenhouse --</option>
              <option v-for="gh in greenhousesList" :key="gh.id" :value="gh.id">
                {{ gh.name }} ({{ gh.location }})
              </option>
            </select>
          </div>

          <div v-if="newDevice.greenhouseOption === 'new'" class="sub-form-box">
            <div class="form-group">
              <label>Nama Greenhouse Baru</label>
              <input v-model="newDevice.newGreenhouseName" type="text" placeholder="Contoh: Greenhouse Zona 3" class="form-input" />
            </div>
            <div class="form-group mb-0">
              <label>Lokasi / Blok</label>
              <input v-model="newDevice.newGreenhouseLocation" type="text" placeholder="Contoh: Blok C" class="form-input" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseDeviceModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleSaveDevice" class="btn-primary-admin">Simpan & Hubungkan</button>
        </div>
      </div>
    </div>

    <!-- MODAL BUAT AKUN USER (Sesuai spesifikasi sistem) -->
    <div v-if="showAddUserModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title"><i class="fa-solid fa-user-plus"></i> Buat Akun Pengguna Baru</h3>
          <button @click="handleCloseUserModal" class="btn-close"><i class="fa-solid fa-xmark"></i></button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input v-model="newUser.fullName" type="text" placeholder="Contoh: Anna Emila" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input v-model="newUser.username" type="text" placeholder="Contoh: anna_emila" class="form-input" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="newUser.email" type="email" placeholder="anna@tanova.com" class="form-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Password Awal</label>
              <input v-model="newUser.password" type="password" placeholder="Minimal 6 karakter" class="form-input" />
            </div>
            <div class="form-group">
              <label>Nomor Telepon (Opsional)</label>
              <input v-model="newUser.phone" type="text" placeholder="08xxxxxxxxxx" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Role / Hak Akses</label>
            <select v-model="newUser.role" class="form-input">
              <option value="User">User</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <hr class="form-divider" />

          <label class="form-label-title">Penetapan Greenhouse</label>
          <p class="section-desc mb-2">Pilih satu atau beberapa greenhouse yang akan diberikan kepada user ini.</p>
          
          <div class="checkbox-group">
            <label v-for="gh in greenhousesList" :key="gh.id" class="checkbox-label">
              <input type="checkbox" :value="gh.name" v-model="newUser.selectedGreenhouses" />
              {{ gh.name }} (Lokasi: {{ gh.location }})
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseUserModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleSaveUser" class="btn-primary-admin">Simpan Akun User</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  padding: 30px;
  font-family: sans-serif;
  background: #f4f7f1;
  min-height: 100vh;
  box-sizing: border-box;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border: 1px solid #e0e0e0;
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.admin-title {
  font-size: 22px;
  font-weight: bold;
  color: #111;
  margin: 0 0 4px 0;
}

.admin-subtitle {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.admin-badge {
  background: #2c3e50;
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.admin-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 18px;
  background: #fff;
  border: 1px solid #dcdcdc;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: #555;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-btn.active {
  background: #93BA39;
  color: #fff;
  border-color: #93BA39;
}

.admin-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  margin: 4px 0 0 0;
}

.btn-primary-admin {
  padding: 8px 16px;
  background: #93BA39;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-primary-admin:hover {
  background: #82a532;
}

.btn-secondary-admin {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: #333;
}

.btn-secondary-admin:hover {
  background: #f5f5f5;
}

.table-wrapper {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.admin-table th {
  color: #777;
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.5px;
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.admin-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.pill-connected, .pill-active {
  background: #E5F2CC;
  color: #558b2f;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-dot {
  font-size: 8px;
}

.user-pill {
  background: #f1f1f1;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.greenhouse-badge {
  background: #eef4e2;
  color: #558b2f;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  margin-right: 4px;
  display: inline-block;
}

.text-muted {
  color: #999;
}

.text-right {
  text-align: right;
}

.action-buttons-cell {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}

.btn-action {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #555;
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action:hover {
  background: #e9ecef;
  color: #111;
}

.text-danger {
  color: #d9534f;
}

.text-danger:hover {
  background: #fde8e8;
  color: #d9534f;
  border-color: #f5c6cb;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  width: 550px;
  max-width: 90%;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  font-size: 13px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #93BA39;
  outline: none;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-divider {
  border: none;
  border-top: 1px solid #eee;
  margin: 18px 0;
}

.form-label-title {
  font-weight: bold;
  color: #111;
  display: block;
  margin-bottom: 4px;
}

.radio-group, .checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #333;
}

.sub-form-box {
  background: #f9fbf7;
  border: 1px solid #e2ebd5;
  padding: 14px;
  border-radius: 8px;
  margin-top: 8px;
}

.mt-2 {
  margin-top: 10px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-0 {
  margin-bottom: 0;
}
</style>