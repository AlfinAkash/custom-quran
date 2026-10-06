import { runtime } from './runtime'

export const pad = (n) => String(n).padStart(2, '0')
export const to12 = (t) => { const [h, m] = t.slice(0, 5).split(':').map(Number); if (runtime.use24) return `${pad(h)}:${pad(m)}`; return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}` }
export const hm = (t) => t.slice(0, 5).split(':').map(Number)
export const add = (t, m) => { const [h, mi] = hm(t); const x = h * 60 + mi + m; return `${pad(Math.floor(x / 60) % 24)}:${pad(x % 60)}` }
export const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5)
export const localNow = (tz) => (tz ? new Date(new Date().toLocaleString('en-US', { timeZone: tz })) : new Date())
