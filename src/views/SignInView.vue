<script setup>
import { ref } from 'vue'
import mailIcon from '../assets/icons/mail-outline.svg'
import lockIcon from '../assets/icons/lock-outline.svg'
import visibilityOffIcon from '../assets/icons/visibility-off.svg'
import heroIllustration from '../assets/icons/hero-illustration.svg'

const emit = defineEmits(['submit'])

const email = ref('')
const password = ref('')
const showPassword = ref(false)

function onSubmit() {
  emit('submit', { email: email.value, password: password.value })
}
</script>

<template>
  <main class="signin">
    <section class="signin__form-side">
      <header class="signin__title">
        <h1>Sign In</h1>
        <p>Gunakan Email dan Password yang tertera pada struk pembelian</p>
      </header>

      <form class="signin__form" @submit.prevent="onSubmit">
        <div class="card">
          <div class="field">
            <label for="email">Email</label>
            <div class="input">
              <img class="input__icon input__icon--left" :src="mailIcon" alt="" />
              <input
                id="email"
                v-model="email"
                type="email"
                name="email"
                placeholder="tanova-user@tanova.id"
                autocomplete="email"
                required
              />
            </div>
          </div>

          <div class="field">
            <label for="password">Password</label>
            <div class="input">
              <img class="input__icon input__icon--left" :src="lockIcon" alt="" />
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                placeholder="********"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                class="input__toggle"
                :class="{ 'input__toggle--active': showPassword }"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <img :src="visibilityOffIcon" alt="" />
              </button>
            </div>
          </div>
        </div>

        <a class="signin__forgot" href="#">Forget Password?</a>

        <button type="submit" class="signin__button">SIGN IN</button>
      </form>
    </section>

    <aside class="signin__hero" aria-hidden="true">
      <h2 class="hero__welcome">
        <span>Selamat Datang</span>
        <span class="hero__welcome-second">Tanovers !</span>
      </h2>
      <div class="hero__art">
        <img :src="heroIllustration" alt="" />
      </div>
    </aside>
  </main>
</template>

<style scoped>
.signin {
  /* 1 unit = 1px di desain Figma. u: skala form, h: skala panel hero */
  --u: clamp(0.7px, min(100vw / 1440, 100vh / 800), 1.4px);
  --h: clamp(0.6px, min(100vw / 1440, 100vh / 1024), 1.3px);
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: var(--bg-primary);
  overflow: clip;
}

/* ---------- Sisi kiri: form ---------- */
.signin__form-side {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: calc(28 * var(--u));
  padding: calc(24 * var(--u)) 16px;
}

.signin__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(18 * var(--u));
  width: calc(529 * var(--u));
  max-width: 100%;
  text-align: center;
}

.signin__title h1 {
  margin: 0;
  width: 100%;
  font-size: calc(71.222 * var(--u));
  font-weight: 600;
  line-height: calc(84.171 * var(--u));
  letter-spacing: calc(-0.8093 * var(--u));
  color: var(--bg-brand);
}

.signin__title p {
  margin: 0;
  width: 100%;
  font-size: calc(18.095 * var(--u));
  font-weight: 400;
  line-height: calc(21.714 * var(--u));
  letter-spacing: calc(-0.2262 * var(--u));
  color: var(--neutral-400);
}

.signin__form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(22 * var(--u));
  width: calc(553 * var(--u));
  max-width: 100%;
}

.card {
  display: flex;
  flex-direction: column;
  gap: calc(24 * var(--u));
  width: 100%;
  padding: calc(50 * var(--u)) calc(30 * var(--u));
  background: var(--bg-primary);
  border-radius: calc(16 * var(--u));
  box-shadow: var(--shadow-large);
}

.field {
  display: flex;
  flex-direction: column;
  gap: calc(5 * var(--u));
  width: 100%;
}

.field label {
  font-size: calc(18 * var(--u));
  font-weight: 400;
  line-height: calc(28 * var(--u));
  color: var(--text-primary);
}

.input {
  position: relative;
  display: flex;
  align-items: center;
  height: calc(75 * var(--u));
  background: var(--neutral-100);
  border: 1px solid var(--neutral-200);
  border-radius: calc(12 * var(--u));
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input input {
  width: 100%;
  height: 100%;
  padding: 0 calc(70 * var(--u)) 0 calc(74 * var(--u));
  font-family: inherit;
  font-size: max(16px, calc(18 * var(--u)));
  color: var(--text-primary);
  background: transparent;
  border: 0;
  border-radius: inherit;
  outline: none;
}

.input input::placeholder {
  color: var(--text-secondary);
}

.input:focus-within {
  border-color: var(--green-500);
  box-shadow: 0 0 0 3px rgba(147, 186, 57, 0.25);
}

.input__icon,
.input__toggle img {
  display: block;
  width: calc(35 * var(--u));
  height: calc(35 * var(--u));
}

.input__icon {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.input__icon--left {
  left: calc(19 * var(--u));
}

.input__toggle {
  position: absolute;
  top: 50%;
  right: calc(19 * var(--u));
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s ease;
}

.input__toggle:hover {
  opacity: 1;
}

.input__toggle--active {
  opacity: 0.4;
}

.signin__forgot {
  width: 100%;
  font-size: calc(22.678 * var(--u));
  font-weight: 400;
  line-height: calc(26.801 * var(--u));
  letter-spacing: calc(-0.2577 * var(--u));
  text-align: center;
  color: var(--neutral-400);
  text-decoration: none;
  transition: color 0.15s ease;
}

.signin__forgot:hover {
  color: var(--bg-brand);
}

.signin__button {
  padding: calc(22 * var(--u)) calc(102 * var(--u));
  font-family: inherit;
  font-size: max(14px, calc(18 * var(--u)));
  font-weight: 500;
  line-height: calc(24 * var(--u));
  letter-spacing: 0.15px;
  white-space: nowrap;
  color: var(--neutral-white);
  background: var(--green-500);
  border: 0;
  border-radius: calc(16 * var(--u));
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.1s ease;
}

.signin__button:hover {
  filter: brightness(0.95);
}

.signin__button:active {
  transform: translateY(1px);
}

.signin__button:focus-visible {
  outline: 3px solid var(--bg-brand);
  outline-offset: 3px;
}

/* ---------- Sisi kanan: hero (menempel di kanan, setinggi layar) ---------- */
.signin__hero {
  flex: 0 0 max(calc(740 * var(--h)), 44vw);
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: 100vh;
  background: var(--green-500);
  border-radius: calc(78 * var(--h)) 0 0 calc(77 * var(--h));
  overflow: hidden;
}

.hero__welcome {
  position: absolute;
  top: calc(172 * var(--h));
  left: 0;
  right: 0;
  margin: 0;
  font-size: calc(60 * var(--h));
  font-weight: 700;
  line-height: calc(72 * var(--h));
  letter-spacing: calc(-1.5 * var(--h));
  text-align: center;
  white-space: nowrap;
  color: #fff;
}

.hero__welcome span {
  display: block;
}

/* Ilustrasi dikunci ke pojok kanan-bawah panel */
.hero__art {
  position: absolute;
  right: calc(-189.5 * var(--h));
  bottom: calc(-188.6 * var(--h));
  width: calc(613.547 * var(--h));
  height: calc(861 * var(--h));
  pointer-events: none;
}

.hero__art img {
  position: absolute;
  top: -6.3%;
  left: -11.05%;
  display: block;
  max-width: none;
  width: 122.1%;
  height: 115.75%;
}

/* ---------- Responsif ---------- */
@media (max-width: 860px) {
  .signin {
    --u: min(1px, calc((100vw - 32px) / 553));
  }
  .signin__hero {
    display: none;
  }
}

@media (max-width: 480px) {
  .signin__button {
    width: 100%;
    padding-inline: 0;
  }
}
</style>
