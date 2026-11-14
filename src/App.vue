<script setup>
import { ref, onMounted } from 'vue'
import SignInView from './views/SignInView.vue'
import TanovaDeviceView from './components/TanovaDeviceView.vue'
import AdminView from './views/AdminView.vue'

const isLoggedIn = ref(false)
const currentUser = ref(null)

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
}
</script>

<template>
  <SignInView v-if="!isLoggedIn" @login-success="handleLoginSuccess" />

  <div v-else>
    <div
      style="
        background: #f1f1f1;
        padding: 10px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #ddd;
      "
    >
      <span style="font-size: 14px; font-weight: 500">
        Masuk sebagai: {{ currentUser?.username || 'Pengguna' }} ({{ currentUser?.role || 'user' }})
      </span>
      <button
        @click="handleLogout"
        style="
          padding: 6px 14px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
        "
      >
        Sign Out
      </button>
    </div>

    <AdminView v-if="currentUser?.role === 'admin'" />
    <TanovaDeviceView v-else />
  </div>
</template>
