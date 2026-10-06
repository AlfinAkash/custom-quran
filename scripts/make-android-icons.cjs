// Makes every Android icon size from assets/icon-only.png (run after "cap add android")
const sharp = require('sharp'), fs = require('fs'), path = require('path')
const res = process.env.RES || path.join('android', 'app', 'src', 'main', 'res')
const src = path.join('assets', 'icon-only.png')
if (!fs.existsSync(src)) { console.error('assets/icon-only.png not found. Run the customize step first.'); process.exit(1) }
if (!process.env.RES && !fs.existsSync(res)) { console.error('Android project not found. Create it first.'); process.exit(1) }
let bg = '#0B2E2A'
try { bg = JSON.parse(fs.readFileSync(path.join('src', 'edition.json'), 'utf8')).bg || bg } catch { /* default */ }
const D = { mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] }
const old = /^ic_launcher(_round|_foreground|_background|_fg|_bg)?\.(png|webp|xml)$/
;(async () => {
  fs.mkdirSync(res, { recursive: true })
  for (const d of fs.readdirSync(res)) {
    if (!d.startsWith('mipmap')) continue
    for (const f of fs.readdirSync(path.join(res, d))) if (old.test(f)) fs.rmSync(path.join(res, d, f))
  }
  const sq = (n) => sharp(src).resize(n, n, { fit: 'cover' })
  for (const [d, [l, a]] of Object.entries(D)) {
    const dir = path.join(res, 'mipmap-' + d)
    fs.mkdirSync(dir, { recursive: true })
    await sq(l).png().toFile(path.join(dir, 'ic_launcher.png'))
    const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${l}" height="${l}"><circle cx="${l / 2}" cy="${l / 2}" r="${l / 2}"/></svg>`)
    await sq(l).composite([{ input: mask, blend: 'dest-in' }]).png().toFile(path.join(dir, 'ic_launcher_round.png'))
    await sq(a).png().toFile(path.join(dir, 'ic_launcher_fg.png'))
    await sharp({ create: { width: a, height: a, channels: 3, background: bg } }).png().toFile(path.join(dir, 'ic_launcher_bg.png'))
  }
  const xml = '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@mipmap/ic_launcher_bg"/>\n    <foreground android:drawable="@mipmap/ic_launcher_fg"/>\n</adaptive-icon>\n'
  const any = path.join(res, 'mipmap-anydpi-v26')
  fs.mkdirSync(any, { recursive: true })
  fs.writeFileSync(path.join(any, 'ic_launcher.xml'), xml)
  fs.writeFileSync(path.join(any, 'ic_launcher_round.xml'), xml)
  console.log('Android icons made from assets/icon-only.png')
})()
