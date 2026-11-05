<script setup>
import { ref } from 'vue'
import SignInView from './views/SignInView.vue'

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
  <SignInView v-if="!isLoggedIn" @submit="handleSignIn" />

  <div v-else style="padding: 40px; text-align: center; font-family: sans-serif;">
    <h1>Dummy Dashboard</h1>
    <p>Anda berhasil masuk dengan email <strong>{{ userEmail }}</strong></p>
    <button 
      @click="handleLogout" 
      style="margin-top: 20px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 8px; cursor: pointer;"
    >
      Sign Out
    </button>
  </div>
</template>