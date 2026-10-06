import { useEffect, useState } from 'react'
import { BookOpen, CalendarDays, CircleDot, Clock, Coins, Compass, HandHeart, ListChecks, MapPin, Sparkles, Star } from 'lucide-react'

export const APP_VERSION = '3.0.0'
export const DEFAULT_LOC = { name: 'Tirunelveli, Tamil Nadu', lat: 8.7139, lng: 77.7567 }

export const ICONS = { home: Clock, month: CalendarDays, quran: BookOpen, duas: HandHeart, events: Star, mosques: MapPin, ibadah: ListChecks, names: Sparkles, tasbih: CircleDot, qibla: Compass, zakat: Coins }
export const TABS = [['home', 'Prayer'], ['month', 'Monthly'], ['quran', 'Quran'], ['duas', 'Duas'], ['events', 'Events'], ['mosques', 'Mosques'], ['ibadah', 'Ibadah'], ['names', '99 Names'], ['tasbih', 'Tasbih'], ['qibla', 'Qibla'], ['zakat', 'Zakat']]

// id, label, background, accent
export const THEMES = [['emerald', 'Emerald Night', '#0B2E2A', '#C9A24B'], ['midnight', 'Royal Midnight', '#0A1228', '#D4AF37'], ['rose', 'Rose Garden', '#2A0E20', '#E8AA8C'], ['onyx', 'Black & Gold', '#0E0E0E', '#D4AF37'], ['sand', 'Desert Sand (light)', '#F7F1E3', '#966919'], ['ocean', 'Ocean Teal', '#062838', '#78D2C8'], ['medina', 'Green Dome (Madinah)', '#08280F', '#E0BE5A'], ['lapis', 'Persian Lapis', '#0C1840', '#5AC8D2'], ['andalus', 'Andalusian Clay', '#34160E', '#E6AA50'], ['twilight', 'Twilight Violet', '#1A1030', '#C8AAF0'], ['pearl', 'Pearl Garden (light)', '#F4F8F4', '#146E50'], ['saffron', 'Saffron Amber', '#241808', '#F0BE3C']]
export const ACCENTS = ['#C9A24B', '#E0BE5A', '#E8AA8C', '#F0BE3C', '#78D2C8', '#5AC8D2', '#C8AAF0', '#F472B6', '#86EFAC', '#FB923C', '#146E50', '#966919']

export const FONTS = [['figtree', 'Modern', 'Figtree'], ['inter', 'Clean', 'Inter'], ['lora', 'Classic', 'Lora'], ['cormorant', 'Elegant', 'Cormorant Garamond']]
export const ARABIC_FONTS = [['amiri', 'Amiri', 'Amiri'], ['naskh', 'Noto Naskh', 'Noto Naskh Arabic'], ['scheherazade', 'Scheherazade', 'Scheherazade New'], ['lateef', 'Lateef', 'Lateef']]

export const METHODS = [[3, 'Muslim World League'], [1, 'University of Islamic Sciences, Karachi'], [4, 'Umm al-Qura (Makkah)'], [2, 'ISNA (North America)'], [5, 'Egyptian General Authority'], [15, 'Moonsighting Committee Worldwide'], [8, 'Gulf Region'], [9, 'Kuwait'], [10, 'Qatar'], [16, 'Dubai'], [11, 'Singapore (MUIS)'], [17, 'JAKIM (Malaysia)'], [20, 'KEMENAG (Indonesia)'], [13, 'Diyanet (Turkey)'], [12, 'France (UOIF)'], [14, 'Russia (Spiritual Administration)'], [7, 'Tehran'], [0, 'Shia Ithna-Ashari'], [18, 'Tunisia'], [19, 'Algeria'], [21, 'Morocco'], [22, 'Portugal'], [23, 'Jordan']]
export const TUNE_KEYS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export const HOME_CARDS = { times: 'Morning & night times', quick: 'Quick shortcuts', hadith: 'Hadith of the day', fasting: 'Fasting: Sehri & Iftar', progress: "Today's progress", verse: 'Verse of the day' }

export const PREFS0 = {
  name: 'Daily Prayer', greeting: 'Assalamu Alaikum',
  accent: '', cbg: '#0B2E2A', cacc: '#C9A24B',
  font: 'figtree', arabic: 'amiri', scale: 100, radius: 28, density: 'comfy',
  glass: true, pattern: true, glow: true, motion: true,
  hour24: false, seconds: true, start: 'home',
  nav: ['home', 'quran', 'qibla', 'tasbih'],
  cards: [['times', true], ['quick', true], ['hadith', true], ['fasting', true], ['progress', true], ['verse', true]],
}
export const CALC0 = { method: 3, school: 0, adj: 0, tune: {} }

// ---------- storage ----------
export const store = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
export function useLocal(k, d) {
  const [v, set] = useState(() => store(k, d))
  useEffect(() => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage full or blocked */ } }, [k, v])
  return [v, set]
}
// Preferences are merged with the defaults so new options always have a value after an update.
export function usePrefs() {
  const [raw, set] = useLocal('prefs', PREFS0)
  const known = new Set((raw.cards || []).map((c) => c[0]))
  const cards = [...(raw.cards || []), ...PREFS0.cards.filter((c) => !known.has(c[0]))].filter((c) => HOME_CARDS[c[0]])
  const prefs = { ...PREFS0, ...raw, cards }
  return [prefs, (patch) => set({ ...prefs, ...patch })]
}

// ---------- colour helpers (custom theme builder) ----------
export const hex2rgb = (h) => {
  let m = String(h || '').replace('#', '')
  if (m.length === 3) m = m.split('').map((c) => c + c).join('')
  const n = parseInt(m, 16)
  return Number.isNaN(n) || m.length !== 6 ? [201, 162, 75] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const lum = ([r, g, b]) => (0.299 * r + 0.587 * g + 0.114 * b) / 255
export function buildPalette(bg, accent) {
  const night = hex2rgb(bg), gold = hex2rgb(accent), dark = lum(night) < 0.55
  const ivory = dark ? [244, 240, 228] : [30, 36, 34]
  const emerald = mix(mix(night, dark ? [255, 255, 255] : [0, 0, 0], dark ? 0.08 : 0.07), gold, dark ? 0.12 : 0.18)
  const mist = mix(ivory, night, 0.42)
  return { night, emerald, gold, ivory, mist }
}

const FONT_STACK = { figtree: 'Figtree', inter: 'Inter', lora: 'Lora', cormorant: '"Cormorant Garamond"' }
const AR_STACK = { amiri: 'Amiri', naskh: '"Noto Naskh Arabic"', scheherazade: '"Scheherazade New"', lateef: 'Lateef' }
const GAP = { compact: ['0.75rem', '0.9rem'], comfy: ['1.25rem', '1.25rem'], spacious: ['1.75rem', '1.7rem'] }

// Pushes the saved look into CSS variables on <html>. Everything on screen reads those variables.
export function applyAppearance(theme, p) {
  const r = document.documentElement, st = r.style
  const keys = ['night', 'emerald', 'gold', 'ivory', 'mist']
  keys.forEach((k) => st.removeProperty('--' + k))
  r.dataset.theme = theme === 'custom' ? 'emerald' : theme
  if (theme === 'custom') { const pal = buildPalette(p.cbg, p.cacc); keys.forEach((k) => st.setProperty('--' + k, pal[k].join(' '))) } else if (p.accent) st.setProperty('--gold', hex2rgb(p.accent).join(' '))
  const [gap, pad] = GAP[p.density] || GAP.comfy
  st.setProperty('--fs', `${p.scale}%`)
  st.setProperty('--r', `${p.radius}px`)
  st.setProperty('--gap', gap)
  st.setProperty('--pad', pad)
  st.setProperty('--ui-font', FONT_STACK[p.font] || FONT_STACK.figtree)
  st.setProperty('--ar-font', AR_STACK[p.arabic] || AR_STACK.amiri)
  r.dataset.glass = p.glass ? 'on' : 'off'
  r.dataset.pattern = p.pattern ? 'on' : 'off'
  r.dataset.glow = p.glow ? 'on' : 'off'
  r.dataset.motion = p.motion ? 'on' : 'off'
  const night = getComputedStyle(r).getPropertyValue('--night').trim()
  const light = night ? lum(night.split(/\s+/).map(Number)) > 0.55 : false
  r.dataset.light = light ? 'yes' : 'no'
  st.colorScheme = light ? 'light' : 'dark'
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', `rgb(${night})`)
}

// ---------- backup ----------
const SKIP = new Set(['firedAlerts'])
export function exportBackup() {
  const data = {}
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!SKIP.has(k)) data[k] = localStorage.getItem(k) }
  const blob = new Blob([JSON.stringify({ app: 'daily-prayer', version: APP_VERSION, saved: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = `daily-prayer-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
export async function importBackup(file) {
  const j = JSON.parse(await file.text())
  if (j?.app !== 'daily-prayer' || typeof j.data !== 'object') throw new Error('Not a Daily Prayer backup')
  Object.entries(j.data).forEach(([k, v]) => { if (typeof v === 'string') localStorage.setItem(k, v) })
}
export function resetAll() {
  const keys = []
  for (let i = 0; i < localStorage.length; i++) keys.push(localStorage.key(i))
  keys.forEach((k) => localStorage.removeItem(k))
}
