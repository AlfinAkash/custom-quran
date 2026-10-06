// Reads edition.config.json and generates everything for this edition:
// name, location, theme, icon, Android app name and id, manifest, page title.
const fs = require('fs'), path = require('path')
const { useBundledFonts, buildSvg } = require('./make-icon.cjs')

const ROOT = process.cwd()
const P = (...a) => path.join(ROOT, ...a)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fail = (m) => { console.error('\n❌ ' + m + '\n'); process.exit(1) }

function readConfig() {
  let raw
  try { raw = fs.readFileSync(P('edition.config.json'), 'utf8') } catch { fail('edition.config.json was not found in the project folder.') }
  try { return JSON.parse(raw) } catch (e) { fail('edition.config.json has a typo (a missing quote, comma or bracket). ' + e.message) }
}

const slug = (s) => String(s).normalize('NFKD').replace(/[^\x00-\x7F]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
const isHex = (s) => typeof s === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s)
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

// Looks the place up on OpenStreetMap. If the full address is not found, it tries shorter versions of it.
async function geocode(text) {
  const parts = text.split(',').map((x) => x.trim()).filter(Boolean)
  const tries = []
  for (let i = 0; i < parts.length; i++) tries.push(parts.slice(i).join(', '))
  for (const q of tries) {
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&accept-language=en`, { headers: { 'User-Agent': 'prayer-edition-builder/1.0 (github actions)' } })
      if (r.ok) {
        const j = await r.json()
        if (j[0]) return { lat: +(+j[0].lat).toFixed(4), lng: +(+j[0].lon).toFixed(4), matched: q, exact: q === text }
      }
    } catch { /* try next */ }
    await sleep(1200)
  }
  for (const q of tries) {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q.split(',')[0])}&count=1&language=en`)
      const j = await r.json()
      if (j.results?.[0]) return { lat: +j.results[0].latitude.toFixed(4), lng: +j.results[0].longitude.toFixed(4), matched: q.split(',')[0], exact: false }
    } catch { /* try next */ }
  }
  return null
}

;(async () => {
  const c = readConfig()
  const name = String(c.name || '').trim() || fail('"name" is empty in edition.config.json.')
  const first = name.split(/\s+/)[0]
  const cfg = {
    name,
    appName: String(c.appName || `${first} Prayer`).trim().slice(0, 30),
    tagline: c.tagline === undefined ? 'Special Edition' : String(c.tagline).trim(),
    dedication: String(c.dedication || '').trim(),
    greeting: String(c.greeting || 'Assalamu Alaikum').trim(),
    theme: c.theme || 'emerald',
    accent: isHex(c.accent) ? c.accent : '',
    bg: isHex(c.iconBackground) ? c.iconBackground : '#0B2E2A',
    gold: isHex(c.iconColor) ? c.iconColor : '#D9AE4E',
    method: Number.isFinite(+c.method) ? +c.method : 3,
    school: +c.school === 1 ? 1 : 0,
    h24: !!c.hour24,
    hidden: Array.isArray(c.hideSections) ? c.hideSections : [],
    iconStyle: c.iconStyle || 'quran',
    iconArabic: c.iconArabic === undefined ? null : c.iconArabic,
  }
  const appId = (c.appId && /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(c.appId)) ? c.appId : `com.${slug(name) ? (/^[a-z]/.test(slug(name)) ? slug(name) : 'a' + slug(name)) : 'prayer'}.dailyprayer`

  // ---- location ----
  let lat = num(c.lat), lng = num(c.lng), label = String(c.locationLabel || '').trim()
  const text = String(c.location || '').trim()
  if (c.lockCoordinates && lat !== null && lng !== null) {
    console.log(`📍 Using the exact lat and lng from edition.config.json (${lat}, ${lng})`)
  } else if (text) {
    console.log(`📍 Looking up "${text}" ...`)
    const g = await geocode(text)
    if (g) {
      lat = g.lat; lng = g.lng
      console.log(`   found ${lat}, ${lng} (matched "${g.matched}")${g.exact ? '' : '  ← approximate: the full address was not on the map, so a nearby place was used'}`)
    } else if (lat !== null && lng !== null) {
      console.warn('   ⚠ Could not look the place up. Using lat and lng from edition.config.json.')
    } else {
      fail(`Could not find "${text}" on the map. Make the location simpler (village, town, district) or add "lat" and "lng" in edition.config.json.`)
    }
  } else if (lat === null || lng === null) {
    fail('Add a "location" (place name) or both "lat" and "lng" in edition.config.json.')
  }
  if (!label) label = text ? text.split(',').map((x) => x.trim()).filter(Boolean).slice(0, 2).join(', ') : `${lat}, ${lng}`

  // ---- app data used by the web app ----
  const edition = { ...cfg, loc: { name: label, lat, lng } }
  fs.writeFileSync(P('src', 'edition.json'), JSON.stringify(edition, null, 2) + '\n')

  // ---- Android app name and id ----
  const cap = JSON.parse(fs.readFileSync(P('capacitor.config.json'), 'utf8'))
  cap.appId = appId; cap.appName = cfg.appName; cap.backgroundColor = cfg.bg
  cap.plugins = { ...(cap.plugins || {}), LocalNotifications: { smallIcon: 'ic_stat_prayer', iconColor: cfg.gold, sound: 'adhan.mp3' } }
  fs.writeFileSync(P('capacitor.config.json'), JSON.stringify(cap, null, 2) + '\n')

  // ---- web manifest + page title ----
  const mf = JSON.parse(fs.readFileSync(P('public', 'manifest.webmanifest'), 'utf8'))
  mf.name = `${name} · ${cfg.tagline || 'Prayer Times'}`; mf.short_name = cfg.appName; mf.theme_color = cfg.bg; mf.background_color = cfg.bg
  fs.writeFileSync(P('public', 'manifest.webmanifest'), JSON.stringify(mf, null, 2) + '\n')
  let html = fs.readFileSync(P('index.html'), 'utf8')
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${name.replace(/</g, '')} · ${cfg.tagline || 'Prayer Times'}</title>`)
    .replace(/(<meta name="theme-color" content=")[^"]*(")/, `$1${cfg.bg}$2`)
    .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, `$1${cfg.appName.replace(/"/g, '')}$2`)
  fs.writeFileSync(P('index.html'), html)

  // ---- icon ----
  fs.mkdirSync(P('assets'), { recursive: true })
  useBundledFonts()
  const sharp = require('sharp')
  if (cfg.iconStyle === 'custom') {
    const own = ['custom-icon.png', 'custom-icon.jpg', 'custom-icon.jpeg', 'custom-icon.webp'].map((f) => P('assets', f)).find((f) => fs.existsSync(f))
    if (!own) fail('iconStyle is "custom" but assets/custom-icon.png was not found. Upload your own square image (1024 x 1024) there.')
    await sharp(own).resize(1024, 1024, { fit: 'cover' }).png().toFile(P('assets', 'icon-only.png'))
    console.log('🎨 Using your own icon: ' + path.basename(own))
  } else {
    const o = { name, tagline: cfg.tagline, style: cfg.iconStyle, arabic: cfg.iconArabic, bg: cfg.bg, gold: cfg.gold }
    await sharp(Buffer.from(buildSvg(o, true))).png().toFile(P('assets', 'icon-only.png'))
    fs.writeFileSync(P('public', 'icon.svg'), buildSvg(o, false))
    console.log(`🎨 Icon drawn for "${name}" (style: ${cfg.iconStyle})`)
  }
  for (const [f, z] of [['icon-512.png', 512], ['icon-192.png', 192], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await sharp(P('assets', 'icon-only.png')).resize(z, z).png().toFile(P('public', f))
  }

  console.log(`\n✅ Edition ready\n   Name: ${name}\n   App name: ${cfg.appName}\n   App id: ${appId}\n   Location: ${label} (${lat}, ${lng})\n   Theme: ${cfg.theme}${cfg.accent ? ', accent ' + cfg.accent : ''}`)
})().catch((e) => fail('Customize failed: ' + (e && e.stack || e)))
