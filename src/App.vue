<script setup>
import { ref } from 'vue'
import SignInView from './views/SignInView.vue'
import ProfileView from './views/ProfileView.vue'

const isLoggedIn = ref(false)
const userEmail = ref('')

function handleSignIn({ email, password }) {
  console.log('sign in', email, password.length)
  
  userEmail.value = email
  isLoggedIn.value = true
}

function handleLogout() {
  isLoggedIn.value = false
  userEmail.value = ''
}
</script>

<template>
  <!-- Tampilkan halaman Sign In jika belum login -->
  <SignInView v-if="!isLoggedIn" @submit="handleSignIn" />

  <!-- Jika sudah login, kita tampilkan halaman ProfileView (atau gabungkan dengan navigasi) -->
  <div v-else>
    <!-- Tombol logout sementara di atas profil agar mudah diuji -->
    <div style="background: #f1f1f1; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 14px; font-weight: 500;">Masuk sebagai: {{ userEmail }}</span>
      <button 
        @click="handleLogout" 
        style="padding: 6px 14px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px;"
      >
        Sign Out
      </button>
    </div>

    <!-- Halaman Edit Profil Anda -->
    <ProfileView />
  </div>
</template>