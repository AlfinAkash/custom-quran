import { toast } from 'sonner'
import { playAdhan, stopAdhan } from './adhan'
import { runtime } from './runtime'
import { hm, localNow, to12 } from './time'
import { FIVE } from './constants'
import { store } from './storage'

const speak = (m) => { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(m)) } catch { /* unsupported */ } }
const ring = (a) => playAdhan(a.vol ?? 0.6, a.tone)

async function notify(msg, body) {
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    const o = { body, icon: '/icon.svg', badge: '/icon.svg', tag: 'prayer-alert', renotify: true, requireInteraction: true, vibrate: [200, 100, 200, 100, 200] }
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) reg.showNotification(msg, o); else new Notification(msg, o)
  } catch { /* notifications blocked */ }
}

// One alert: banner + browser notification + adhan sound (+ optional spoken name)
export function fire(al, msg) {
  toast(msg, { duration: 30000, action: al.sound ? { label: 'Stop adhan', onClick: stopAdhan } : undefined })
  if (al.sound) ring(al).then((ok) => { if (!ok) toast('Your browser blocked the sound', { duration: 30000, action: { label: 'Play adhan', onClick: () => ring(al) } }) })
  if (al.speak) speak(msg)
  notify(msg, `${runtime.userName || 'Daily Prayer'} · Prayer reminder`)
}

// ---------- Reminder schedule (before / at / after each prayer) ----------
export const offsetsOf = (al) => al.offsets ?? [al.lead ? -al.lead : 0]

export const offLabel = (o) => (o === 0 ? 'At prayer time' : o < 0 ? `${-o} min before` : `${o} min after`)

export function dueList(timings, tz, al) {
  const n = localNow(tz), day = n.toDateString(), out = []
  FIVE.forEach((k) => {
    if (!al.prayers[k] || !timings[k]) return
    const [h, m] = hm(timings[k]), at = new Date(n); at.setHours(h, m, 0, 0)
    offsetsOf(al).forEach((off) => out.push({ id: `${day}|${k}|${off}`, k, off, day, n, time: timings[k], trig: new Date(at.getTime() + off * 60000) }))
  })
  return out
}

export const firedIds = () => store('firedAlerts', [])
export const markFired = (ids, day) => { try { localStorage.setItem('firedAlerts', JSON.stringify([...new Set([...firedIds().filter((x) => x.startsWith(day)), ...ids])])) } catch { /* ignore */ } }
export const alertText = (d) => (d.off === 0 ? `It is time for ${d.k} (${to12(d.time)})` : d.off < 0 ? `${d.k} in ${-d.off} minutes (${to12(d.time)})` : `${d.k} was ${d.off} minutes ago (${to12(d.time)}). Have you prayed?`)
