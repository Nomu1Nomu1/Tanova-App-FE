<script setup>
import { ref } from 'vue'

// Data state untuk form Edit Profil
const namaLengkap = ref('Budi Santoso')
const alamatEmail = ref('budi.santoso@example.com')
const nomorTelepon = ref('')
const zonaWaktu = ref('WIB (UTC+7)')

function handleSave() {
  alert('Perubahan profil berhasil disimpan!')
}

function handleCancel() {
  alert('Perubahan dibatalkan.')
}
</script>

<template>
  <div class="profile-container">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      Dashboard &gt; <span class="breadcrumb-active">Edit Profil</span>
    </div>

    <!-- Header Judul -->
    <h1 class="page-title">Edit Profil</h1>
    <p class="page-subtitle">
      Kelola informasi pribadi dan lihat detail akun Tanova Anda.
    </p>

    <!-- Banner Info -->
    <div class="info-banner">
      <span class="info-icon">i</span> Data contoh untuk tampilan UI, bukan informasi pengguna sebenarnya.
    </div>

    <!-- User Summary Card -->
    <div class="user-summary-card">
      <div class="user-info-left">
        <div class="user-avatar">BS</div>
        <div>
          <h3 class="user-name">Budi Santoso</h3>
          <p class="user-email">budi.santoso@example.com</p>
        </div>
      </div>
      <div class="user-info-right">
        <span class="user-role">Administrator</span>
        <span class="user-status-badge">● Aktif</span>
      </div>
    </div>

    <!-- Grid Form & Info Akun -->
    <div class="content-grid">
      
      <!-- Kolom Kiri: Informasi Pribadi -->
      <div class="card-section">
        <h3 class="section-title">Informasi Pribadi</h3>
        <p class="section-desc">Perbarui nama dan informasi kontak Anda.</p>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nama lengkap *</label>
            <input v-model="namaLengkap" type="text" class="form-input" />
            <span class="form-hint">Nama yang ditampilkan di profil Anda.</span>
          </div>
          <div class="form-group">
            <label class="form-label">Alamat email *</label>
            <input v-model="alamatEmail" type="email" class="form-input" />
            <span class="form-hint">Digunakan untuk masuk ke akun Tanova.</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nomor telepon <span class="optional-text">(opsional)</span></label>
            <input v-model="nomorTelepon" type="text" placeholder="Tambahkan nomor telepon" class="form-input" />
            <span class="form-hint">Contoh format: +62 812 3456 7890</span>
          </div>
          <div class="form-group">
            <label class="form-label">Zona waktu *</label>
            <select v-model="zonaWaktu" class="form-select">
              <option>WIB (UTC+7)</option>
              <option>WITA (UTC+8)</option>
              <option>WIT (UTC+9)</option>
            </select>
            <span class="form-hint">Untuk waktu aktivitas dan notifikasi.</span>
          </div>
        </div>

        <div class="form-footer-note">
          * Wajib diisi. Perubahan diterapkan setelah Anda menyimpan.
        </div>
      </div>

      <!-- Kolom Kanan: Informasi Akun -->
      <div class="card-section account-info-card">
        <div class="account-header">
          <div class="account-icon-box">
            <div class="user-icon-head"></div>
            <div class="user-icon-body"></div>
          </div>
          <div class="account-title-wrapper">
            <h3 class="section-title">Informasi Akun</h3>
            <p class="section-desc">Detail akun saat ini - Hanya baca</p>
          </div>
        </div>

        <div class="account-info-item">
          <span class="account-label">Status akun</span>
          <span class="account-value active">● Aktif</span>
        </div>
        <div class="account-info-item">
          <span class="account-label">Perangkat</span>
          <span class="account-value">Tanova Grove - 1</span>
        </div>
        <div class="account-info-item">
          <span class="account-label">Bergabung</span>
          <span class="account-value">1 September 2026</span>
        </div>
        <div class="account-info-item last">
          <span class="account-label">Zona waktu</span>
          <span class="account-value">WIB (UTC+7)</span>
        </div>

        <div class="system-note">
          <span class="lock-icon">🔒</span> Peran, status, perangkat, dan tanggal bergabung dikelola oleh sistem.
        </div>
      </div>
      </div>

    </div>

    <!-- Footer Action Bar -->
    <div class="action-bar">
      <div>
        <h4 class="action-title">Pastikan informasi Anda sudah benar</h4>
        <p class="action-desc">Batal untuk kembali tanpa menyimpan perubahan.</p>
      </div>
      <div class="action-buttons">
        <button @click="handleCancel" class="btn-cancel">Batal</button>
        <button @click="handleSave" class="btn-save">Simpan Perubahan</button>
      </div>
    </div>
</template>

<style scoped>
.profile-container {
  padding: 30px;
  font-family: sans-serif;
  background: #f9fbf8;
  min-height: 100vh;
}

.breadcrumb {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.breadcrumb-active {
  color: #93BA39;
  font-weight: 500;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #111;
  margin-bottom: 5px;
}

.page-subtitle {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
}

.info-banner {
  background: #E5F2CC;
  border: 1px solid #d4edda;
  padding: 12px 16px;
  border-radius: 8px;
  color: #3b5c12;
  font-size: 14px;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-icon {
  width: 18px;
  height: 18px;
  background: #93BA39;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
}

.user-summary-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 25px;
}

.user-info-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-avatar {
  width: 56px;
  height: 56px;
  background: #E5F2CC;
  color: #93BA39;
  font-weight: bold;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  color: #222;
}

.user-email {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0 0;
}

.user-info-right {
  text-align: right;
}

.user-role {
  font-size: 13px;
  color: #555;
  display: block;
  margin-bottom: 4px;
}

.user-status-badge {
  background: #E5F2CC;
  color: #558b2f;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 30px;
}

.card-section {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
}

.account-info-card {
  height: fit-content;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
  color: #222;
}

.section-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 6px;
  color: #333;
}

.optional-text {
  color: #888;
  font-weight: normal;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus {
  border-color: #93BA39;
  outline: none;
}

.form-hint {
  font-size: 11px;
  color: #888;
  margin-top: 4px;
}

.form-footer-note {
  margin-top: 25px;
  border-top: 1px solid #eee;
  padding-top: 15px;
  font-size: 12px;
  color: #666;
}

.account-info-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}

.account-info-item.last {
  margin-bottom: 20px;
  border-bottom: none;
  padding-bottom: 0;
}

.account-label {
  color: #666;
}

.account-value {
  font-weight: 500;
  color: #222;
}

.account-value.active {
  color: #558b2f;
}

.account-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 20px;
}

.account-icon-box {
  width: 40px;
  height: 40px;
  background: #E5F2CC;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
  margin-top: 2px;
}

.account-title-wrapper {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 2px 0;
  color: #222;
  line-height: 1.2;
}

.section-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.2;
}

.user-icon-head {
  width: 10px;
  height: 10px;
  border: 2px solid #558b2f;
  border-radius: 50%;
  margin-bottom: 2px;
}

.user-icon-body {
  width: 16px;
  height: 8px;
  border: 2px solid #558b2f;
  border-bottom: none;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.account-icon-inner {
  width: 16px;
  height: 16px;
  border: 2px solid #93BA39;
  border-radius: 3px;
  display: inline-block;
}

.system-note {
  background: #E5F2CC;
  border: 1px solid #d4edda;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 12px;
  color: #3b5c12;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  line-height: 1.4;
}

.lock-icon {
  font-size: 12px;
}

.action-bar {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-title {
  font-size: 14px;
  font-weight: bold;
  margin: 0;
  color: #222;
}

.action-desc {
  font-size: 12px;
  color: #666;
  margin: 2px 0 0 0;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  color: #333;
}

.btn-cancel:hover {
  background: #f5f5f5;
}

.btn-save {
  padding: 10px 20px;
  background: #93BA39;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-save:hover {
  background: #82a532;
}
</style>