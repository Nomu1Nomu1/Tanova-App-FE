<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import Icon from './Icon.vue'
import BaseSelect from './BaseSelect.vue'

defineProps({
  deviceName: { type: String, default: 'Tanova Grove – 1' },
})
const emit = defineEmits(['close', 'save'])

const parameters = [
  { value: 'temp', label: 'Suhu Air', noun: 'suhu air', unit: '°C', ideal: '20–24 °C' },
  { value: 'ec', label: 'EC/TDS', noun: 'EC/TDS', unit: 'mS/cm', ideal: '1.3–1.5 mS/cm' },
  { value: 'ph', label: 'pH Larutan', noun: 'pH larutan', unit: 'pH', ideal: '5.8–6.2' },
  { value: 'level', label: 'Level Tangki', noun: 'level tangki', unit: '%', ideal: '≥ 75%' },
]

const conditions = [
  { value: 'lt', label: 'Lebih kecil dari (<)', symbol: '<', phrase: 'di bawah' },
  { value: 'gt', label: 'Lebih besar dari (>)', symbol: '>', phrase: 'melewati' },
  { value: 'eq', label: 'Sama dengan (=)', symbol: '=', phrase: 'sama dengan' },
]

const levels = [
  { value: 'info', label: 'Informasi', dot: 'dot--green', action: 'tampilkan informasi' },
  { value: 'warning', label: 'Peringatan', dot: 'dot--orange', action: 'tampilkan peringatan' },
  { value: 'critical', label: 'Kritis', dot: 'dot--red', action: 'tampilkan peringatan kritis' },
]

const form = reactive({
  name: '',
  parameter: '',
  condition: '',
  threshold: 0,
  level: '',
  viaDashboard: false,
  viaEmail: false,
})

const submitted = ref(false)
const nameInput = ref(null)

const param = computed(() => parameters.find((x) => x.value === form.parameter))
const cond = computed(() => conditions.find((x) => x.value === form.condition))

const errors = computed(() => ({
  name: form.name.trim() ? '' : 'Nama peringatan wajib diisi.',
  parameter: form.parameter ? '' : 'Pilih parameter yang dipantau.',
  condition: form.condition ? '' : 'Pilih kondisi pemicu.',
  threshold: form.threshold === '' || Number.isNaN(Number(form.threshold)) ? 'Isi nilai ambang.' : '',
  level: form.level ? '' : 'Pilih tingkat peringatan.',
}))

const hint = computed(() => {
  const p = param.value?.noun ?? 'suhu air'
  const c = cond.value?.phrase ?? 'melewati'
  return `Peringatan muncul saat ${p} ${c} nilai ambang.`
})

// Ringkasan otomatis, muncul setelah form terisi
const summary = computed(() => {
  if (!param.value || !cond.value || !form.level || errors.value.threshold) return ''
  const unit = param.value.unit === '%' ? '%' : ` ${param.value.unit}`
  const via = [form.viaDashboard && 'notifikasi dashboard', form.viaEmail && 'email']
    .filter(Boolean)
    .join(' dan ')
  const action = levels.find((l) => l.value === form.level).action
  return `Jika ${param.value.label} ${cond.value.symbol} ${form.threshold}${unit}, ${action}${via ? ` dan kirim ${via}` : ''}.`
})

function submit() {
  submitted.value = true
  if (Object.values(errors.value).some(Boolean)) return
  emit('save', { ...form, name: form.name.trim(), threshold: Number(form.threshold) })
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  nextTick(() => nameInput.value?.focus())
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="backdrop" @mousedown.self="emit('close')">
    <form
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alert-title"
      novalidate
      @submit.prevent="submit"
    >
      <header class="modal__head">
        <span class="modal__icon">
          <Icon name="bell" />
        </span>
        <div>
          <h2 id="alert-title">Tambah Peringatan</h2>
          <p>Atur batas sensor untuk {{ deviceName }}.</p>
        </div>
        <button type="button" class="modal__close" aria-label="Tutup" @click="emit('close')">
          <Icon name="close" />
        </button>
      </header>

      <div class="modal__body">
        <div class="field">
          <label for="al-name">Nama peringatan</label>
          <input id="al-name" ref="nameInput" v-model="form.name" type="text" class="control control--soft" />
          <small v-if="submitted && errors.name" class="err">{{ errors.name }}</small>
        </div>

        <div class="field">
          <label for="al-param">Parameter yang dipantau</label>
          <BaseSelect id="al-param" v-model="form.parameter" :options="parameters" placeholder="Pilih Parameter" />
          <small v-if="submitted && errors.parameter" class="err">{{ errors.parameter }}</small>
          <p v-if="param" class="hint">Rentang ideal untuk selada: {{ param.ideal }}.</p>
        </div>

        <div class="split">
          <div class="field">
            <label for="al-cond">Kondisi pemicu</label>
            <BaseSelect id="al-cond" v-model="form.condition" :options="conditions" placeholder="Pilih Kondisi Pemicu" />
            <small v-if="submitted && errors.condition" class="err">{{ errors.condition }}</small>
          </div>
          <div class="field">
            <label for="al-thr">Nilai ambang</label>
            <div class="unit">
              <input id="al-thr" v-model="form.threshold" type="number" step="any" class="control" :class="{ 'control--unit': param }" />
              <span v-if="param" class="unit__chip">{{ param.unit }}</span>
            </div>
            <small v-if="submitted && errors.threshold" class="err">{{ errors.threshold }}</small>
          </div>
        </div>
        <p class="hint hint--tight">{{ hint }}</p>

        <fieldset class="field">
          <legend>Tingkat peringatan</legend>
          <div class="opts opts--3">
            <label v-for="l in levels" :key="l.value" class="opt">
              <input v-model="form.level" type="radio" name="level" :value="l.value" />
              <span>{{ l.label }}</span>
              <i class="dot" :class="l.dot"></i>
            </label>
          </div>
          <small v-if="submitted && errors.level" class="err">{{ errors.level }}</small>
        </fieldset>

        <fieldset class="field">
          <legend>Kirim notifikasi melalui</legend>
          <div class="opts opts--2">
            <label class="opt">
              <input v-model="form.viaDashboard" type="checkbox" />
              <span>Notifikasi dashboard</span>
            </label>
            <label class="opt">
              <input v-model="form.viaEmail" type="checkbox" />
              <span>Email</span>
            </label>
          </div>
          <p class="hint">Dikirim saat kondisi pemicu pertama kali terpenuhi.</p>
        </fieldset>

        <div v-if="summary" class="summary" role="status">
          <Icon name="info" />
          <div>
            <b>Ringkasan peringatan</b>
            <p>{{ summary }}</p>
          </div>
        </div>
      </div>

      <footer class="modal__foot">
        <span>Aktif setelah disimpan</span>
        <div class="modal__actions">
          <button type="button" class="btn btn--ghost" @click="emit('close')">Batal</button>
          <button type="submit" class="btn btn--solid">
            <Icon name="save" />
            Simpan Peringatan
          </button>
        </div>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow-y: auto;
  background: rgba(120, 150, 60, 0.35);
  backdrop-filter: blur(1px);
}

.modal {
  width: min(480px, 100%);
  margin: auto;
  background: #fffefb;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(40, 60, 10, 0.25);
  overflow: hidden;
}

.modal__head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px 16px;
  border-bottom: 1px solid #f3f0d6;
}
.modal__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: none;
  color: var(--green-700);
  background: var(--green-100);
  border-radius: 10px;
}
.modal__head h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--green-900);
}
.modal__head p {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--muted);
}
.modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  padding: 4px;
  color: var(--green-900);
  background: none;
  border: 0;
  border-radius: 6px;
  cursor: pointer;
}
.modal__close:hover {
  background: var(--green-100);
}

.modal__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 20px 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}
.field label,
.field legend {
  padding: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}
.field legend {
  margin-bottom: 6px;
}

.control {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font: inherit;
  font-size: 12px;
  color: var(--text);
  background: #f6f7ee;
  border: 1px solid #e6e9d6;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.control--soft {
  background: #f9fae9;
  border-color: #eceeb4;
}
.control:focus {
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(147, 186, 57, 0.25);
}


.split {
  display: grid;
  grid-template-columns: 1fr 130px;
  gap: 14px;
}

.hint {
  margin: 0;
  font-size: 10px;
  color: var(--muted);
}
.unit {
  position: relative;
}
.control--unit {
  padding-right: 56px;
}
.unit__chip {
  position: absolute;
  top: 50%;
  right: 6px;
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--green-900);
  background: var(--green-100);
  border-radius: 6px;
  transform: translateY(-50%);
  pointer-events: none;
}

.summary {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  font-size: 11px;
  color: var(--green-900);
  background: var(--green-100);
  border-radius: 10px;
}
.summary .icon {
  margin-top: 1px;
  color: var(--green-700);
}
.summary b {
  display: block;
  margin-bottom: 2px;
  font-size: 11px;
}
.summary p {
  margin: 0;
  line-height: 1.4;
}

.hint--tight {
  margin-top: -8px;
}
.err {
  font-size: 10px;
  color: var(--red-text);
}

.opts {
  display: grid;
  gap: 10px;
}
.opts--3 {
  grid-template-columns: repeat(3, 1fr);
}
.opts--2 {
  grid-template-columns: repeat(2, 1fr);
}
.opt {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 12px;
  font-size: 11px;
  font-weight: 400;
  color: var(--text);
  background: #fff;
  border: 1px solid #e6e9d6;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.opt:hover {
  background: var(--green-50);
}
.opt:has(input:checked) {
  background: var(--green-100);
  border-color: var(--green-500);
}
.opt input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: var(--green-700);
  cursor: pointer;
}
.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.dot--green {
  background: var(--green-500);
}
.dot--orange {
  background: var(--orange);
}
.dot--red {
  background: var(--red);
}

.modal__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  font-size: 10px;
  color: var(--muted);
  border-top: 1px solid #f3f0d6;
}
.modal__actions {
  display: flex;
  gap: 10px;
}
.modal__actions .btn {
  padding: 10px 16px;
  font-size: 12px;
  border-radius: 10px;
}
.modal__actions .btn .icon {
  width: 14px;
  height: 14px;
}

@media (max-width: 520px) {
  .split,
  .opts--3,
  .opts--2 {
    grid-template-columns: 1fr;
  }
  .modal__foot {
    flex-direction: column;
    align-items: stretch;
  }
  .modal__actions {
    justify-content: flex-end;
  }
}
</style>