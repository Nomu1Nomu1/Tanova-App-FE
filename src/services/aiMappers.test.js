// Jalankan:  node --test src/services/aiMappers.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { mapGrowth, mapDiagnosis, mapDiagnoses, mapRisks, toList, formatStamp } from './aiMappers.js'

const day = (n, v) => ({ date: `2026-10-${String(n).padStart(2, '0')}T00:00:00Z`, health_score: v })

test('toList membuka pembungkus data', () => {
  assert.deepEqual(toList([1, 2]), [1, 2])
  assert.deepEqual(toList({ data: { items: [1] } }), [1])
  assert.deepEqual(toList({ foo: 1 }), [])
  assert.deepEqual(toList(null), [])
})

test('mapGrowth: 14 titik -> minggu ini dan minggu sebelumnya, nilai 0..1', () => {
  const raw = { data: Array.from({ length: 14 }, (_, i) => day(i + 1, 50 + i)) }
  const g = mapGrowth(raw)
  assert.equal(g.thisWeek.length, 7)
  assert.equal(g.lastWeek.length, 7)
  assert.equal(g.days.length, 7)
  for (const v of [...g.thisWeek, ...g.lastWeek]) assert.ok(v >= 0 && v <= 1)
  assert.equal(g.lastWeek[0], 0) // nilai terkecil
  assert.equal(g.thisWeek[6], 1) // nilai terbesar
})

test('mapGrowth: kurang dari 14 titik -> lastWeek null', () => {
  const g = mapGrowth([day(1, 10), day(2, 20), day(3, 15)])
  assert.equal(g.thisWeek.length, 3)
  assert.equal(g.lastWeek, null)
})

test('mapGrowth: data tidak layak -> null', () => {
  assert.equal(mapGrowth(null), null)
  assert.equal(mapGrowth([]), null)
  assert.equal(mapGrowth([{ height: 3 }]), null)
  assert.equal(mapGrowth([{ foo: 1 }, { foo: 2 }]), null)
})

test('mapGrowth: nilai sama semua -> garis tengah', () => {
  const g = mapGrowth([day(1, 5), day(2, 5)])
  assert.deepEqual(g.thisWeek, [0.5, 0.5])
})

test('mapDiagnosis: field snake_case, confidence 0..1, foto relatif, waktu WIB', () => {
  const d = mapDiagnosis(
    {
      id: 'abc',
      diagnosis: 'Kutu Daun',
      confidence: 0.873,
      zone: 'Zona A – Tower 2',
      photo_url: '/uploads/a.jpg',
      created_at: '2026-10-10T07:20:00Z',
      recommendation: 'Pisahkan tanaman terdampak.',
    },
    'https://tanova-backend.onrender.com',
  )
  assert.equal(d.id, 'abc')
  assert.equal(d.name, 'Kutu Daun')
  assert.equal(d.conf, 87)
  assert.equal(d.photo, 'https://tanova-backend.onrender.com/uploads/a.jpg')
  assert.equal(d.stamp, '10 Okt 2026 · 14:20 WIB')
  assert.equal(d.time, '14:20 WIB')
  assert.equal(d.kind, 'pest')
  assert.equal(d.ok, false)
  assert.equal(d.advice, 'Pisahkan tanaman terdampak.')
})

test('mapDiagnosis: confidence persen, sehat, dan penyakit', () => {
  assert.equal(mapDiagnosis({ result: 'Sehat', confidence: 96 }).conf, 96)
  assert.equal(mapDiagnosis({ result: 'Sehat' }).ok, true)
  assert.equal(mapDiagnosis({ result: 'Sehat' }).kind, 'healthy')
  assert.equal(mapDiagnosis({ label: 'Busuk Akar' }).kind, 'disease')
  assert.equal(mapDiagnosis({ label: 'Tip Burn (Defisiensi Kalsium)' }).kind, 'disease')
  assert.equal(mapDiagnosis({ label: 'X', category: 'pest' }).kind, 'pest')
})

test('mapDiagnosis: data kosong tidak error dan memakai nilai bawaan', () => {
  const d = mapDiagnosis({})
  assert.equal(d.name, 'Tidak diketahui')
  assert.equal(d.zone, 'Zona -')
  assert.equal(d.conf, null)
  assert.equal(d.photo, null)
  assert.equal(d.stamp, '')
})

test('mapDiagnosis: rekomendasi bisa array atau objek', () => {
  assert.equal(mapDiagnosis({ recommendations: ['A.', 'B.'] }).advice, 'A. B.')
  assert.equal(mapDiagnosis({ recommendation: { text: 'Cek pH.' } }).advice, 'Cek pH.')
})

test('mapDiagnoses: terbaru di atas', () => {
  const list = mapDiagnoses({
    items: [
      { id: 1, created_at: '2026-10-08T01:00:00Z' },
      { id: 3, created_at: '2026-10-10T01:00:00Z' },
      { id: 2, created_at: '2026-10-09T01:00:00Z' },
    ],
  })
  assert.deepEqual(list.map((d) => d.id), [3, 2, 1])
})

test('mapRisks: ambil hama dan penyakit terbaru, null kalau tidak ada', () => {
  const list = mapDiagnoses([
    { id: 1, diagnosis: 'Sehat', created_at: '2026-10-10T08:00:00Z' },
    { id: 2, diagnosis: 'Kutu Daun', zone: 'Zona A', created_at: '2026-10-10T07:20:00Z' },
    { id: 3, diagnosis: 'Busuk Akar', zone: 'Zona B', created_at: '2026-10-09T07:20:00Z' },
  ])
  const r = mapRisks(list)
  assert.equal(r.pest.found, 'Terdeteksi: Kutu Daun')
  assert.equal(r.pest.zone, 'Zona A')
  assert.equal(r.disease.found, 'Terdeteksi: Busuk Akar')
  assert.equal(r.disease.advice, 'Belum ada rekomendasi dari AI.')

  const none = mapRisks(mapDiagnoses([{ diagnosis: 'Sehat' }]))
  assert.equal(none.pest, null)
  assert.equal(none.disease, null)
})

test('formatStamp: tanggal berganti mengikuti WIB', () => {
  // 23:30 UTC = 06:30 WIB hari berikutnya
  assert.equal(formatStamp(Date.parse('2026-10-09T23:30:00Z')), '10 Okt 2026 · 06:30 WIB')
})

test('mapDiagnosis: enum dari dokumentasi (category, severity, recommended_actions, captured_at)', () => {
  const healthy = mapDiagnosis({ label: 'Daun normal', category: 'leaf_health', severity: 'none', confidence: 0.95 })
  assert.equal(healthy.ok, true)
  assert.equal(healthy.kind, 'healthy')

  const nutrient = mapDiagnosis({
    label: 'Tip Burn',
    category: 'nutrient',
    severity: 'medium',
    recommended_actions: ['Periksa pH.', 'Tambah kalsium.'],
    captured_at: '2026-10-10T07:20:00Z',
  })
  assert.equal(nutrient.kind, 'disease')
  assert.equal(nutrient.advice, 'Periksa pH. Tambah kalsium.')
  assert.equal(nutrient.stamp, '10 Okt 2026 · 14:20 WIB')

  assert.equal(mapDiagnosis({ label: 'Kutu daun', category: 'pest', severity: 'high' }).kind, 'pest')
})