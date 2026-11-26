<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { api } from '../services/api'

const props = defineProps({
  user: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['close', 'saved'])

const form = reactive({
  name: props.user?.name || '',
  username: props.user?.username || '',
  email: props.user?.email || '',
  phone: props.user?.phone || '',
  current_password: '',
})

const isSaving = ref(false)
const errorMsg = ref('')

async function onSave() {
  errorMsg.value = ''

  if (!form.username.trim() || !form.email.trim()) {
    errorMsg.value = 'Username dan email wajib diisi.'
    return
  }

  // Kirim hanya field yang berubah
  const body = {}
  const fields = ['name', 'username', 'email', 'phone']
  for (const key of fields) {
    const value = form[key].trim()
    if (value !== (props.user?.[key] || '')) body[key] = value
  }

  if (Object.keys(body).length === 0) {
    emit('close')
    return
  }

  // Backend mewajibkan password saat ini untuk setiap perubahan profil
  if (!form.current_password) {
    errorMsg.value = 'Password saat ini wajib diisi untuk menyimpan perubahan.'
    return
  }
  body.current_password = form.current_password

  try {
    isSaving.value = true
    await api.patchMe(body)

    const fresh = await api.getMe()
    localStorage.setItem('tanova_user', JSON.stringify(fresh))
    emit('saved', fresh)
    emit('close')
  } catch (error) {
    errorMsg.value = error.message || 'Gagal menyimpan perubahan.'
  } finally {
    isSaving.value = false
  }
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @mousedown.self="emit('close')">
      <form class="modal" role="dialog" aria-labelledby="edit-profile-title" @submit.prevent="onSave">
        <header class="modal__head">
          <h2 id="edit-profile-title">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Informasi Akun
          </h2>
          <button type="button" class="modal__close" aria-label="Tutup" @click="emit('close')">×</button>
        </header>

        <div class="modal__body">
          <div class="field">
            <label for="ep-name">Nama Lengkap</label>
            <input id="ep-name" v-model="form.name" type="text" />
          </div>

          <div class="grid">
            <div class="field">
              <label for="ep-username">Username</label>
              <input id="ep-username" v-model="form.username" type="text" autocomplete="username" required />
            </div>
            <div class="field">
              <label for="ep-email">Email</label>
              <input id="ep-email" v-model="form.email" type="email" autocomplete="email" required />
            </div>
          </div>

          <div class="field">
            <label for="ep-phone">Nomor Telepon</label>
            <input id="ep-phone" v-model="form.phone" type="tel" placeholder="+62 812 3456 7890" />
          </div>

          <div class="field">
            <label for="ep-pass">Password saat ini</label>
            <input id="ep-pass" v-model="form.current_password" type="password" autocomplete="current-password" placeholder="Masukkan password akun Anda" required />
          </div>

          <p v-if="errorMsg" class="error" role="alert">{{ errorMsg }}</p>
        </div>

        <footer class="modal__foot">
          <button type="button" class="btn-cancel" @click="emit('close')">Batal</button>
          <button type="submit" class="btn-save" :disabled="isSaving">
            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </footer>
      </form>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.45);
}

.modal {
  width: min(560px, 100%);
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  font-family: inherit;
  color: #222;
}

.modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #eee;
}
.modal__head h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}
.modal__close {
  padding: 0 6px;
  font-size: 24px;
  line-height: 1;
  color: #666;
  background: none;
  border: 0;
  cursor: pointer;
}
.modal__close:hover {
  color: #111;
}

.modal__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px 22px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
@media (max-width: 480px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.field label {
  font-size: 13px;
  font-weight: 700;
  color: #333;
}
.opt {
  font-weight: 400;
  color: #888;
}
.field input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  font: inherit;
  font-size: 14px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 8px;
}
.field input:focus {
  border-color: #93ba39;
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 186, 57, 0.25);
}

.error {
  margin: 0;
  padding: 9px 12px;
  font-size: 13px;
  color: #b3261e;
  background: #fdecea;
  border-radius: 8px;
}

.modal__foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #eee;
}
.btn-cancel,
.btn-save {
  padding: 10px 18px;
  font: inherit;
  font-size: 14px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-cancel {
  color: #333;
  background: #fff;
  border: 1px solid #ccc;
}
.btn-cancel:hover {
  background: #f5f5f5;
}
.btn-save {
  font-weight: 600;
  color: #fff;
  background: #93ba39;
  border: 0;
}
.btn-save:hover:not(:disabled) {
  background: #82a532;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: wait;
}
</style>