import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const DIR = 'src/assets/icons'
const base = 'https://www.figma.com/api/mcp/asset/'
const assets = {
  'mail-outline.svg': '554f2661-ee2d-4dbd-96df-e6361d5d2737.svg',
  'lock-outline.svg': '8426bd2e-36bf-4fad-8afa-381bd777049f.svg',
  'visibility-off.svg': '1b203a35-d707-4694-89b3-4e3d6cf603d7.svg',
  'hero-illustration.svg': 'd590c531-2910-4885-949d-e514feefd6a5.svg',
}

await mkdir(DIR, { recursive: true })
let failed = 0

for (const [name, id] of Object.entries(assets)) {
  try {
    const res = await fetch(base + id)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    if (!text.includes('<svg')) throw new Error('bukan SVG')
    await writeFile(join(DIR, name), text)
    console.log(`OK    ${name} (${text.length} bytes)`)
  } catch (err) {
    failed++
    console.log(`GAGAL ${name}: ${err.message}`)
  }
}

process.exitCode = failed ? 1 : 0