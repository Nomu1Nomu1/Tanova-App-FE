<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const emit = defineEmits(['logout'])

function handleSignOut() {
  if (confirm('Apakah Anda yakin ingin keluar dari Panel Administrator?')) {
    emit('logout')
  }
}

const activeTab = ref('devices')

// State data dari backend
const devicesList = ref([])
const greenhousesList = ref([])
const usersList = ref([])

// Fungsi untuk memuat seluruh data admin dari backend
async function loadAdminData() {
  try {
    const [devicesRes, greenhousesRes, usersRes] = await Promise.all([
      api.getDevices().catch(() => []),
      api.getGreenhouses().catch(() => []),
      api.getUsers().catch(() => []),
    ])

    devicesList.value = Array.isArray(devicesRes) ? devicesRes : devicesRes.data || []
    greenhousesList.value = Array.isArray(greenhousesRes)
      ? greenhousesRes
      : greenhousesRes.data || []
    usersList.value = Array.isArray(usersRes) ? usersRes : usersRes.data || []
  } catch (error) {
    console.error('Gagal memuat data admin:', error)
  }
}

onMounted(() => {
  loadAdminData()
})

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
  newGreenhouseLocation: '',
})

// State Modal Tambah User
const showAddUserModal = ref(false)
const newUser = ref({
  fullName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  role: 'User',
  selectedGreenhouses: [],
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

async function handleSaveDevice() {
  if (!newDevice.value.name || !newDevice.value.thingsboardId) {
    alert('Nama device dan ThingsBoard Device ID wajib diisi!')
    return
  }

  try {
    let greenhouseId = newDevice.value.selectedGreenhouse

    // Jika memilih membuat greenhouse baru
    if (newDevice.value.greenhouseOption === 'new') {
      if (!newDevice.value.newGreenhouseName) {
        alert('Nama greenhouse baru wajib diisi!')
        return
      }
      const newGh = await api.createGreenhouse({
        name: newDevice.value.newGreenhouseName,
        location: newDevice.value.newGreenhouseLocation || '-',
      })
      greenhouseId = newGh.id || newGh._id
    }

    // Kirim data penambahan device ke backend
    await api.addDevice({
      name: newDevice.value.name,
      tb_device_id: newDevice.value.thingsboardId.trim(),
      greenhouse_id: greenhouseId,
      tb_url: newDevice.value.tbUrl,
      tb_username: newDevice.value.tbUsername.trim(),
      tb_password: newDevice.value.tbPassword,
    })

    alert('Device berhasil ditambahkan dan dihubungkan!')
    showAddDeviceModal.value = false

    // Reset form & muat ulang data terbaru
    newDevice.value = {
      name: '',
      thingsboardId: '',
      tbUrl: 'https://thingsboard.cloud',
      tbUsername: '',
      tbPassword: '',
      greenhouseOption: 'existing',
      selectedGreenhouse: '',
      newGreenhouseName: '',
      newGreenhouseLocation: '',
    }
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal menyimpan device.')
  }
}

async function handleSaveUser() {
  if (
    !newUser.value.fullName ||
    !newUser.value.username ||
    !newUser.value.email ||
    !newUser.value.password
  ) {
    alert('Nama lengkap, username, email, dan password wajib diisi!')
    return
  }

  try {
    // Panggil API untuk membuat user baru dengan properti 'name' (bukan full_name)
    await api.createUser({
      name: newUser.value.fullName,
      username: newUser.value.username,
      email: newUser.value.email,
      password: newUser.value.password,
      phone: newUser.value.phone || '',
      role: newUser.value.role ? newUser.value.role.toLowerCase() : 'operator',
      greenhouse_ids: newUser.value.selectedGreenhouses,
    })

    alert('Akun user berhasil dibuat!')
    showAddUserModal.value = false

    // Reset form & muat ulang data terbaru
    newUser.value = {
      fullName: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      role: 'User',
      selectedGreenhouses: [],
    }
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal membuat akun user.')
  }
}

// State Modal Edit Device
const showEditDeviceModal = ref(false)
const editingDeviceId = ref(null)
const editDeviceForm = ref({
  name: '',
  zone: '',
  type: '',
  tb_device_id: '',
  tb_url: '',
  tb_username: '',
  tb_password: '',
  notes: '',
})

function handleOpenEditDevice(dev) {
  editingDeviceId.value = dev.id || dev._id
  editDeviceForm.value = {
    name: dev.name || '',
    zone: dev.zone || '',
    type: dev.type || '',
    tb_device_id: dev.tb_device_id || '',
    tb_url: dev.tb_url || 'https://thingsboard.cloud',
    tb_username: dev.tb_username || '',
    tb_password: dev.tb_password || '',
    notes: dev.notes || '',
  }
  showEditDeviceModal.value = true
}

function handleCloseEditDeviceModal() {
  showEditDeviceModal.value = false
  editingDeviceId.value = null
}

async function handleUpdateDevice() {
  if (!editingDeviceId.value) return
  try {
    // Panggil API PATCH untuk update informasi device
    await api.patchDevice(editingDeviceId.value, {
      name: editDeviceForm.value.name,
      zone: editDeviceForm.value.zone,
      type: editDeviceForm.value.type,
      tb_device_id: editDeviceForm.value.tb_device_id,
      tb_url: editDeviceForm.value.tb_url,
      tb_username: editDeviceForm.value.tb_username,
      tb_password: editDeviceForm.value.tb_password,
      notes: editDeviceForm.value.notes,
    })

    alert('Perangkat berhasil diperbarui!')
    showEditDeviceModal.value = false
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal memperbarui perangkat.')
  }
}

async function handleDeleteDevice(dev) {
  const deviceId = dev.id || dev._id
  const deviceName = dev.name || 'Perangkat ini'

  if (!confirm(`Apakah Anda yakin ingin menghapus perangkat "${deviceName}"?`)) {
    return
  }

  try {
    // Panggil API DELETE device (khusus admin)
    await api.deleteDevice(deviceId)
    alert('Perangkat berhasil dihapus.')
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal menghapus perangkat.')
  }
}

// State Modal Edit Greenhouse
const showEditGreenhouseModal = ref(false)
const editingGreenhouseId = ref(null)
const editGreenhouseForm = ref({
  name: '',
  location: '',
  plant_type: '',
  area_m2: 0,
  description: '',
})

function handleOpenEditGreenhouse(gh) {
  editingGreenhouseId.value = gh.id || gh._id
  editGreenhouseForm.value = {
    name: gh.name || '',
    location: gh.location || '',
    plant_type: gh.plant_type || '',
    area_m2: gh.area_m2 || 0,
    description: gh.description || '',
  }
  showEditGreenhouseModal.value = true
}

function handleCloseEditGreenhouseModal() {
  showEditGreenhouseModal.value = false
  editingGreenhouseId.value = null
}

async function handleUpdateGreenhouse() {
  if (!editingGreenhouseId.value) return
  try {
    // Panggil API PATCH untuk update informasi greenhouse
    await api.patchGreenhouse(editingGreenhouseId.value, {
      name: editGreenhouseForm.value.name,
      location: editGreenhouseForm.value.location,
      plant_type: editGreenhouseForm.value.plant_type,
      area_m2: Number(editGreenhouseForm.value.area_m2),
      description: editGreenhouseForm.value.description,
    })

    alert('Greenhouse berhasil diperbarui!')
    showEditGreenhouseModal.value = false
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal memperbarui greenhouse.')
  }
}

async function handleDeleteGreenhouse(gh) {
  const ghId = gh.id || gh._id
  const ghName = gh.name || 'Greenhouse ini'

  if (!confirm(`Apakah Anda yakin ingin menghapus greenhouse "${ghName}"?`)) {
    return
  }

  try {
    // Panggil API DELETE greenhouse (khusus admin)
    await api.deleteGreenhouse(ghId)
    alert('Greenhouse berhasil dihapus.')
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal menghapus greenhouse.')
  }
}

// State Modal Edit User
const showEditUserModal = ref(false)
const editingUserId = ref(null)
const editUserForm = ref({
  name: '',
  username: '',
  email: '',
  phone: '',
  role: 'operator',
  is_active: true,
})

// State Modal Reset Password User
const showResetPasswordModal = ref(false)
const resettingUserId = ref(null)
const newPasswordForm = ref({
  password: '',
})

function handleOpenEditUser(usr) {
  editingUserId.value = usr.id || usr._id
  editUserForm.value = {
    name: usr.name || usr.full_name || '',
    username: usr.username || '',
    email: usr.email || '',
    phone: usr.phone || '',
    role: usr.role || 'operator',
    is_active: usr.is_active !== false,
  }
  showEditUserModal.value = true
}

function handleCloseEditUserModal() {
  showEditUserModal.value = false
  editingUserId.value = null
}

async function handleUpdateUser() {
  if (!editingUserId.value) return
  try {
    // Panggil API PATCH untuk update identitas/role/status user
    await api.patchUser(editingUserId.value, {
      name: editUserForm.value.name,
      username: editUserForm.value.username,
      email: editUserForm.value.email,
      phone: editUserForm.value.phone,
      role: editUserForm.value.role,
      is_active: Boolean(editUserForm.value.is_active),
    })

    alert('Informasi akun berhasil diperbarui!')
    showEditUserModal.value = false
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal memperbarui akun.')
  }
}

function handleOpenResetPassword(usr) {
  resettingUserId.value = usr.id || usr._id
  newPasswordForm.value.password = ''
  showResetPasswordModal.value = true
}

function handleCloseResetPasswordModal() {
  showResetPasswordModal.value = false
  resettingUserId.value = null
}

async function handleResetPassword() {
  if (!resettingUserId.value || !newPasswordForm.value.password) {
    alert('Masukkan password baru terlebih dahulu.')
    return
  }
  try {
    // Panggil API PUT untuk reset password user
    await api.resetUserPassword(resettingUserId.value, {
      password: newPasswordForm.value.password,
    })

    alert('Password pengguna berhasil direset!')
    showResetPasswordModal.value = false
  } catch (error) {
    alert(error.message || 'Gagal mereset password.')
  }
}

async function handleDeleteUser(usr) {
  const userId = usr.id || usr._id
  const userName = usr.name || usr.username || 'Pengguna ini'

  if (!confirm(`Apakah Anda yakin ingin menghapus akun "${userName}"?`)) {
    return
  }

  try {
    // Panggil API DELETE user
    await api.deleteUser(userId)
    alert('Akun pengguna berhasil dihapus.')
    loadAdminData()
  } catch (error) {
    alert(error.message || 'Gagal menghapus akun.')
  }
}
</script>

<template>
  <div class="admin-container">
    <!-- Admin Header -->
    <div class="admin-header">
      <div>
        <h1 class="admin-title">
          <i class="fa-solid fa-shield-halved"></i> Panel Administrator Tanova
        </h1>
        <p class="admin-subtitle">
          Kelola perangkat, greenhouse, dan hak akses akun pengguna sistem.
        </p>
      </div>
      <div class="admin-header-right">
        <div class="admin-badge">
          <span><i class="fa-solid fa-user-shield"></i> Admin Mode</span>
        </div>
        <button @click="handleSignOut" class="btn-signout-admin" title="Keluar Akun">
          <i class="fa-solid fa-right-from-bracket"></i> Sign Out
        </button>
      </div>
    </div>

    <!-- Navigation -->
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
          <p class="section-desc">
            Hubungkan device baru ke ThingsBoard dan tetapkan ke greenhouse.
          </p>
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
            <tr v-for="dev in devicesList" :key="dev.id || dev._id">
              <td>
                <strong>{{ dev.name }}</strong>
              </td>
              <td>
                <code>{{ dev.tb_device_id || dev.thingsboardId || dev.tbId || '-' }}</code>
              </td>
              <td>
                {{
                  dev.greenhouse?.name || dev.greenhouse_name || dev.greenhouse || 'Belum diatur'
                }}
              </td>
              <td>
                <span class="pill-connected">
                  <i class="fa-solid fa-circle status-dot"></i>
                  {{ dev.status || 'Terhubung' }}
                </span>
              </td>
              <td class="text-right action-buttons-cell">
                <button @click="handleOpenEditDevice(dev)" class="btn-action" title="Edit">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  @click="handleDeleteDevice(dev)"
                  class="btn-action text-danger"
                  title="Hapus"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>
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
          <p class="section-desc">
            Setiap greenhouse memiliki ID permanen dan terikat dengan kepemilikan user.
          </p>
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
              <th class="text-right">AKSI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gh in greenhousesList" :key="gh.id || gh._id">
              <td>
                <code>{{ gh.id || gh._id }}</code>
              </td>
              <td>
                <strong>{{ gh.name }}</strong>
              </td>
              <td>{{ gh.location || '-' }}</td>
              <td>
                {{ gh.deviceCount ?? gh.devices_count ?? (gh.devices ? gh.devices.length : 0) }}
                Device
              </td>
              <td>
                <span class="user-pill" v-if="gh.owner || gh.user || gh.username">
                  <i class="fa-solid fa-user"></i>
                  {{ gh.owner?.name || gh.owner?.username || gh.owner || gh.user || gh.username }}
                </span>
                <span v-else class="text-muted">Belum ditetapkan</span>
              </td>
              <td class="text-right action-buttons-cell">
                <button @click="handleOpenEditGreenhouse(gh)" class="btn-action" title="Edit">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  @click="handleDeleteGreenhouse(gh)"
                  class="btn-action text-danger"
                  title="Hapus"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </td>
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
          <p class="section-desc">
            Buat akun, atur hak akses greenhouse, dan reset kredensial user.
          </p>
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
            <tr v-for="usr in usersList" :key="usr.id || usr._id">
              <td>
                <strong>{{ usr.name || usr.full_name }}</strong>
              </td>
              <td>{{ usr.username }}</td>
              <td>{{ usr.email }}</td>
              <td>{{ usr.role }}</td>
              <td>
                <template
                  v-if="
                    (usr.assignedGreenhouses || usr.greenhouses || usr.greenhouse_ids) &&
                    (usr.assignedGreenhouses || usr.greenhouses || usr.greenhouse_ids).length
                  "
                >
                  <span
                    v-for="gh in usr.assignedGreenhouses || usr.greenhouses || usr.greenhouse_ids"
                    :key="gh.id || gh"
                    class="greenhouse-badge"
                  >
                    {{ gh.name || gh }}
                  </span>
                </template>
                <span v-else class="text-muted">-</span>
              </td>
              <td>
                <span class="pill-active"
                  ><i class="fa-solid fa-circle status-dot"></i>
                  {{ usr.is_active !== false ? 'Aktif' : 'Nonaktif' }}</span
                >
              </td>
              <td class="text-right action-buttons-cell">
                <button
                  @click="handleOpenResetPassword(usr)"
                  class="btn-action"
                  title="Reset Password"
                >
                  <i class="fa-solid fa-key"></i>
                </button>
                <button @click="handleOpenEditUser(usr)" class="btn-action" title="Edit Akun">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                  @click="handleDeleteUser(usr)"
                  class="btn-action text-danger"
                  title="Hapus Akun"
                >
                  <i class="fa-solid fa-trash-can"></i>
                </button>
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
          <h3 class="section-title">
            <i class="fa-solid fa-server"></i> Tambah & Hubungkan Device Baru
          </h3>
          <button @click="handleCloseDeviceModal" class="btn-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Device</label>
            <input
              v-model="newDevice.name"
              type="text"
              placeholder="Contoh: Tanova Grove - 3"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>ThingsBoard Device ID</label>
            <input
              v-model="newDevice.thingsboardId"
              type="text"
              placeholder="Masukkan ID Device ThingsBoard"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>URL ThingsBoard</label>
              <input v-model="newDevice.tbUrl" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Username ThingsBoard</label>
              <input
                v-model="newDevice.tbUsername"
                type="text"
                placeholder="Username TB"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Password ThingsBoard</label>
            <input
              v-model="newDevice.tbPassword"
              type="password"
              placeholder="Password TB"
              class="form-input"
            />
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
              <input
                v-model="newDevice.newGreenhouseName"
                type="text"
                placeholder="Contoh: Greenhouse Zona 3"
                class="form-input"
              />
            </div>
            <div class="form-group mb-0">
              <label>Lokasi / Blok</label>
              <input
                v-model="newDevice.newGreenhouseLocation"
                type="text"
                placeholder="Contoh: Blok C"
                class="form-input"
              />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseDeviceModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleSaveDevice" class="btn-primary-admin">Simpan & Hubungkan</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDIT DEVICE -->
    <div v-if="showEditDeviceModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title">
            <i class="fa-solid fa-pen-to-square"></i> Edit Informasi Perangkat
          </h3>
          <button @click="handleCloseEditDeviceModal" class="btn-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Device</label>
            <input v-model="editDeviceForm.name" type="text" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Zona</label>
              <input v-model="editDeviceForm.zone" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Tipe Device</label>
              <input v-model="editDeviceForm.type" type="text" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>ThingsBoard Device ID</label>
            <input v-model="editDeviceForm.tb_device_id" type="text" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>URL ThingsBoard</label>
              <input v-model="editDeviceForm.tb_url" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Username ThingsBoard</label>
              <input v-model="editDeviceForm.tb_username" type="text" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Password ThingsBoard</label>
            <input
              v-model="editDeviceForm.tb_password"
              type="password"
              placeholder="Kosongkan jika tidak diubah"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Catatan / Notes</label>
            <textarea v-model="editDeviceForm.notes" class="form-input" rows="2"></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseEditDeviceModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleUpdateDevice" class="btn-primary-admin">Simpan Perubahan</button>
        </div>
      </div>
    </div>

    <!-- MODAL EDIT GREENHOUSE -->
    <div v-if="showEditGreenhouseModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title">
            <i class="fa-solid fa-pen-to-square"></i> Edit Informasi Greenhouse
          </h3>
          <button @click="handleCloseEditGreenhouseModal" class="btn-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Greenhouse</label>
            <input v-model="editGreenhouseForm.name" type="text" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Lokasi</label>
              <input v-model="editGreenhouseForm.location" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Jenis Tanaman (Plant Type)</label>
              <input v-model="editGreenhouseForm.plant_type" type="text" class="form-input" />
            </div>
          </div>

          <div class="form-group">
            <label>Luas Area (m²)</label>
            <input v-model.number="editGreenhouseForm.area_m2" type="number" class="form-input" />
          </div>

          <div class="form-group">
            <label>Deskripsi</label>
            <textarea
              v-model="editGreenhouseForm.description"
              class="form-input"
              rows="2"
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseEditGreenhouseModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleUpdateGreenhouse" class="btn-primary-admin">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL BUAT AKUN USER -->
    <div v-if="showAddUserModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title">
            <i class="fa-solid fa-user-plus"></i> Buat Akun Pengguna Baru
          </h3>
          <button @click="handleCloseUserModal" class="btn-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input
              v-model="newUser.fullName"
              type="text"
              placeholder="Contoh: Anna Emila"
              class="form-input"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input
                v-model="newUser.username"
                type="text"
                placeholder="Contoh: anna_emila"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input
                v-model="newUser.email"
                type="email"
                placeholder="anna@tanova.com"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Password Awal</label>
              <input
                v-model="newUser.password"
                type="password"
                placeholder="Minimal 6 karakter"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>Nomor Telepon (Opsional)</label>
              <input
                v-model="newUser.phone"
                type="text"
                placeholder="08xxxxxxxxxx"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Role / Hak Akses</label>
            <select v-model="newUser.role" class="form-input">
              <option value="operator">Operator / User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <hr class="form-divider" />

          <label class="form-label-title">Penetapan Greenhouse</label>
          <p class="section-desc mb-2">
            Pilih satu atau beberapa greenhouse yang akan diberikan kepada user ini.
          </p>

          <div class="checkbox-group">
            <label v-for="gh in greenhousesList" :key="gh.id || gh._id" class="checkbox-label">
              <input
                type="checkbox"
                :value="gh.id || gh._id"
                v-model="newUser.selectedGreenhouses"
              />
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

    <!-- MODAL EDIT USER -->
    <div v-if="showEditUserModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title">
            <i class="fa-solid fa-pen-to-square"></i> Edit Informasi Akun User
          </h3>
          <button @click="handleCloseEditUserModal" class="btn-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Nama Lengkap</label>
            <input v-model="editUserForm.name" type="text" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Username</label>
              <input v-model="editUserForm.username" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="editUserForm.email" type="email" class="form-input" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Nomor Telepon</label>
              <input v-model="editUserForm.phone" type="text" class="form-input" />
            </div>
            <div class="form-group">
              <label>Role Akses</label>
              <select v-model="editUserForm.role" class="form-input">
                <option value="admin">Admin</option>
                <option value="operator">Operator / User</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Status Akun</label>
            <select v-model="editUserForm.is_active" class="form-input">
              <option :value="true">Aktif</option>
              <option :value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseEditUserModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleUpdateUser" class="btn-primary-admin">Simpan Perubahan</button>
        </div>
      </div>
    </div>

    <!-- MODAL RESET PASSWORD USER -->
    <div v-if="showResetPasswordModal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-header">
          <h3 class="section-title"><i class="fa-solid fa-key"></i> Reset Password Pengguna</h3>
          <button @click="handleCloseResetPasswordModal" class="btn-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Password Baru</label>
            <input
              v-model="newPasswordForm.password"
              type="password"
              placeholder="Masukkan password baru untuk user"
              class="form-input"
            />
          </div>
        </div>

        <div class="modal-footer">
          <button @click="handleCloseResetPasswordModal" class="btn-secondary-admin">Batal</button>
          <button @click="handleResetPassword" class="btn-primary-admin">
            Simpan Password Baru
          </button>
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
  background: #93ba39;
  color: #fff;
  border-color: #93ba39;
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
  background: #93ba39;
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

.pill-connected,
.pill-active {
  background: #e5f2cc;
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
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
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
  border-color: #93ba39;
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

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.radio-label,
.checkbox-label {
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

.admin-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-signout-admin {
  padding: 6px 14px;
  background: #fde8e8;
  color: #d9534f;
  border: 1px solid #f5c6cb;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-signout-admin:hover {
  background: #d9534f;
  color: #fff;
  border-color: #d9534f;
}
</style>
