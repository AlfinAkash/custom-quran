// Draws the app icon (1024x1024 PNG) from the settings in edition.config.json
const path = require('path'), fs = require('fs'), os = require('os')

// Use the bundled fonts so the icon looks identical on every machine
function useBundledFonts() {
  const dir = path.resolve(__dirname, '..', 'assets', 'fonts')
  const conf = path.join(os.tmpdir(), 'edition-fonts.conf')
  fs.writeFileSync(conf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${dir}</dir><cachedir>${path.join(os.tmpdir(), 'edition-fc-cache')}</cachedir></fontconfig>`)
  if (!process.env.FONTCONFIG_FILE) process.env.FONTCONFIG_FILE = conf
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
const hex2rgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => { const x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t) }
function hsl(h) {
  const [r, g, b] = hex2rgb(h).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  let hh = 0, s = 0
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh /= 6 }
  return [hh, s, l]
}
function fromHsl(h, s, l) {
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p }
  if (s === 0) return rgb2hex(l * 255, l * 255, l * 255)
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q
  return rgb2hex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255)
}

const cx = 512, cy = 430
const sq = (h, rot) => [0, 1, 2, 3].map((i) => { const a = Math.PI / 2 * i + Math.PI / 4 + rot, r = h * Math.SQRT2; return (cx + r * Math.sin(a)).toFixed(1) + ',' + (cy - r * Math.cos(a)).toFixed(1) }).join(' ')

function art(style, o) {
  const G = 'url(#gold)'
  const ring = `<circle cx="${cx}" cy="${cy}" r="262" fill="none" stroke="${G}" stroke-width="4" opacity=".6"/><circle cx="${cx}" cy="${cy}" r="250" fill="none" stroke="${G}" stroke-width="1.5" opacity=".35"/>`
  const dots = [0, 1, 2, 3, 5, 6, 7].map((i) => { const a = Math.PI * i / 4; return `<circle cx="${(cx + 288 * Math.sin(a)).toFixed(1)}" cy="${(cy - 288 * Math.cos(a)).toFixed(1)}" r="6" fill="${G}"/>` }).join('')
  const faintStar = `<polygon points="${sq(176, 0)}" fill="none" stroke="${G}" stroke-width="3" stroke-linejoin="round" opacity=".28"/><polygon points="${sq(176, Math.PI / 4)}" fill="none" stroke="${G}" stroke-width="3" stroke-linejoin="round" opacity=".28"/>`
  const arabic = (t, y, size) => t ? `<text x="512" y="${y}" text-anchor="middle" font-family="FreeSerif, DejaVu Sans, serif" font-size="${size}" fill="${G}" direction="rtl">${esc(t)}</text>` : ''
  const fillDark = `fill="${o.bg}" fill-opacity=".55"`

  if (style === 'mosque') {
    const mina = [-1, 1].map((s) => {
      const x = cx + s * 190
      return `<path d="M${x - 17},${cy + 120} V${cy - 56} L${x},${cy - 106} L${x + 17},${cy - 56} V${cy + 120} Z" ${fillDark} stroke="${G}" stroke-width="6" stroke-linejoin="round"/>
<line x1="${x - 25}" y1="${cy - 16}" x2="${x + 25}" y2="${cy - 16}" stroke="${G}" stroke-width="7" stroke-linecap="round"/>
<circle cx="${x}" cy="${cy - 118}" r="7" fill="${G}"/>
<path d="M${x - 6},${cy + 120} V${cy + 70} A6 6 0 0 1 ${x + 6},${cy + 70} V${cy + 120}" fill="none" stroke="${G}" stroke-width="4" opacity=".8"/>`
    }).join('')
    return `${ring}${faintStar}
<g filter="url(#sh)">
${mina}
<path d="M${cx - 135},${cy + 120} V${cy + 56} H${cx + 135} V${cy + 120} Z" ${fillDark} stroke="${G}" stroke-width="7" stroke-linejoin="round"/>
<path d="M${cx - 124},${cy + 56} C${cx - 124},${cy - 46} ${cx - 72},${cy - 98} ${cx},${cy - 104} C${cx + 72},${cy - 98} ${cx + 124},${cy - 46} ${cx + 124},${cy + 56} Z" ${fillDark} stroke="${G}" stroke-width="7" stroke-linejoin="round"/>
<line x1="${cx}" y1="${cy - 104}" x2="${cx}" y2="${cy - 146}" stroke="${G}" stroke-width="6" stroke-linecap="round"/>
<rect width="1024" height="1024" fill="${G}" mask="url(#mosq)"/>
<path d="M${cx - 30},${cy + 120} V${cy + 86} A30 30 0 0 1 ${cx + 30},${cy + 86} V${cy + 120}" fill="none" stroke="${G}" stroke-width="6"/>
<path d="M${cx - 92},${cy + 98} V${cy + 80} A10 10 0 0 1 ${cx - 72},${cy + 80} V${cy + 98} M${cx + 72},${cy + 98} V${cy + 80} A10 10 0 0 1 ${cx + 92},${cy + 80} V${cy + 98}" fill="none" stroke="${G}" stroke-width="4" opacity=".8"/>
</g>
<line x1="${cx - 235}" y1="${cy + 126}" x2="${cx + 235}" y2="${cy + 126}" stroke="${G}" stroke-width="5" stroke-linecap="round" opacity=".7"/>
${arabic(o.arabic, cy + 196, 56)}${dots}`
  }

  if (style === 'star') {
    const letters = o.name.split(/\s+/).filter(Boolean).map((w) => [...w][0]).slice(0, 2).join('').toUpperCase() || '☪'
    const size = [...letters].length > 1 ? 136 : 180
    return `${ring}
<g filter="url(#sh)">
<polygon points="${sq(160, 0)}" fill="${G}" fill-opacity=".05" stroke="${G}" stroke-width="8" stroke-linejoin="round"/>
<polygon points="${sq(160, Math.PI / 4)}" fill="${G}" fill-opacity=".05" stroke="${G}" stroke-width="8" stroke-linejoin="round"/>
<text x="512" y="${cy + 48}" text-anchor="middle" font-family="GFS Baskerville, FreeSerif, serif" font-size="${size}" letter-spacing="4" fill="${G}">${esc(letters)}</text>
</g>
<g transform="translate(${cx} ${cy - 92})"><rect x="-70" y="-1.5" width="52" height="3" fill="${G}" opacity=".7"/><rect x="18" y="-1.5" width="52" height="3" fill="${G}" opacity=".7"/><rect x="-7" y="-7" width="14" height="14" transform="rotate(45)" fill="${G}"/></g>
${arabic(o.arabic, cy + 205, 52)}${dots}`
  }

  // quran (default): open book, crescent and light rays
  const rays = [-62, -38, 38, 62].map((a) => { const r = a * Math.PI / 180; return `<line x1="${(cx + 150 * Math.sin(r)).toFixed(1)}" y1="${(cy - 30 - 150 * Math.cos(r)).toFixed(1)}" x2="${(cx + 200 * Math.sin(r)).toFixed(1)}" y2="${(cy - 30 - 200 * Math.cos(r)).toFixed(1)}" stroke="${G}" stroke-width="5" stroke-linecap="round" opacity=".55"/>` }).join('')
  const page = (s) => { const m = (x) => cx + s * (x - cx); return `M${cx},${cy + 78} C${m(460)},${cy + 53} ${m(390)},${cy + 48} ${m(330)},${cy + 63} L${m(330)},${cy - 57} C${m(390)},${cy - 72} ${m(460)},${cy - 67} ${cx},${cy - 37} Z` }
  const lines = (s) => [0, 1, 2].map((i) => { const m = (x) => cx + s * (x - cx), y = cy - 14 + i * 24; return `<path d="M${m(352)},${y} C${m(400)},${y - 10} ${m(450)},${y - 5} ${m(490)},${y + 10}" stroke="${G}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>` }).join('')
  return `${ring}${faintStar}${rays}
<g filter="url(#sh)">
<path d="M${cx - 190},${cy + 88} C${cx - 120},${cy + 70} ${cx - 50},${cy + 76} ${cx},${cy + 104} C${cx + 50},${cy + 76} ${cx + 120},${cy + 70} ${cx + 190},${cy + 88} L${cx + 190},${cy + 100} C${cx + 120},${cy + 84} ${cx + 50},${cy + 90} ${cx},${cy + 120} C${cx - 50},${cy + 90} ${cx - 120},${cy + 84} ${cx - 190},${cy + 100} Z" fill="${G}" opacity=".9"/>
<path d="${page(1)}" ${fillDark} stroke="${G}" stroke-width="7" stroke-linejoin="round"/>
<path d="${page(-1)}" ${fillDark} stroke="${G}" stroke-width="7" stroke-linejoin="round"/>
<rect width="1024" height="1024" fill="${G}" mask="url(#cres)"/>
</g>
<line x1="${cx}" y1="${cy - 37}" x2="${cx}" y2="${cy + 78}" stroke="${G}" stroke-width="6" stroke-linecap="round"/>
${lines(1)}${lines(-1)}${arabic(o.arabic, cy + 196, 58)}${dots}`
}

function nameBlock(name, tagline) {
  const G = 'url(#gold)', up = name.toUpperCase().trim()
  let lines = [up]
  if (up.length > 20 && up.includes(' ')) {
    const words = up.split(' '); let best = null
    for (let i = 1; i < words.length; i++) { const a = words.slice(0, i).join(' '), b = words.slice(i).join(' '), d = Math.abs(a.length - b.length); if (!best || d < best.d) best = { a, b, d } }
    lines = [best.a, best.b]
  }
  const longest = Math.max(...lines.map((l) => [...l].length))
  const size = clamp(Math.floor(520 / (longest * 0.756)), 26, 50)
  const sp = (size * 0.116).toFixed(1)
  const base = lines.length === 1 ? 732 : 712
  const texts = lines.map((l, i) => `<text x="512" y="${base + i * size * 1.25}" text-anchor="middle" font-family="GFS Baskerville, FreeSerif, serif" font-size="${size}" letter-spacing="${sp}" fill="${G}">${esc(l)}</text>`).join('')
  const last = base + (lines.length - 1) * size * 1.25
  const orn = last + 38
  const tag = tagline ? `<text x="512" y="${orn + 44}" text-anchor="middle" font-family="GFS Baskerville, FreeSerif, serif" font-size="20" letter-spacing="8" fill="${G}" opacity=".85">${esc(tagline.toUpperCase())}</text>` : ''
  return `${texts}<g transform="translate(512 ${orn})"><rect x="-130" y="-1.5" width="104" height="3" fill="${G}" opacity=".6"/><rect x="26" y="-1.5" width="104" height="3" fill="${G}" opacity=".6"/><rect x="-8" y="-8" width="16" height="16" transform="rotate(45)" fill="${G}"/></g>${tag}`
}

// o: { name, tagline, style, arabic, bg, gold }
function buildSvg(o, withText = true) {
  const style = ['quran', 'mosque', 'star'].includes(o.style) ? o.style : 'quran'
  const arabic = o.arabic === undefined || o.arabic === null ? (style === 'quran' ? 'القرآن الكريم' : '') : o.arabic
  const bg = o.bg || '#0B2E2A', gold = o.gold || '#D9AE4E'
  const [h, s, l] = hsl(bg)
  const center = fromHsl(h, s, clamp(l + 0.12, 0, 0.5)), edge = fromHsl(h, s, l * 0.45)
  const g1 = mix(gold, '#ffffff', 0.55), g3 = mix(gold, '#000000', 0.32), glow = mix(gold, '#ffffff', 0.2)
  const inner = art(style, { ...o, bg, arabic })
  const defs = `<defs>
<radialGradient id="bg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="${center}"/><stop offset=".55" stop-color="${bg}"/><stop offset="1" stop-color="${edge}"/></radialGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g1}"/><stop offset=".45" stop-color="${gold}"/><stop offset="1" stop-color="${g3}"/></linearGradient>
<radialGradient id="glow" cx="50%" cy="40%" r="36%"><stop offset="0" stop-color="${glow}" stop-opacity=".3"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
<mask id="cres"><rect width="1024" height="1024" fill="#000"/><circle cx="${cx}" cy="${cy - 165}" r="44" fill="#fff"/><circle cx="${cx + 18}" cy="${cy - 173}" r="37" fill="#000"/></mask>
<mask id="mosq"><rect width="1024" height="1024" fill="#000"/><circle cx="${cx}" cy="${cy - 170}" r="30" fill="#fff"/><circle cx="${cx + 12}" cy="${cy - 177}" r="25" fill="#000"/></mask>
<filter id="sh"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".5"/></filter>
</defs>`
  const up = withText ? -22 : 0
  const scale = withText ? 0.93 : 1
  const group = `<g transform="translate(0 ${up}) translate(512 430) scale(${scale}) translate(-512 -430)">${inner}</g>`
  const text = withText ? nameBlock(o.name || 'Prayer', o.tagline) : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}<rect width="1024" height="1024" fill="url(#bg)"/><rect width="1024" height="1024" fill="url(#glow)"/>${group}${text}</svg>`
}

module.exports = { buildSvg, useBundledFonts, mix }
