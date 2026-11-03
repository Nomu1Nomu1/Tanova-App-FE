<script setup>
import { computed, ref } from 'vue'
import SignInView from './views/SignInView.vue'
import AppLayout from './components/AppLayout.vue'
import DashboardView from './views/DashboardView.vue'
import AiView from './views/AiView.vue'

const isLoggedIn = ref(false)
const page = ref('dashboard') // 'dashboard' | 'device' | 'ai' | 'profile'

function logout() {
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
  <SignInView v-if="!isLoggedIn" @submit="isLoggedIn = true" />

  <AppLayout
    v-else
    v-slot="{ mode }"
    :active="activeMenu"
    :status-label="statusLabel"
    :status-badge="statusBadge"
    :dashboard-label="page === 'ai' ? 'Dasbor' : 'Dashboard'"
    @navigate="page = $event"
    @edit-profile="page = 'profile'"
    @logout="logout"
  >
    <DashboardView v-if="page === 'dashboard'" :mode="mode" />
    <AiView v-else-if="page === 'ai'" />
    <!-- Halaman anggota lain: ganti blok ini dengan komponen mereka setelah di-merge -->
    <p v-else class="placeholder">
      {{ page === 'device' ? 'None' : 'None' }} 
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