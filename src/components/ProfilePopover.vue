<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'
import EditProfileModal from './EditProfileModal.vue'
import { api } from '../services/api'

const emit = defineEmits(['edit', 'logout'])

const open = ref(false)
const root = ref(null)

// Ubah respons backend (GET /users/me) jadi bentuk yang dipakai template
function mapUser(u) {
  if (!u) return { name: '-', email: '-', status: '-', device: '-', joined: '-' }

  // getMe mengembalikan `greenhouses` (array) dan `greenhouse` (satu objek)
  const list = Array.isArray(u.greenhouses) && u.greenhouses.length
    ? u.greenhouses
    : u.greenhouse
      ? [u.greenhouse]
      : []
  const greenhouses = list.map((g) => g.name || g.id).join(', ')

  return {
    name: u.name || u.username || '-',
    email: u.email || '-',
    status: u.is_active === false ? 'Nonaktif' : 'Aktif',
    device: greenhouses || '-',
    joined: u.created_at
      ? new Date(u.created_at).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '-',
  }
}

function readSaved() {
  try {
    return JSON.parse(localStorage.getItem('tanova_user'))
  } catch {
    return null
  }
}

// Tampilkan dulu data tersimpan dari login, lalu diperbarui dari backend
const rawUser = ref(readSaved())
const profile = ref(mapUser(rawUser.value))
const showEdit = ref(false)

function applyUser(u) {
  rawUser.value = u
  profile.value = mapUser(u)
}

async function loadProfile() {
  try {
    const me = await api.getMe()
    localStorage.setItem('tanova_user', JSON.stringify(me))
    applyUser(me)
  } catch (error) {
    console.error('Gagal memuat profil:', error)
  }
}

const initials = computed(() =>
  profile.value.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
)

const rows = computed(() => [
  { label: 'Status akun', value: profile.value.status, badge: true },
  { label: 'Perangkat', value: profile.value.device, bold: true },
  { label: 'Bergabung', value: profile.value.joined, bold: true },
])

function close() {
  open.value = false
}
function onEdit() {
  close()
  showEdit.value = true
}
function onDocDown(e) {
  if (root.value && !root.value.contains(e.target)) close()
}
function onKey(e) {
  if (e.key === 'Escape') close()
}
onMounted(() => {
  loadProfile()
  document.addEventListener('mousedown', onDocDown)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onDocDown)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div ref="root" class="profile">
    <button
      type="button"
      class="profile__trigger"
      :class="{ 'profile__trigger--open': open }"
      aria-label="Informasi profil"
      aria-haspopup="dialog"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon name="userFill" />
    </button>

    <section v-if="open" class="pop" role="dialog" aria-labelledby="profile-title">
      <header class="pop__head">
        <h2 id="profile-title">Informasi Profil</h2>
        <button type="button" class="pop__close" aria-label="Tutup" @click="close">
          <Icon name="close" />
        </button>
      </header>

      <div class="person">
        <span class="avatar">{{ initials }}</span>
        <div>
          <b>{{ profile.name }}</b>
          <span class="email">{{ profile.email }}</span>
        </div>
      </div>

      <hr />

      <h3 class="section"><Icon name="idCard" />Informasi Akun</h3>
      <dl class="rows">
        <template v-for="r in rows" :key="r.label">
          <dt>{{ r.label }}</dt>
          <dd :class="{ 'dd--bold': r.bold }">
            <span v-if="r.badge" class="status"><i></i>{{ r.value }}</span>
            <template v-else>{{ r.value }}</template>
          </dd>
        </template>
      </dl>

      <hr />

      <div class="actions">
        <button type="button" class="btn btn--solid" @click="onEdit">
          <Icon name="edit" />
          Edit Profil
        </button>
        <button type="button" class="btn btn--ghost" @click="emit('logout')">
          <Icon name="logout" />
          Keluar
        </button>
      </div>
    </section>

    <EditProfileModal
      v-if="showEdit"
      :user="rawUser"
      @close="showEdit = false"
      @saved="applyUser"
    />
  </div>
</template>

<style scoped>
.profile {
  position: relative;
}

.profile__trigger {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--green-900);
  background: none;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}
.profile__trigger .icon {
  width: 18px;
  height: 18px;
}
.profile__trigger:hover,
.profile__trigger--open {
  box-shadow: 0 0 0 2px var(--green-500);
}
.profile__trigger:focus-visible {
  outline: 2px solid var(--green-700);
  outline-offset: 2px;
}

.pop {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 40;
  width: min(300px, calc(100vw - 32px));
  padding: 16px;
  color: var(--text);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(40, 60, 10, 0.22);
}

.pop__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.pop__head h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--green-900);
}
.pop__close {
  display: grid;
  place-items: center;
  padding: 3px;
  color: var(--green-900);
  background: none;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.pop__close:hover {
  background: var(--green-100);
}
.pop__close .icon {
  width: 14px;
  height: 14px;
}

.person {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  font-size: 15px;
  font-weight: 700;
  color: var(--green-900);
  background: #dbe9b9;
  border-radius: 50%;
}
.person b {
  display: block;
  font-size: 13px;
  color: var(--green-900);
}
.email {
  display: block;
  margin: 1px 0 4px;
  font-size: 10.5px;
  color: var(--muted);
}

hr {
  height: 1px;
  margin: 14px 0;
  background: var(--line);
  border: 0;
}

.section {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--green-900);
}
.section .icon {
  width: 14px;
  height: 14px;
}

.rows {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 11px 8px;
  margin: 0;
  font-size: 10.5px;
}
.rows dt {
  color: var(--muted);
}
.rows dd {
  margin: 0;
  color: var(--text);
}
.dd--bold {
  font-weight: 700;
  color: var(--green-900);
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 700;
  color: var(--green-900);
  background: var(--green-100);
  border-radius: 999px;
}
.status i {
  width: 4px;
  height: 4px;
  background: var(--green-500);
  border-radius: 50%;
}

.actions {
  display: flex;
  gap: 8px;
}
.actions .btn {
  justify-content: center;
  padding: 10px 14px;
  font-size: 11px;
  border-radius: 10px;
}
.actions .btn--solid {
  flex: 1;
}
.actions .btn .icon {
  width: 13px;
  height: 13px;
}
</style>