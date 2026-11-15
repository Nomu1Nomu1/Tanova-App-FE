<script setup>
import { computed } from 'vue'

// Semua file .svg di src/assets/icons dibaca otomatis (sama seperti
// `import xxx from '../assets/icons/xxx.svg'`, tapi tidak perlu ditulis satu per satu)
const urls = import.meta.glob('../assets/icons/*.svg', { eager: true, query: '?url', import: 'default' })
const raws = import.meta.glob('../assets/icons/*.svg', { eager: true, query: '?raw', import: 'default' })

const props = defineProps({
  name: { type: String, required: true },
  // Dipakai kalau file untuk `name` tidak ada (contoh: gridWhite.svg -> grid.svg)
  fallback: { type: String, default: '' },
})

const path = (n) => `../assets/icons/${n}.svg`

const file = computed(() => {
  const key = [props.name, props.fallback].find((n) => n && urls[path(n)])
  if (!key) {
    console.warn(`[Icon] File "src/assets/icons/${props.name}.svg" tidak ditemukan`)
    return null
  }
  const url = urls[path(key)]
  // File yang memakai currentColor ikut warna teks (dipakai ikon bawaan).
  // File dengan warna sendiri (hasil export Figma) ditampilkan apa adanya lewat <img>.
  const tint = raws[path(key)].includes('currentColor')
  return { url, tint }
})
</script>

<template>
  <span
    v-if="file && file.tint"
    class="icon"
    aria-hidden="true"
    :style="{ '--icon-src': `url('${file.url}')` }"
  ></span>
  <img v-else-if="file" class="icon icon--img" :src="file.url" alt="" aria-hidden="true" />
  <span v-else class="icon icon--missing" aria-hidden="true"></span>
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
.icon--img {
  background: none;
  -webkit-mask: none;
  mask: none;
  object-fit: contain;
}
.icon--missing {
  background: none;
  -webkit-mask: none;
  mask: none;
}
</style>