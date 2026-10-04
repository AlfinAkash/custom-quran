// Android-only features (run inside the APK). On the web every function is a safe no-op.
import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { Geolocation } from '@capacitor/geolocation'
import { App as CapApp } from '@capacitor/app'

export const isNative = Capacitor.isNativePlatform()
const CH = { adhan: 'prayer-adhan-v1', remind: 'prayer-remind-v1', quiet: 'prayer-quiet-v1' }
const ICON = 'ic_stat_prayer'
const LARGE = 'notif_large'
const COLOR = '#C9A24B'
const DAYS = 30
const MAX = 450 // Android allows about 500 scheduled alarms per app
const REFRESH_ID = 700000
const TEST_ID = 999999
const pad = (n) => String(n).padStart(2, '0')
let busy = false

export async function nativeInit() {
  if (!isNative) return
  try { await ensureChannels() } catch { /* ignore */ }
}

async function ensureChannels() {
  const base = { visibility: 1, lights: true, lightColor: COLOR, vibration: true }
  await LocalNotifications.createChannel({ id: CH.adhan, name: 'Adhan (at prayer time)', description: 'Plays the call to prayer', importance: 5, sound: 'adhan.mp3', ...base })
  await LocalNotifications.createChannel({ id: CH.remind, name: 'Prayer reminders', description: 'Before and after prayer reminders, adhkar', importance: 4, ...base })
  await LocalNotifications.createChannel({ id: CH.quiet, name: 'Silent reminders', description: 'Vibration only, no sound', importance: 3, ...base })
  try {
    await LocalNotifications.registerActionTypes({
      types: [
        { id: 'PRAYER_NOW', actions: [{ id: 'snooze', title: 'Remind in 10 min' }] },
        { id: 'PRAYER_AFTER', actions: [{ id: 'prayed', title: '✓ I prayed' }, { id: 'snooze', title: 'Remind in 10 min' }] },
      ],
    })
  } catch { /* action buttons are optional */ }
}

export async function notifStatus() {
  if (!isNative) return { notif: false, exact: true }
  let notif = false, exact = true
  try { notif = (await LocalNotifications.checkPermissions()).display === 'granted' } catch { /* ignore */ }
  try { exact = (await LocalNotifications.checkExactNotificationSetting()).exact_alarm === 'granted' } catch { /* older Android */ }
  return { notif, exact }
}

export async function askNotif() {
  if (!isNative) return false
  try {
    const r = await LocalNotifications.requestPermissions()
    if (r.display !== 'granted') return false
    await ensureChannels()
    return true
  } catch { return false }
}

export async function askExact() {
  try {
    const s = await LocalNotifications.checkExactNotificationSetting()
    if (s.exact_alarm !== 'granted') await LocalNotifications.changeExactNotificationSetting()
  } catch { /* not needed on this Android version */ }
}

export async function getPosition() {
  const p = await Geolocation.requestPermissions()
  if (p.location !== 'granted' && p.coarseLocation !== 'granted') throw new Error('denied')
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 })
  return { lat: pos.coords.latitude, lng: pos.coords.longitude }
}

export async function cancelAll() {
  if (!isNative) return
  try {
    const { notifications } = await LocalNotifications.getPending()
    if (notifications.length) await LocalNotifications.cancel({ notifications: notifications.map(({ id }) => ({ id })) })
    localStorage.removeItem('nativeSched')
  } catch { /* ignore */ }
}

export async function pendingCount() {
  try { return (await LocalNotifications.getPending()).notifications.length } catch { return 0 }
}

export async function upcoming(n = 4) {
  try {
    const { notifications } = await LocalNotifications.getPending()
    return notifications
      .map((x) => ({ id: x.id, title: x.title, at: x.schedule?.at ? new Date(x.schedule.at) : null }))
      .filter((x) => x.at && !isNaN(x.at) && x.at > new Date())
      .sort((a, b) => a.at - b.at)
      .slice(0, n)
  } catch { return [] }
}

export const forceNext = () => { try { localStorage.removeItem('nativeSched') } catch { /* ignore */ } }

export async function onAction(handler) {
  if (!isNative) return () => {}
  const h = await LocalNotifications.addListener('localNotificationActionPerformed', (e) => handler(e.actionId, e.notification))
  return () => h.remove()
}

export async function onResume(cb) {
  if (!isNative) return () => {}
  const h = await CapApp.addListener('resume', cb)
  return () => h.remove()
}

export async function snooze(n, mins = 10) {
  try {
    await ensureChannels()
    await LocalNotifications.schedule({ notifications: [{
      id: 800000 + Math.floor(Math.random() * 90000), title: n.title, body: n.body, largeBody: n.largeBody || n.body,
      channelId: CH.remind, smallIcon: ICON, largeIcon: LARGE, iconColor: COLOR, autoCancel: true,
      actionTypeId: 'PRAYER_AFTER', extra: n.extra, schedule: { at: new Date(Date.now() + mins * 60000), allowWhileIdle: true },
    }] })
  } catch { /* ignore */ }
}

// Turns "05:12" on a given date in the prayer location's time zone into a real moment in time
function zoned(y, mo, d, h, mi, tz) {
  if (!tz) return new Date(y, mo - 1, d, h, mi)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const offset = (t) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).formatToParts(new Date(t)).map((x) => [x.type, x.value]))
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - t
  }
  let t = guess - offset(guess)
  t = guess - offset(t)
  return new Date(t)
}

async function monthTimes(loc, calc, y, m) {
  const r = await fetch(`https://api.aladhan.com/v1/calendar/${y}/${m}?latitude=${loc.lat}&longitude=${loc.lng}&method=${calc.method}&school=${calc.school}`)
  if (!r.ok) throw new Error('times')
  return (await r.json()).data || []
}

// Schedules every reminder for the coming weeks as real Android alarms (they fire even when the app is closed)
export async function scheduleAll(o) {
  if (!isNative || busy) return { ok: false, busy }
  busy = true
  try { return await run(o) } catch (e) { return { ok: false, reason: 'error', error: String(e) } } finally { busy = false }
}

async function run({ loc, calc, al, prayers, offsets, describe, who = '' }) {
  if (!(await notifStatus()).notif) return { ok: false, reason: 'permission' }
  const extras = { adhkar: true, kahf: true, fasting: false, ...(al.extras || {}) }
  const sig = JSON.stringify([loc.lat, loc.lng, calc.method, calc.school, al.sound, al.prayers, offsets, extras, who])
  let saved = null
  try { saved = JSON.parse(localStorage.getItem('nativeSched')) } catch { /* ignore */ }
  const pending = await pendingCount()
  if (saved && saved.sig === sig && pending > 0 && Date.now() - saved.at < 12 * 3600 * 1000) return { ok: true, skipped: true, count: pending }

  await ensureChannels()
  const now = new Date()
  const dayAt = (i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + i)
  const key = (d) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
  const months = new Map()
  for (let i = 0; i <= DAYS; i++) { const d = dayAt(i); months.set(`${d.getFullYear()}-${d.getMonth()}`, d) }
  const index = {}
  for (const d of months.values()) (await monthTimes(loc, calc, d.getFullYear(), d.getMonth() + 1)).forEach((e) => { index[e.date.gregorian.date] = e })

  const list = []
  const soft = al.sound ? CH.remind : CH.quiet
  const push = (id, at, n) => { if (at.getTime() >= Date.now() + 3000) list.push({ id, at, ...n }) }
  for (let i = 0; i < DAYS; i++) {
    const d = dayAt(i), e = index[key(d)]
    if (!e) continue
    const nextDay = index[key(dayAt(i + 1))]
    const T = (k) => { const [h, mi] = e.timings[k].slice(0, 5).split(':').map(Number); return zoned(d.getFullYear(), d.getMonth() + 1, d.getDate(), h, mi, e.meta?.timezone) }
    const jumuah = d.getDay() === 5
    prayers.forEach((k, pi) => {
      if (!al.prayers?.[k] || !e.timings[k]) return
      const base = T(k)
      const nk = prayers[pi + 1]
      const next = nk ? { k: nk, time: e.timings[nk].slice(0, 5) } : nextDay ? { k: prayers[0], time: nextDay.timings[prayers[0]].slice(0, 5) } : null
      offsets.forEach((off, oi) => {
        const t = describe({ k, off, time: e.timings[k].slice(0, 5), next, jumuah })
        push(i * 1000 + pi * 100 + oi, new Date(base.getTime() + off * 60000), {
          title: t.title, body: t.body, large: t.large,
          ch: !al.sound ? CH.quiet : off === 0 ? CH.adhan : CH.remind,
          action: off === 0 ? 'PRAYER_NOW' : off > 0 ? 'PRAYER_AFTER' : undefined,
          extra: { prayer: k, day: d.toDateString(), off },
        })
      })
    })
    if (extras.adhkar && e.timings.Fajr && e.timings.Asr) {
      push(i * 1000 + 900, new Date(T('Fajr').getTime() + 30 * 60000), { title: 'Morning Adhkar', body: 'Begin your day with the remembrance of Allah.', ch: soft })
      push(i * 1000 + 901, new Date(T('Asr').getTime() + 30 * 60000), { title: 'Evening Adhkar', body: 'Protect your evening with dhikr and dua.', ch: soft })
    }
    if (extras.kahf && jumuah && e.timings.Dhuhr) push(i * 1000 + 902, new Date(T('Dhuhr').getTime() - 90 * 60000), { title: "Jumu'ah Mubarak", body: 'Do not forget to recite Surah Al-Kahf today.', ch: soft })
    if (extras.fasting && (d.getDay() === 0 || d.getDay() === 3) && e.timings.Isha) {
      push(i * 1000 + 903, new Date(T('Isha').getTime() + 30 * 60000), { title: 'Sunnah fast tomorrow', body: `Tomorrow is ${d.getDay() === 0 ? 'Monday' : 'Thursday'}. Make your intention before Fajr.`, ch: soft })
    }
  }
  list.sort((a, b) => a.at - b.at)
  const notifications = list.slice(0, MAX).map((n) => ({
    id: n.id, title: n.title, body: n.body, largeBody: n.large || n.body, summaryText: loc.name,
    channelId: n.ch, smallIcon: ICON, largeIcon: LARGE, iconColor: COLOR, autoCancel: true, group: 'prayer-times',
    actionTypeId: n.action, extra: n.extra, schedule: { at: n.at, allowWhileIdle: true },
  }))
  // A friendly nudge two days before the scheduled alerts run out, so they never stop silently
  const last = notifications[notifications.length - 1]
  if (last) {
    const r = new Date(last.schedule.at.getTime() - 2 * 86400000); r.setHours(9, 0, 0, 0)
    if (r > now) notifications.push({ id: REFRESH_ID, title: 'Keep your prayer alerts active', body: 'Open the app once so your upcoming prayer alerts are refreshed.', channelId: CH.remind, smallIcon: ICON, largeIcon: LARGE, iconColor: COLOR, autoCancel: true, schedule: { at: r, allowWhileIdle: true } })
  }
  await cancelAll()
  if (notifications.length) await LocalNotifications.schedule({ notifications })
  try { localStorage.setItem('nativeSched', JSON.stringify({ sig, at: Date.now() })) } catch { /* ignore */ }
  return { ok: true, count: notifications.length }
}

export async function sendTest(al) {
  if (!(await notifStatus()).notif && !(await askNotif())) return false
  try {
    await ensureChannels()
    await LocalNotifications.schedule({ notifications: [{
      id: TEST_ID, title: 'Test alert', body: 'Prayer alerts are working on this phone.', largeBody: 'Prayer alerts are working on this phone.\nYou will get the adhan at prayer time, even when the app is closed.',
      channelId: al.sound ? CH.adhan : CH.quiet, smallIcon: ICON, largeIcon: LARGE, iconColor: COLOR, autoCancel: true, actionTypeId: 'PRAYER_AFTER', extra: { prayer: '' },
      schedule: { at: new Date(Date.now() + 4000), allowWhileIdle: true },
    }] })
    return true
  } catch { return false }
}
