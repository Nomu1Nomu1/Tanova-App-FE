<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from './Icon.vue'
import ProfilePopover from './ProfilePopover.vue'
import heroIllustration from '../assets/icons/hero-illustration.svg'

defineProps({
  active: { type: String, default: 'dashboard' },
  statusLabel: { type: String, default: 'STATUS DEVICE' },
  statusBadge: { type: String, default: 'Connected' },
  dashboardLabel: { type: String, default: 'Dashboard' },
  profile: { type: Object, default: undefined },
})
const emit = defineEmits(['navigate', 'logout', 'editProfile'])

const menus = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'device', label: 'Tanova Device', icon: 'device' },
  { key: 'ai', label: 'Tanova AI', icon: 'chart' },
]

// Dropdown mode (Otomatis / Manual)
const modeOpen = ref(false)
const mode = ref('Otomatis')
const modes = ['Otomatis', 'Manual']

function pickMode(m) {
  mode.value = m
  modeOpen.value = false
}

// ==============================
// SIDEBAR DRAWER (khusus HP)
// ==============================
const sideOpen = ref(false)

function openSide() {
  sideOpen.value = true
}

function closeSide() {
  sideOpen.value = false
}

// Navigasi tetap sama, di HP drawer ikut tertutup setelah memilih menu
function goTo(key) {
  emit('navigate', key)
  closeSide()
}

function onKeydown(e) {
  if (e.key === 'Escape' && sideOpen.value) closeSide()
}

// Kunci scroll halaman saat drawer terbuka
watch(sideOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="dash">
    <!-- Latar gelap di belakang drawer (hanya tampil di HP) -->
    <div v-if="sideOpen" class="side__backdrop" aria-hidden="true" @click="closeSide"></div>

    <!-- ========== SIDEBAR ========== -->
    <aside id="dash-sidebar" class="side" :class="{ 'side--open': sideOpen }">
      <div>
        <div class="side__brand">
          <span class="logo"><img :src="heroIllustration" alt="Tanova" /></span>
          <div>
            <strong>Sistem Aktif</strong>
            <button
              type="button"
              class="mode__toggle"
              :aria-expanded="modeOpen"
              @click="modeOpen = !modeOpen"
            >
              Mode: {{ mode }}
              <Icon name="chevron" class="chev" :class="{ 'chev--open': modeOpen }" />
            </button>
          </div>
        </div>

        <div v-if="modeOpen" class="mode__menu" role="listbox">
          <button
            v-for="m in modes"
            :key="m"
            type="button"
            role="option"
            class="mode__option"
            :class="{ 'mode__option--active': mode === m }"
            :aria-selected="mode === m"
            @click="pickMode(m)"
          >
            {{ m }}
          </button>
        </div>

        <nav class="side__nav">
          <button
            v-for="m in menus"
            :key="m.key"
            type="button"
            class="nav__item"
            :class="{ 'nav__item--active': active === m.key }"
            @click="goTo(m.key)"
          >
            <Icon :name="active === m.key ? m.icon + 'White' : m.icon" :fallback="m.icon" />
            <span>{{ m.key === 'dashboard' ? dashboardLabel : m.label }}</span>
          </button>
        </nav>
      </div>

      <div class="side__status">
        <p>{{ statusLabel }}</p>
        <div class="device">
          <Icon name="device" />
          <span>Tanova Grove - 1</span>
          <em>{{ statusBadge }}</em>
        </div>
      </div>
    </aside>

    <!-- ========== KONTEN ========== -->
    <main class="main">
      <header class="topbar">
        <div class="topbar__brand">
          <!-- Tombol menu: hanya tampil di HP -->
          <button
            type="button"
            class="topbar__menu"
            aria-label="Buka menu"
            aria-controls="dash-sidebar"
            :aria-expanded="sideOpen"
            @click="openSide"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span class="logo logo--sm"><img :src="heroIllustration" alt="Tanova" /></span>
          <strong>Tanova</strong>
        </div>
        <div class="topbar__actions">
          <Icon name="bellFill" />
          <ProfilePopover :profile="profile" @edit="emit('editProfile')" @logout="emit('logout')" />
        </div>
      </header>

      <slot :mode="mode" />
    </main>
  </div>
</template>

<!-- ============ Gaya bersama (dipakai semua halaman di dalam layout) ============ -->
<style>
.dash {
  /* --green-500 (#93ba39) diambil dari src/assets/styles/tokens.css */
  --green-700: #5b8c1a;
  --green-900: #3a5f0b;
  --green-100: #eef5dc;
  --green-50: #f4f9e8;
  --text: #2f4a0a;
  --muted: #5f6b52;
  --line: #e6ebdb;
  --yellow-bg: #fde68a;
  --yellow-text: #a16207;
  --orange: #f59e0b;
  --red-bg: #fecdd3;
  --red-text: #c81e3a;
  --red: #dc2626;

  display: flex;
  min-height: 100vh;
  background: #fff;
  color: var(--text);
  font-family: inherit;
}

.dash .icon {
  width: 16px;
  height: 16px;
}
.dash b {
  font-weight: 600;
}
.dash h1,
.dash h3,
.dash h4,
.dash p {
  margin: 0;
}

.dash .page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Judul halaman */
.dash .head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.dash .head h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--green-900);
}
.dash .head p {
  margin-top: 4px;
  font-size: 11px;
  color: var(--muted);
}
.dash .head__actions {
  display: flex;
  gap: 10px;
}

/* Tombol */
.dash .btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font: inherit;
  font-size: 11px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: filter 0.15s ease;
}
.dash .btn:hover {
  filter: brightness(0.96);
}
.dash .btn--ghost {
  color: var(--green-900);
  background: #fff;
  border: 1px solid #e3e8d8;
}
.dash .btn--solid {
  color: #fff;
  background: var(--green-500);
  border: 0;
}
.dash .btn--tiny {
  padding: 6px 10px;
  font-size: 10px;
  color: var(--muted);
  background: var(--green-50);
  border: 1px solid #e3e8d8;
  border-radius: 6px;
}
.dash .btn--tiny .icon {
  width: 12px;
  height: 12px;
}

/* Kartu */
.dash .card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(58, 95, 11, 0.12);
}

/* Kartu metrik */
.dash .metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.dash .metric {
  padding: 14px 16px;
}
.dash .metric__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--muted);
}
.dash .chip {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  color: var(--green-700);
  background: var(--green-100);
  border-radius: 6px;
}
.dash .chip .icon {
  width: 13px;
  height: 13px;
}
.dash .chip--orange {
  color: var(--orange);
  background: #fef3c7;
}
.dash .metric__value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 8px 0 6px;
  color: var(--green-900);
}
.dash .metric__value b {
  font-size: 30px;
  font-weight: 700;
  line-height: 1;
}
.dash .metric__value small {
  font-size: 12px;
  color: var(--muted);
}
.dash .metric p {
  font-size: 9.5px;
  color: var(--muted);
}

/* Baris dua kolom + panel */
.dash .row {
  display: grid;
  grid-template-columns: 2.35fr 1fr;
  gap: 16px;
}
.dash .panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 16px;
}
.dash .panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
.dash .panel h3 {
  font-size: 12px;
  font-weight: 700;
  color: var(--green-900);
}
.dash .panel__head p {
  margin-top: 2px;
  font-size: 10px;
  color: var(--muted);
}
.dash .panel h4 {
  margin-top: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--green-900);
}

/* Pil status */
.dash .pill {
  padding: 3px 9px;
  font-size: 9px;
  font-weight: 600;
  border-radius: 999px;
  white-space: nowrap;
}
.dash .pill--soft {
  color: var(--green-900);
  background: var(--green-100);
}
.dash .pill--on {
  padding: 3px 12px;
  color: #fff;
  background: var(--green-700);
}
.dash .pill--orange {
  color: #fff;
  background: var(--orange);
}

@media (max-width: 1100px) {
  .dash .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 860px) {
  .dash .row {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .dash .metrics {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- ============ Gaya khusus sidebar & top bar ============ -->
<style scoped>
.side {
  width: 220px;
  flex: none;
  position: sticky;
  top: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 16px;
  background: #fff;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.06);
}

.side__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
  margin-bottom: 32px;
}
.side__brand strong {
  display: block;
  font-size: 16px;
  color: var(--green-900);
}

.mode__toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0;
  font: inherit;
  font-size: 11px;
  color: var(--green-500);
  background: none;
  border: 0;
  cursor: pointer;
}
.chev {
  width: 12px !important;
  height: 12px !important;
  transition: transform 0.15s ease;
}
.chev--open {
  transform: rotate(180deg);
}

.mode__menu {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: -16px 0 24px;
  padding: 14px 12px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.14);
}
.mode__option {
  padding: 8px 12px;
  font: inherit;
  font-size: 11px;
  font-weight: 700;
  color: var(--green-900);
  text-align: center;
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.mode__option:hover {
  background: var(--green-100);
}
.mode__option--active,
.mode__option--active:hover {
  color: #fff;
  background: var(--green-500);
}

.logo {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--green-700);
  color: #fff;
  overflow: hidden;
}
.logo img {
  display: block;
  width: 62%;
  height: 62%;
  object-fit: contain;
}
.logo--sm {
  width: 34px;
  height: 34px;
}

.side__nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.nav__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--green-900);
  text-align: left;
  background: transparent;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.nav__item:hover {
  background: var(--green-100);
}
.nav__item--active,
.nav__item--active:hover {
  color: #fff;
  background: var(--green-500);
}

.side__status p {
  margin-bottom: 8px;
  padding: 0 4px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: var(--green-900);
}
.device {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  font-size: 11px;
  font-weight: 600;
  background: var(--green-100);
  border-radius: 8px;
}
.device em {
  margin-left: auto;
  padding: 3px 8px;
  font-size: 9px;
  font-style: normal;
  font-weight: 600;
  color: #fff;
  background: var(--green-700);
  border-radius: 999px;
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px 32px;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: var(--green-100);
  border-radius: 16px;
}
.topbar__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: var(--green-900);
}
.topbar__actions {
  display: flex;
  align-items: center;
  gap: 14px;
  color: var(--green-900);
}
.topbar__actions .icon {
  width: 18px;
  height: 18px;
}

/* Tombol hamburger & latar drawer: disembunyikan di desktop */
.topbar__menu {
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--green-900);
  background: #fff;
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}

.side__backdrop {
  display: none;
}

/* =====================================================
   RESPONSIVE (HP & tablet kecil)
   Sidebar berubah jadi drawer yang dibuka lewat tombol
   hamburger di topbar. Tampilan desktop tidak berubah.
   ===================================================== */
@media (max-width: 860px) {
  .side {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: min(260px, 85vw);
    height: 100%;
    height: 100dvh;
    overflow-y: auto;
    transform: translateX(-100%);
    visibility: hidden;
    transition: transform 0.25s ease, visibility 0s linear 0.25s;
    box-shadow: none;
  }

  .side--open {
    transform: translateX(0);
    visibility: visible;
    transition: transform 0.25s ease, visibility 0s;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
  }

  .side__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 40;
    background: rgba(0, 0, 0, 0.4);
  }

  .topbar__menu {
    display: grid;
  }

  .nav__item {
    min-height: 44px;
  }

  .mode__toggle {
    min-height: 24px;
  }
}

@media (max-width: 520px) {
  .main {
    gap: 16px;
    padding: 14px 14px 24px;
  }

  .topbar {
    padding: 10px 12px;
    border-radius: 14px;
  }

  .topbar__actions {
    gap: 10px;
  }
}
</style>