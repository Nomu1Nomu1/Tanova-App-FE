<script setup>
import { computed, onMounted, ref } from 'vue'
import SignInView from './views/SignInView.vue'
import AppLayout from './components/AppLayout.vue'
import DashboardView from './views/DashboardView.vue'
import AiView from './views/AiView.vue'
import TanovaDeviceView from './components/TanovaDeviceView.vue'
import AdminView from './views/AdminView.vue'

const isLoggedIn = ref(false)
const currentUser = ref(null)
const page = ref('dashboard') // 'dashboard' | 'device' | 'ai' | 'profile'

onMounted(() => {
  const token = localStorage.getItem('tanova_token')
  const savedUser = localStorage.getItem('tanova_user')

  if (token && savedUser) {
    try {
      currentUser.value = JSON.parse(savedUser)
      isLoggedIn.value = true
    } catch {
      handleLogout()
    }
  }
})

function handleLoginSuccess(profile) {
  currentUser.value = profile
  isLoggedIn.value = true
}

function handleLogout() {
  localStorage.removeItem('tanova_token')
  localStorage.removeItem('tanova_refresh_token')
  localStorage.removeItem('tanova_user')
  currentUser.value = null
  isLoggedIn.value = false
  page.value = 'dashboard'
}

// Label di bagian bawah sidebar berbeda di tiap halaman (sesuai desain)
const onDeviceSide = computed(() => page.value === 'device' || page.value === 'ai')
const statusLabel = computed(() => (onDeviceSide.value ? 'STATUS PERANGKAT' : 'STATUS DEVICE'))
const statusBadge = computed(() => (onDeviceSide.value ? 'Terhubung' : 'Connected'))
const activeMenu = computed(() => (page.value === 'profile' ? 'dashboard' : page.value))
</script>

<template>
  <SignInView v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

  <AdminView v-else-if="currentUser?.role === 'admin'" @logout="handleLogout" />

  <AppLayout
    v-else
    v-slot="{ mode }"
    :active="activeMenu"
    :status-label="statusLabel"
    :status-badge="statusBadge"
    :dashboard-label="page === 'ai' ? 'Dasbor' : 'Dashboard'"
    @navigate="page = $event"
    @edit-profile="page = 'profile'"
    @logout="handleLogout"
  >
    <DashboardView v-if="page === 'dashboard'" :mode="mode" />
    <AiView v-else-if="page === 'ai'" />
    <TanovaDeviceView v-else-if="page === 'device'" />
    <p v-else class="placeholder">
      {{ page === 'profile' ? 'Profil Pengguna' : 'Halaman tidak ditemukan' }} 
    </p>
  </AppLayout>
</template>

<style scoped>
.placeholder {
  padding: 40px 0;
  text-align: center;
  color: #5f6b52;
}
</style>