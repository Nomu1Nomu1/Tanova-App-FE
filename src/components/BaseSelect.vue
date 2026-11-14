<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true }, // [{ value, label }]
  placeholder: { type: String, default: 'Pilih' },
  id: { type: String, default: undefined },
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const active = ref(0)

const selected = computed(() => props.options.find((o) => o.value === props.modelValue))

function openList() {
  open.value = true
  active.value = Math.max(0, props.options.findIndex((o) => o.value === props.modelValue))
}
function close() {
  open.value = false
}
function toggle() {
  open.value ? close() : openList()
}
function pick(o) {
  emit('update:modelValue', o.value)
  close()
}

function onKey(e) {
  const n = props.options.length
  if (e.key === 'Escape' && open.value) {
    e.stopPropagation() // supaya modal tidak ikut tertutup
    close()
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!open.value) return openList()
    active.value = (active.value + (e.key === 'ArrowDown' ? 1 : -1) + n) % n
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    open.value ? pick(props.options[active.value]) : openList()
  } else if (e.key === 'Tab') {
    close()
  }
}

function onDocDown(e) {
  if (root.value && !root.value.contains(e.target)) close()
}
onMounted(() => document.addEventListener('mousedown', onDocDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocDown))
</script>

<template>
  <div ref="root" class="bsel">
    <button
      :id="id"
      type="button"
      class="bsel__btn"
      :class="{ 'bsel__btn--empty': !selected, 'bsel__btn--open': open }"
      aria-haspopup="listbox"
      :aria-expanded="open"
      @click="toggle"
      @keydown="onKey"
    >
      <span>{{ selected ? selected.label : placeholder }}</span>
      <Icon name="triangle" class="bsel__tri" :class="{ 'bsel__tri--up': open }" />
    </button>

    <ul v-if="open" class="bsel__list" role="listbox">
      <li
        v-for="(o, i) in options"
        :key="o.value"
        role="option"
        class="bsel__opt"
        :class="{ 'bsel__opt--active': i === active }"
        :aria-selected="o.value === modelValue"
        @mousedown.prevent="pick(o)"
        @mouseenter="active = i"
      >
        {{ o.label }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.bsel {
  position: relative;
}
.bsel__btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 36px;
  padding: 0 10px 0 12px;
  font: inherit;
  font-size: 12px;
  text-align: left;
  color: var(--text);
  background: #f6f7ee;
  border: 1px solid #e6e9d6;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.bsel__btn--empty {
  color: var(--muted);
}
.bsel__btn:focus-visible,
.bsel__btn--open {
  background: #fff;
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(147, 186, 57, 0.25);
}
.bsel__tri {
  width: 18px;
  height: 18px;
  color: var(--text);
  transition: transform 0.15s ease;
}
.bsel__tri--up {
  transform: rotate(180deg);
}

.bsel__list {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 1px solid #e3e8d2;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(40, 60, 10, 0.18);
}
.bsel__opt {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--text);
  border-radius: 6px;
  cursor: pointer;
}
.bsel__opt--active {
  background: var(--green-100);
}
</style>