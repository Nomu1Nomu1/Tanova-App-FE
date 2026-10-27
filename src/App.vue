<script setup>
import SignInView from './views/SignInView.vue'

function handleSignIn({ email, password }) {
  console.log('sign in', email, password.length)
}
</script>

<template>
  <SignInView @submit="handleSignIn" />
</template>
