<script setup>
import { computed } from 'vue'

// Mengambil semua file .svg di src/assets/icons secara otomatis
const files = import.meta.glob('../assets/icons/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
})

const props = defineProps({
  name: { type: String, required: true },
})

const style = computed(() => {
  const url = files[`../assets/icons/${props.name}.svg`]
  if (!url) {
    console.warn(`[Icon] File "src/assets/icons/${props.name}.svg" tidak ditemukan`)
    return {}
  }
  return { '--icon-src': `url("${url}")` }
})
</script>

<template>
  <!-- Warna ikon mengikuti warna teks (color) dari elemen induknya -->
  <span class="icon" aria-hidden="true" :style="style"></span>
</template>

<style>
:where(.icon) {
  display: inline-block;
  flex: none;
  width: 16px;
  height: 16px;
  background-color: currentColor;
  -webkit-mask: var(--icon-src) center / contain no-repeat;
  mask: var(--icon-src) center / contain no-repeat;
}
</style>