import { useEffect, useMemo, useRef, useState } from 'react'
import { isNative, nativeInit, notifStatus, askNotif, askExact, getPosition, scheduleAll, cancelAll, sendTest, pendingCount, upcoming, forceNext, onAction, onResume, snooze } from './native'
import EDITION from './edition.json'
import { searchPlaces } from './geocode'
import { useQuery } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'motion/react'
import { Toaster, toast } from 'sonner'
import { ChevronLeft, ChevronRight, Sunrise, Sun, CloudSun, Sunset, MoonStar, Download, Upload, Ellipsis, Moon, Bell, BellOff, BookOpen, RotateCcw, Undo2, Vibrate, Volume2, VolumeX, CalendarDays, Check, CircleDot, Clock, Coins, Compass, HandHeart, ListChecks, MapPin, Palette, Sparkles, Star } from 'lucide-react'
const ICONS = { home: Clock, month: CalendarDays, quran: BookOpen, duas: HandHeart, events: Star, mosques: MapPin, ibadah: ListChecks, names: Sparkles, tasbih: CircleDot, qibla: Compass, zakat: Coins }

const DEFAULT_LOC = EDITION.loc || { name: 'Tirunelveli, Tamil Nadu', lat: 8.7139, lng: 77.7567 }
const PRAYERS = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const FIVE = PRAYERS.filter((p) => p !== 'Sunrise')
const AR = { Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' }
const TABS = [['home', 'Prayer'], ['month', 'Monthly'], ['quran', 'Quran'], ['duas', 'Duas'], ['events', 'Events'], ['mosques', 'Mosques'], ['ibadah', 'Ibadah'], ['names', '99 Names'], ['tasbih', 'Tasbih'], ['qibla', 'Qibla'], ['zakat', 'Zakat']]
const PICON = { Fajr: MoonStar, Sunrise, Dhuhr: Sun, Asr: CloudSun, Maghrib: Sunset, Isha: Moon }
const SUB = { month: 'Monthly timetable and Hijri calendar', quran: 'Read, search and listen', duas: 'Daily supplications', events: 'Upcoming Islamic dates', mosques: 'Mosques near you', ibadah: 'Khatm and Qada trackers', names: 'The 99 beautiful names of Allah', tasbih: 'Digital dhikr counter', qibla: 'Direction of the Kaaba', zakat: 'Calculate your zakat' }
const PRIMARY = ['home', 'quran', 'qibla', 'tasbih']
// id, group, short name, Arabic, meaning, virtue / source, default goal
const DHIKR = [
  ['subhanallah', 'After prayer', 'SubhanAllah', 'سُبْحَانَ ٱللَّٰهِ', 'Glory be to Allah', 'Said 33 times after each prayer (Bukhari & Muslim).', 33],
  ['alhamdulillah', 'After prayer', 'Alhamdulillah', 'ٱلْحَمْدُ لِلَّٰهِ', 'All praise is for Allah', 'Said 33 times after each prayer (Bukhari & Muslim).', 33],
  ['allahuakbar', 'After prayer', 'Allahu Akbar', 'ٱللَّٰهُ أَكْبَرُ', 'Allah is the Greatest', 'Said 33 or 34 times after each prayer (Bukhari & Muslim).', 34],
  ['tahlil', 'After prayer', 'Full Tahlil', 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ ٱلْمُلْكُ وَلَهُ ٱلْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', 'There is no god but Allah alone, without partner. His is the dominion and His is the praise, and He has power over all things.', 'Completes the 100 after prayer (Muslim). Said 100 times a day, it carries great reward (Bukhari & Muslim).', 1],
  ['lailaha', 'Daily', 'La ilaha illallah', 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', 'There is no god but Allah', 'The best of remembrance (Tirmidhi).', 100],
  ['bihamdihi', 'Daily', 'SubhanAllahi wa bihamdihi', 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ', 'Glory and praise be to Allah', 'Whoever says it 100 times a day, his sins are forgiven even if like the foam of the sea (Bukhari & Muslim).', 100],
  ['azim', 'Daily', 'SubhanAllahil Azim', 'سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ سُبْحَانَ ٱللَّٰهِ ٱلْعَظِيمِ', 'Glory and praise be to Allah; glory be to Allah the Magnificent', 'Two phrases light on the tongue, heavy on the scale, beloved to the Most Merciful (Bukhari & Muslim).', 100],
  ['hawqala', 'Daily', 'La hawla wa la quwwata', 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ', 'There is no power and no strength except with Allah', 'A treasure from the treasures of Paradise (Bukhari & Muslim).', 100],
  ['istighfar', 'Forgiveness', 'Astaghfirullah', 'أَسْتَغْفِرُ ٱللَّٰهَ', 'I seek forgiveness from Allah', 'The Prophet ﷺ sought Allah\'s forgiveness many times every day (Bukhari & Muslim).', 100],
  ['salawat', 'Salawat', 'Salawat on the Prophet ﷺ', 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', 'O Allah, send blessings upon Muhammad', 'Whoever sends one blessing upon me, Allah sends ten upon him (Muslim).', 100],
  ['hasbunallah', 'Dua', 'Hasbunallah', 'حَسْبُنَا ٱللَّٰهُ وَنِعْمَ ٱلْوَكِيلُ', 'Allah is enough for us, and He is the best protector', 'Words of reliance on Allah (Quran 3:173, Bukhari).', 100],
  ['yunus', 'Dua', 'Dua of Yunus ﷺ', 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ ٱلظَّالِمِينَ', 'There is no god but You, glory be to You; I was among the wrongdoers', 'The prayer of Yunus ﷺ (Quran 21:87). The Prophet ﷺ said Allah answers whoever calls with it (Tirmidhi).', 100],
]
const PREF0 = { name: EDITION.name, accent: EDITION.accent || '', scale: 1, radius: 'round', glass: true, pattern: true, motion: true, h24: !!EDITION.h24, hidden: EDITION.hidden || [] }
const SWATCHES = ['#C9A24B', '#D4AF37', '#E8AA8C', '#F472B6', '#C8AAF0', '#60A5FA', '#5AC8D2', '#2DD4BF', '#86EFAC', '#F0BE3C', '#FB923C', '#F87171']
const BACKUP_KEYS = ['loc', 'alerts', 'done', 'theme', 'calc', 'prefs', 'tasbih2', 'khatm', 'qada', 'gold', 'lastSurah', 'qsize']
const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}` }
let use24 = !!EDITION.h24, userName = EDITION.name
const CUSTOM_ID = 'custom'
const CATS = ['All', 'After prayer', 'Daily', 'Forgiveness', 'Salawat', 'Dua']
const GUIDED = ['subhanallah', 'alhamdulillah', 'allahuakbar', 'tahlil']
const dhikrOf = (id, c) => id === CUSTOM_ID ? [CUSTOM_ID, 'Custom', c?.name || 'My dhikr', c?.ar || '', '', 'Your own dhikr. Type any name or text you like.', 33] : DHIKR.find((d) => d[0] === id) || DHIKR[0]
const GUIDED_GOAL = { subhanallah: 33, alhamdulillah: 33, allahuakbar: 34, tahlil: 1 }
const TS0 = { sel: 'subhanallah', counts: {}, goals: {}, days: {}, total: 0, vib: true, snd: false, guided: false, step: 0, gc: 0, custom: { name: 'My dhikr', ar: '' }, cat: 'All' }
let clickCtx = null
function clickSound() {
  try {
    clickCtx = clickCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = clickCtx.createOscillator(), g = clickCtx.createGain(), t = clickCtx.currentTime
    o.frequency.value = 520; o.connect(g); g.connect(clickCtx.destination)
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); o.start(t); o.stop(t + 0.08)
  } catch { /* audio blocked */ }
}
const DUAS = [
  ['Before eating', 'بِسْمِ ٱللَّٰهِ', 'In the name of Allah.'],
  ['After eating', 'ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ', 'Praise be to Allah who fed us, gave us drink and made us Muslims.'],
  ['Waking up', 'ٱلْحَمْدُ لِلَّٰهِ ٱلَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ ٱلنُّشُورُ', 'Praise be to Allah who gave us life after causing us to die, and to Him is the resurrection.'],
  ['Before sleeping', 'بِٱسْمِكَ ٱللَّٰهُمَّ أَمُوتُ وَأَحْيَا', 'In Your name, O Allah, I die and I live.'],
  ['Leaving home', 'بِسْمِ ٱللَّٰهِ تَوَكَّلْتُ عَلَى ٱللَّٰهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ', 'In the name of Allah, I trust in Allah; there is no power or strength except with Allah.'],
  ['Travelling', 'سُبْحَانَ ٱلَّذِي سَخَّرَ لَنَا هَٰذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ وَإِنَّا إِلَىٰ رَبِّنَا لَمُنقَلِبُونَ', 'Glory to Him who subjected this to us, though we could not have done it ourselves; and to our Lord we will surely return. (Quran 43:13-14)'],
  ['Entering the mosque', 'ٱللَّهُمَّ ٱفْتَحْ لِي أَبْوَابَ رَحْمَتِكَ', 'O Allah, open for me the doors of Your mercy.'],
  ['Leaving the mosque', 'ٱللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ', 'O Allah, I ask You for Your bounty.'],
  ['After wudu', 'أَشْهَدُ أَنْ لَا إِلَٰهَ إِلَّا ٱللَّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ', 'I bear witness that there is no god but Allah alone with no partner, and that Muhammad is His servant and Messenger.'],
  ['Seeking forgiveness', 'أَسْتَغْفِرُ ٱللَّٰهَ وَأَتُوبُ إِلَيْهِ', 'I seek forgiveness from Allah and turn to Him in repentance.'],
  ['Good in both worlds', 'رَبَّنَا آتِنَا فِي ٱلدُّنْيَا حَسَنَةً وَفِي ٱلْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ', 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire. (Quran 2:201)'],
]
const THEMES = [['emerald', 'Emerald Night', '#0B2E2A', '#C9A24B'], ['midnight', 'Royal Midnight', '#0A1228', '#D4AF37'], ['rose', 'Rose Garden', '#2A0E20', '#E8AA8C'], ['onyx', 'Black & Gold', '#0E0E0E', '#D4AF37'], ['sand', 'Desert Sand (light)', '#F7F1E3', '#966919'], ['ocean', 'Ocean Teal', '#062838', '#78D2C8'], ['medina', 'Green Dome (Madinah)', '#08280F', '#E0BE5A'], ['lapis', 'Persian Lapis', '#0C1840', '#5AC8D2'], ['andalus', 'Andalusian Clay', '#34160E', '#E6AA50'], ['twilight', 'Twilight Violet', '#1A1030', '#C8AAF0'], ['pearl', 'Pearl Garden (light)', '#F4F8F4', '#146E50'], ['saffron', 'Saffron Amber', '#241808', '#F0BE3C']]
const EVENTS = [['Islamic New Year', 1, 1], ['Day of Ashura', 10, 1], ["Mawlid (Prophet's birthday)", 12, 3], ["Isra and Mi'raj", 27, 7], ['Start of Ramadan', 1, 9], ['Laylat al-Qadr (27th night)', 27, 9], ['Eid al-Fitr', 1, 10], ['Day of Arafah', 9, 12], ['Eid al-Adha', 10, 12]]
const pad = (n) => String(n).padStart(2, '0')
const to12 = (t) => { const [h, m] = t.slice(0, 5).split(':').map(Number); if (use24) return `${pad(h)}:${pad(m)}`; return `${h % 12 || 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}` }
const hm = (t) => t.slice(0, 5).split(':').map(Number)
const add = (t, m) => { const [h, mi] = hm(t); const x = h * 60 + mi + m; return `${pad(Math.floor(x / 60) % 24)}:${pad(x % 60)}` }
const RAK = { Fajr: 2, Dhuhr: 4, Asr: 4, Maghrib: 3, Isha: 4 }
const HADITH = [
  ['Actions are judged by intentions, and everyone will get what they intended.', 'Bukhari & Muslim'],
  ['None of you truly believes until he loves for his brother what he loves for himself.', 'Bukhari & Muslim'],
  ['The best of you are those who learn the Quran and teach it.', 'Bukhari'],
  ['Whoever believes in Allah and the Last Day, let him speak good or remain silent.', 'Bukhari & Muslim'],
  ['Religion is sincerity and goodwill.', 'Muslim'],
  ['Smiling at your brother is charity.', 'Tirmidhi'],
  ['Make things easy and do not make them difficult; give glad tidings and do not drive people away.', 'Bukhari & Muslim'],
  ['The most beloved deeds to Allah are the most consistent, even if they are small.', 'Bukhari & Muslim'],
  ['The strong person is the one who controls himself in anger.', 'Bukhari & Muslim'],
  ['Whoever treads a path seeking knowledge, Allah makes easy for him a path to Paradise.', 'Muslim'],
]
const store = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5)
function useLocal(k, d) { const [v, set] = useState(() => store(k, d)); useEffect(() => localStorage.setItem(k, JSON.stringify(v)), [k, v]); return [v, set] }
function useFetch(url) {
  const q = useQuery({ queryKey: [url], enabled: !!url, staleTime: 5 * 60_000, queryFn: () => fetch(url).then((r) => r.json()).then((j) => j.data ?? j) })
  return { data: q.data ?? null, error: q.isError, loading: q.isLoading }
}
function Sheet({ onClose, children }) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-30 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content aria-describedby={undefined} className="fade-in fixed inset-x-0 bottom-0 z-40 mx-auto sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gold/40 bg-night p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:p-6">
          <div aria-hidden className="mx-auto mb-4 h-1 w-10 rounded-full bg-gold/40 sm:hidden" /><Dialog.Title className="sr-only">Panel</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
// ---------- Adhan sound (built-in call to prayer + optional uploaded adhan) ----------
const ADHAN_SRC = `${import.meta.env.BASE_URL}adhan.mp3`
const SILENT = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='
let player = null, adhanUrl = null, customUrl = null, playingNow = false, unlocked = false
const playListeners = new Set()
const setPlaying = (v) => { playingNow = v; playListeners.forEach((f) => f(v)) }
function usePlaying() {
  const [p, set] = useState(playingNow)
  useEffect(() => { playListeners.add(set); set(playingNow); return () => { playListeners.delete(set) } }, [])
  return p
}
const getPlayer = () => {
  if (!player) { player = new Audio(); player.preload = 'auto'; player.onended = () => setPlaying(false) }
  return player
}
// Browsers only allow sound after the person has touched the page once; this "unlocks" the audio element silently.
function unlockAudio() {
  if (unlocked) return
  try {
    const p = getPlayer(); p.muted = true; p.src = SILENT
    p.play().then(() => { if (p.src === SILENT) p.pause(); p.muted = false; unlocked = true }).catch(() => { p.muted = false })
  } catch { /* unsupported */ }
}
const loadAdhan = () => fetch(ADHAN_SRC).then((r) => r.blob()).then((b) => { adhanUrl = URL.createObjectURL(b) }).catch(() => {})
async function playAdhan(vol = 0.6, which = 'adhan') {
  try {
    const p = getPlayer(); p.muted = false; p.volume = vol
    p.src = which === 'custom' && customUrl ? customUrl : adhanUrl || ADHAN_SRC
    await p.play(); setPlaying(true); return true
  } catch { setPlaying(false); return false }
}
function stopAdhan() { if (!player) return; player.pause(); try { player.currentTime = 0 } catch { /* ignore */ } setPlaying(false) }
const idbOp = (mode, fn) => new Promise((res, rej) => {
  const o = indexedDB.open('daily-prayer', 1)
  o.onupgradeneeded = () => o.result.createObjectStore('kv')
  o.onerror = () => rej(o.error)
  o.onsuccess = () => { const tx = o.result.transaction('kv', mode), rq = fn(tx.objectStore('kv')); tx.oncomplete = () => res(rq.result); tx.onerror = () => rej(tx.error) }
})
async function loadCustom() {
  try {
    let rec = await idbOp('readonly', (s) => s.get('tone'))
    if (!rec) { // move a tone saved by the older version into the new storage
      const old = store('customTone', null)
      if (old) { rec = { name: 'My uploaded adhan', blob: await (await fetch(old)).blob() }; await idbOp('readwrite', (s) => s.put(rec, 'tone')) }
    }
    if (customUrl) URL.revokeObjectURL(customUrl)
    customUrl = rec ? URL.createObjectURL(rec.blob) : null
    if (rec) localStorage.removeItem('customTone')
    return rec ? { name: rec.name } : null
  } catch { return null }
}
const saveCustom = async (file) => { await idbOp('readwrite', (s) => s.put({ name: file.name, blob: file }, 'tone')); return loadCustom() }
async function removeCustom() {
  stopAdhan()
  try { await idbOp('readwrite', (s) => s.delete('tone')) } catch { /* ignore */ }
  localStorage.removeItem('customTone')
  if (customUrl) URL.revokeObjectURL(customUrl)
  customUrl = null
}
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
function fire(al, msg) {
  toast(msg, { duration: 30000, action: al.sound ? { label: 'Stop adhan', onClick: stopAdhan } : undefined })
  if (al.sound) ring(al).then((ok) => { if (!ok) toast('Your browser blocked the sound', { duration: 30000, action: { label: 'Play adhan', onClick: () => ring(al) } }) })
  if (al.speak) speak(msg)
  notify(msg, `${userName || 'Daily Prayer'} · Prayer reminder`)
}
// ---------- Reminder schedule (before / at / after each prayer) ----------
const offsetsOf = (al) => al.offsets ?? [al.lead ? -al.lead : 0]
const offLabel = (o) => (o === 0 ? 'At prayer time' : o < 0 ? `${-o} min before` : `${o} min after`)
const localNow = (tz) => (tz ? new Date(new Date().toLocaleString('en-US', { timeZone: tz })) : new Date())
function dueList(timings, tz, al) {
  const n = localNow(tz), day = n.toDateString(), out = []
  FIVE.forEach((k) => {
    if (!al.prayers[k] || !timings[k]) return
    const [h, m] = hm(timings[k]), at = new Date(n); at.setHours(h, m, 0, 0)
    offsetsOf(al).forEach((off) => out.push({ id: `${day}|${k}|${off}`, k, off, day, n, time: timings[k], trig: new Date(at.getTime() + off * 60000) }))
  })
  return out
}
const firedIds = () => store('firedAlerts', [])
const markFired = (ids, day) => { try { localStorage.setItem('firedAlerts', JSON.stringify([...new Set([...firedIds().filter((x) => x.startsWith(day)), ...ids])])) } catch { /* ignore */ } }
const alertText = (d) => (d.off === 0 ? `It is time for ${d.k} (${to12(d.time)})` : d.off < 0 ? `${d.k} in ${-d.off} minutes (${to12(d.time)})` : `${d.k} was ${d.off} minutes ago (${to12(d.time)}). Have you prayed?`)
const streakOf = (done, now) => {
  let n = 0; const d = new Date(now)
  if ((done[d.toDateString()] || []).length < 5) d.setDate(d.getDate() - 1)
  while ((done[d.toDateString()] || []).length === 5) { n++; d.setDate(d.getDate() - 1) }
  return n
}
const Msg = ({ s }) => s.error ? <p className="text-mist">Could not load. Check your connection.</p> : <div className="space-y-3" role="status" aria-label="Loading"><div className="skeleton h-6 w-2/3" /><div className="skeleton h-28 w-full" /><div className="skeleton h-6 w-1/2" /></div>
function PageHead({ tab }) {
  const Icon = ICONS[tab]
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-gold to-gold/70 text-night shadow-lg shadow-black/25 sm:size-14"><Icon className="size-6 sm:size-7" /></div>
      <div className="min-w-0"><h2 className="font-display text-3xl font-semibold leading-none sm:text-4xl">{TABS.find((t) => t[0] === tab)?.[1]}</h2><p className="mt-1.5 truncate text-sm text-mist">{SUB[tab]}</p></div>
    </div>
  )
}
const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-3xl border border-gold/25 bg-linear-to-br from-emerald/60 to-emerald/20 p-4 shadow-lg shadow-black/10 sm:p-6 ${className}`}>
    {title && <h2 className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[.16em] text-gold"><span className="h-px w-6 bg-gold/60" />{title}</h2>}{children}
  </section>
)
const Btn = ({ className = '', ...p }) => <button {...p} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm text-gold transition hover:bg-gold hover:text-night ${className}`} />
const IconBtn = ({ className = '', ...p }) => <button {...p} className={`grid size-11 shrink-0 place-items-center rounded-full border border-gold/40 text-gold transition active:bg-gold active:text-night ${className}`} />

export default function App() {
  const [loc, setLoc] = useLocal('loc', DEFAULT_LOC)
  const [al, setAl] = useLocal('alerts', { on: false, offsets: [-5, 0], sound: true, tone: 'adhan', vol: 0.6, prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true } })
  const [done, setDone] = useLocal('done', {})
  const [theme, setTheme] = useLocal('theme', EDITION.theme || 'emerald')
  const [calc, setCalc] = useLocal('calc', { method: EDITION.method ?? 3, school: EDITION.school ?? 0 })
  const [prefs, setPrefs] = useLocal('prefs', PREF0)
  const P = { ...PREF0, ...prefs }
  use24 = P.h24; userName = P.name
  const tabs = TABS.filter(([k]) => !P.hidden.includes(k))
  useEffect(() => {
    const r = document.documentElement
    r.dataset.radius = P.radius; r.dataset.glass = P.glass ? 'on' : 'off'; r.dataset.pattern = P.pattern ? 'on' : 'off'; r.dataset.motion = P.motion ? 'on' : 'off'
    r.style.setProperty('--scale', P.scale)
    if (P.accent) r.style.setProperty('--gold', rgbOf(P.accent)); else r.style.removeProperty('--gold')
  }, [JSON.stringify(P)])
  useEffect(() => { const r = document.documentElement; r.dataset.theme = theme; document.querySelector('meta[name=theme-color]')?.setAttribute('content', `rgb(${getComputedStyle(r).getPropertyValue('--night').trim()})`) }, [theme])
  const [tab, setTab] = useState('home')
  const [modal, setModal] = useState(null)
  useEffect(() => { if (!tabs.some((t) => t[0] === tab)) setTab('home') })
    const [now, setNow] = useState(new Date())
  const [custom, setCustom] = useState(null)
  const live = useRef({})
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, [])

  const dateStr = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
  const times = useFetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${loc.lat}&longitude=${loc.lng}&method=${calc.method}&school=${calc.school}`)
  const timings = times.data?.timings, hijri = times.data?.date?.hijri, tz = times.data?.meta?.timezone
  const local = useMemo(() => (tz ? new Date(now.toLocaleString('en-US', { timeZone: tz })) : now), [now, tz])

  const next = useMemo(() => {
    if (!timings) return null
    const at = (k, off = 0) => { const [h, m] = hm(timings[k]); const d = new Date(local); d.setHours(h, m, 0, 0); return new Date(d.getTime() + off * 864e5) }
    const i = FIVE.findIndex((k) => at(k) > local)
    const k = i < 0 ? 'Fajr' : FIVE[i]
    const nd = i < 0 ? at('Fajr', 1) : at(k)
    const pd = i < 0 ? at('Isha') : i === 0 ? at('Isha', -1) : at(FIVE[i - 1])
    const diff = nd - local
    return { k, at: nd, h: Math.floor(diff / 36e5), m: Math.floor((diff % 36e5) / 6e4), s: Math.floor((diff % 6e4) / 1e3), pct: Math.min(1, Math.max(0, (local - pd) / (nd - pd))) }
  }, [timings, local])

  live.current = { al, timings, tz }
  useEffect(() => {
    loadAdhan(); loadCustom().then(setCustom)
    const go = () => unlockAudio(), ev = ['pointerdown', 'keydown', 'touchend']
    ev.forEach((e) => window.addEventListener(e, go, { passive: true }))
    return () => ev.forEach((e) => window.removeEventListener(e, go))
  }, [])
  // Checks the schedule every second. A Web Worker keeps ticking even when the tab is in the background.
  useEffect(() => {
    const check = () => {
      const { al: a, timings: t, tz: z } = live.current
      if (isNative || !a?.on || !t) return
      dueList(t, z, a).forEach((d) => {
        const late = d.n - d.trig
        if (late >= 0 && late < 120000 && !firedIds().includes(d.id)) { markFired([d.id], d.day); fire(a, alertText(d)) }
      })
    }
    let w, i
    try { w = new Worker(URL.createObjectURL(new Blob(['setInterval(()=>postMessage(1),1000)'], { type: 'text/javascript' }))); w.onmessage = check } catch { i = setInterval(check, 1000) }
    return () => { w?.terminate(); clearInterval(i) }
  }, [])
  // When alerts are switched on or the schedule changes, reminders that are already in the past stay silent.
  useEffect(() => {
    if (!al.on || !timings) return
    const list = dueList(timings, tz, al); if (list.length) markFired(list.filter((d) => d.n >= d.trig).map((d) => d.id), list[0].day)
  }, [al.on, JSON.stringify(offsetsOf(al)), JSON.stringify(al.prayers), timings])

  const pick = (l) => { setLoc(l); setModal(null) }
  const day = local.toDateString()
  const [bump, setBump] = useState(0)
  const [perm, setPerm] = useState(null)
  useEffect(() => {
    if (!isNative) return
    nativeInit()
    const f = () => document.visibilityState === 'visible' && setBump((x) => x + 1)
    const g = () => setBump((x) => x + 1)
    document.addEventListener('visibilitychange', f)
    window.addEventListener('prayer-resched', g)
    let offResume = () => {}, offAction = () => {}, dead = false
    onResume(g).then((r) => { if (dead) r(); else offResume = r })
    onAction((id, n) => {
      const x = n?.extra || {}
      if (id === 'prayed' && x.prayer) {
        setDone((d) => { const cur = d[x.day] || []; return cur.includes(x.prayer) ? d : { ...d, [x.day]: [...cur, x.prayer] } })
        toast.success(`${x.prayer} marked as prayed. Jazakallahu khairan`)
      }
      if (id === 'snooze') { snooze(n); toast('We will remind you again in 10 minutes') }
    }).then((r) => { if (dead) r(); else offAction = r })
    return () => { dead = true; offResume(); offAction(); document.removeEventListener('visibilitychange', f); window.removeEventListener('prayer-resched', g) }
  }, [])
  useEffect(() => {
    if (!isNative) return
    if (!al.on) { cancelAll(); return }
    scheduleAll({
      loc, calc, al, prayers: FIVE, offsets: offsetsOf(al), who: userName,
      describe: ({ k, off, time, next, jumuah }) => {
        const jm = jumuah && k === 'Dhuhr', head = jm ? "Jumu'ah" : k
        const title = off === 0 ? `${head} · ${to12(time)}` : off < 0 ? `${head} in ${-off} minutes` : `${head} · ${off} minutes ago`
        const body = jm && off === 0 ? "Jumu'ah Mubarak. It is time for the Jumu'ah prayer." : alertText({ k, off, time })
        return { title, body, large: `${body}${next ? `\nNext: ${next.k} at ${to12(next.time)}` : ''}\n${userName || 'Daily Prayer'}` }
      },
    })
    notifStatus().then(setPerm)
  }, [al.on, al.sound, JSON.stringify(offsetsOf(al)), JSON.stringify(al.prayers), JSON.stringify(al.extras), loc.lat, loc.lng, calc.method, calc.school, P.name, bump, day])
  useEffect(() => { if (isNative && !localStorage.getItem('setupDone')) setModal('setup') }, [])
  return (
    <div className="pattern min-h-dvh pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      <Toaster position="top-center" richColors mobileOffset={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }} />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-gold/20 bg-night/80 p-4 backdrop-blur-xl lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="grid size-11 place-items-center rounded-xl bg-gold text-night"><Moon className="size-5" /></div>
          <div><p className="font-arabic text-xl leading-none text-gold">{P.name || 'Companion'}</p><p className="mt-1 text-xs text-mist">{EDITION.tagline || 'Prayer times'}</p></div>
        </div>
        <nav aria-label="Sections" className="flex-1 space-y-1 overflow-y-auto">
          {tabs.map(([k, n]) => {
            const Icon = ICONS[k], on = tab === k
            return (
              <button key={k} onClick={() => setTab(k)} aria-current={on ? 'page' : undefined} className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${on ? 'text-night' : 'text-ivory/80 hover:bg-emerald/40'}`}>
                {on && <motion.span layoutId="side" className="absolute inset-0 rounded-xl bg-gold" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />}
                <Icon className="relative size-5" /><span className="relative">{n}</span>
              </button>
            )
          })}
        </nav>
        {next && (
          <div className="mt-3 rounded-2xl border border-gold/25 bg-linear-to-br from-emerald/60 to-emerald/20 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[.2em] text-mist">Next · {next.k}</p>
            <p className="mt-1 font-arabic text-3xl tabular-nums text-gold">{pad(next.h)}:{pad(next.m)}:{pad(next.s)}</p>
            {hijri && <p className="mt-1 text-xs text-mist">{hijri.day} {hijri.month.en} {hijri.year} AH</p>}
          </div>
        )}
      </aside>
      <div className="lg:pl-64">
      <header className="sticky top-0 z-10 flex h-(--hdr) items-center gap-2 border-b border-gold/15 bg-night/85 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:gap-3 sm:px-6">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold text-night lg:hidden"><Moon className="size-5" /></div>
        <button onClick={() => setModal('loc')} className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-gold/40 px-4 text-sm text-gold transition active:bg-gold active:text-night lg:max-w-sm lg:flex-none"><MapPin className="size-4 shrink-0" /><span className="truncate">{loc.name}</span></button>
        <div className="flex shrink-0 gap-2 lg:ml-auto">
          <IconBtn aria-label="Prayer alerts" onClick={() => setModal('alerts')}>{al.on ? <Bell className="size-5" /> : <BellOff className="size-5" />}</IconBtn>
          <IconBtn aria-label="Themes and settings" onClick={() => setModal('settings')}><Palette className="size-5" /></IconBtn>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-6 lg:pb-12 xl:max-w-6xl 2xl:max-w-7xl">
        <section className={`py-5 text-center ${tab !== 'home' ? 'hidden' : ''}`}>
          <p className="font-arabic text-2xl text-gold sm:text-4xl">بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
          <h1 className="mt-3 bg-linear-to-b from-ivory to-gold bg-clip-text pb-1 font-display text-3xl font-semibold text-transparent min-[380px]:text-4xl sm:text-5xl lg:text-6xl">{EDITION.greeting || 'Assalamu Alaikum'}{P.name && P.name !== EDITION.name ? `, ${P.name}` : ''}</h1>
          <p className="mt-2 text-sm text-mist sm:text-base">
            {local.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {hijri && <> · {hijri.day} {hijri.month.en} {hijri.year} AH</>}
          </p>
          {hijri?.month?.number === 9 && <p className="mt-2 font-medium text-gold">🌙 Ramadan Mubarak</p>}
          {EDITION.dedication && <p className="mx-auto mt-3 max-w-xl rounded-full border border-gold/30 bg-gold/10 px-5 py-2 text-sm text-gold">{EDITION.dedication}</p>}
          {local.getDay() === 5 && <p className="mt-2 text-gold">Jumu'ah Mubarak · Recite Surah Al-Kahf and send salawat upon the Prophet ﷺ</p>}
        </section>

        <div key={tab} className="fade-in">
        {isNative && al.on && perm && !perm.notif && (
          <button onClick={() => setModal('alerts')} className="mb-4 flex w-full items-center gap-3 rounded-2xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-left text-sm">
            <BellOff className="size-5 shrink-0 text-amber-300" /><span><b className="block">Prayer alerts are blocked</b><span className="text-mist">Tap to fix. Android is not allowing notifications for this app.</span></span>
          </button>
        )}
        {tab !== 'home' && <PageHead tab={tab} />}
        {tab === 'home' && <Home timings={timings} next={next} err={times.error} day={day} local={local} done={done} setDone={setDone} hijri={hijri} />}
        {tab === 'month' && <Month loc={loc} now={local} calc={calc} />}
        {tab === 'quran' && <Quran />}
        {tab === 'duas' && <Duas />}
        {tab === 'names' && <Names />}
        {tab === 'tasbih' && <Tasbih />}
        {tab === 'qibla' && <Qibla loc={loc} />}
        {tab === 'zakat' && <Zakat />}
        {tab === 'events' && <Events hijri={hijri} now={local} />}
        {tab === 'mosques' && <Mosques loc={loc} />}
        {tab === 'ibadah' && <Ibadah />}
        </div>
      </main>

  <footer className="border-t border-gold/20 px-4 py-6 pb-28 text-center lg:pb-6">
  <p className="font-arabic text-xl text-gold">جَزَاكِ ٱللَّٰهُ خَيْرًا</p>

  <p className="mt-3 text-sm text-mist">
    © {new Date().getFullYear()} {P.name || EDITION.name}. {EDITION.tagline ? `${EDITION.tagline} · ` : ''}All rights reserved.
  </p>
</footer>
      </div>
      <nav aria-label="Main" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-md rounded-3xl border border-gold/30 bg-night/85 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden">
          {[...PRIMARY.filter((k) => tabs.some((t) => t[0] === k)).map((k) => [k, TABS.find((t) => t[0] === k)[1]]), ['more', 'More']].map(([k, n]) => {
            const Icon = k === 'more' ? Ellipsis : ICONS[k], on = k === 'more' ? !PRIMARY.includes(tab) : tab === k
            return (
              <button key={k} onClick={() => (k === 'more' ? setModal('more') : setTab(k))} aria-current={on ? 'page' : undefined} className={`relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2.5 short:py-1 text-[11px] font-medium ${on ? 'text-gold' : 'text-ivory/70'}`}>
                {on && <motion.span layoutId="botpill" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} className="absolute inset-0 rounded-2xl bg-gold/15 ring-1 ring-gold/30" />}
                <Icon className="relative size-5" /><span className="relative">{n}</span>
              </button>
            )
          })}
        </nav>
      {modal === 'more' && (
        <Sheet onClose={() => setModal(null)}>
          <h2 className="mb-4 text-xl font-semibold text-gold">More</h2>
          <div className="grid grid-cols-3 gap-3">
            {tabs.filter(([k]) => !PRIMARY.includes(k)).map(([k, n]) => {
              const Icon = ICONS[k]
              return <button key={k} onClick={() => { setTab(k); setModal(null) }} className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-xs font-medium ${tab === k ? 'border-gold bg-emerald/60' : 'border-gold/25 hover:border-gold'}`}><Icon className="size-6 text-gold" />{n}</button>
            })}
          </div>
        </Sheet>
      )}
      {modal === 'settings' && <Settings theme={theme} setTheme={setTheme} calc={calc} setCalc={setCalc} P={P} setPrefs={setPrefs} onClose={() => setModal(null)} />}
      {modal === 'loc' && <Picker onPick={pick} onClose={() => setModal(null)} />}
      {modal === 'setup' && <Setup al={al} setAl={setAl} onPick={pick} onClose={() => { localStorage.setItem('setupDone', '1'); setModal(null) }} />}
      {modal === 'alerts' && <Alerts al={al} setAl={setAl} custom={custom} setCustom={setCustom} test={() => { if (isNative) { sendTest(al).then((ok) => ok ? toast.success('Test alert in 4 seconds. Lock the phone or close the app to check.') : toast.error('Notifications are blocked. Allow them in Android Settings > Apps > Daily Prayer.')) } else { unlockAudio(); fire(al, 'Test alert: this is how your reminder looks') } }} onClose={() => setModal(null)} />}
    </div>
  )
}

function Home({ timings, next, err, day, local, done, setDone, hijri }) {
  const today = done[day] || []
  const toggle = (k) => setDone({ ...done, [day]: today.includes(k) ? today.filter((x) => x !== k) : [...today, k] })
  const ayah = useFetch(`https://api.alquran.cloud/v1/ayah/${((dayOfYear(local) * 17) % 6236) + 1}/editions/quran-uthmani,en.sahih`)
  const a = ayah.data?.[0], b = ayah.data?.[1]
  const streak = streakOf(done, local)
  return (
    <div className="stagger grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-gold/40 bg-linear-to-b from-emerald/80 to-emerald/30 p-5 text-center shadow-2xl shadow-black/30 sm:p-8 lg:sticky lg:top-[calc(var(--hdr)+1rem)] lg:col-span-5 lg:max-w-none">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        {next ? (
          <div className="relative mx-auto aspect-square w-full max-w-56 short:max-w-40 sm:max-w-64">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
              <defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: 'rgb(var(--gold))' }} /><stop offset="1" style={{ stopColor: 'rgb(var(--ivory))' }} /></linearGradient></defs>
              <circle cx="100" cy="100" r="90" fill="none" className="stroke-night" strokeWidth="8" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#ringg)" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--gold) / .6))', transition: 'stroke-dashoffset 1s linear' }} strokeDasharray="565.5" strokeDashoffset={565.5 * (1 - next.pct)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm text-mist">Next prayer</p>
              <p className="font-display text-4xl font-semibold text-gold">{next.k}</p>
              <p className="font-arabic text-3xl tabular-nums min-[360px]:text-4xl sm:text-5xl">{pad(next.h)}:{pad(next.m)}:{pad(next.s)}</p>
              <p className="text-sm text-mist">at {to12(timings[next.k])}</p>
            </div>
          </div>
        ) : err ? <p className="py-16 text-mist">Could not load prayer times.</p> : <div className="skeleton mx-auto aspect-square w-full max-w-56 !rounded-full" role="status" aria-label="Loading prayer times" />}
        {hijri && <p className="relative mt-5 inline-flex rounded-full border border-gold/30 bg-night/40 px-4 py-1.5 text-xs text-mist">{hijri.day} {hijri.month.en} {hijri.year} AH</p>}
      </div>

      <div className="@container lg:col-span-7"><div className="grid gap-2 @md:grid-cols-3 @md:gap-3 @4xl:grid-cols-6">
        {PRAYERS.map((k) => {
          const on = next?.k === k, sun = k === 'Sunrise', ok = today.includes(k)
          return (
            <button key={k} disabled={sun} onClick={() => toggle(k)} aria-pressed={sun ? undefined : ok} className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] @md:flex-col @md:justify-center @md:gap-1 @md:p-4 @md:text-center ${on ? 'border-gold bg-gold text-night shadow-[0_0_28px_rgb(var(--gold)/0.4)]' : 'border-gold/25 bg-night/70'} ${sun ? 'opacity-70' : ''}`}>
              <span className="flex items-center gap-3 @md:flex-col @md:gap-0">
                <span className={`grid size-11 shrink-0 place-items-center rounded-full ${on ? 'bg-night/15' : 'bg-gold/10 text-gold'}`}>{(() => { const PI = PICON[k]; return <PI className="size-5" /> })()}</span>
                <span><b className="block text-base font-semibold @md:text-sm">{k} <span className={`font-arabic text-base font-normal ${on ? '' : 'text-gold'}`}>{AR[k]}</span></b><span className="block text-xs opacity-70">{RAK[k] ? `${RAK[k]} rakat fard` : 'Fajr time ends'}</span></span>
              </span>
              <span className="text-right @md:text-center">
                <span className="block text-xl font-semibold tabular-nums">{timings ? to12(timings[k]) : '—'}</span>
                <span className="flex h-5 items-center justify-end gap-1 text-xs @md:justify-center">{ok && <><Check className="size-3.5" /> Prayed</>}</span>
              </span>
            </button>
          )
        })}
      </div></div>

      <Card title="Morning & night times" className="lg:col-span-12 lg:order-5">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[['Imsak', timings?.Imsak], ['Duha (approx.)', timings && add(timings.Sunrise, 20)], ['Islamic midnight', timings?.Midnight], ['Last third (Tahajjud)', timings?.Lastthird]].map(([n, v]) => (
            <div key={n}><p className="text-sm text-mist">{n}</p><p className="text-lg font-semibold tabular-nums">{v ? to12(v) : '—'}</p></div>
          ))}
        </div>
      </Card>

      <Card title="Hadith of the day" className="lg:col-span-5 lg:order-6">
        <p className="text-lg leading-relaxed">“{HADITH[dayOfYear(local) % HADITH.length][0]}”</p>
        <p className="mt-2 text-sm text-mist">Meaning of the hadith, paraphrased · {HADITH[dayOfYear(local) % HADITH.length][1]}</p>
      </Card>

      <Card title="Fasting: Sehri & Iftar" className="lg:col-span-7 lg:order-4">
        <p className="text-lg">Sehri ends <b className="text-gold">{timings ? to12(timings.Fajr) : '—'}</b> · Iftar <b className="text-gold">{timings ? to12(timings.Maghrib) : '—'}</b></p>
        <p className="mt-1 text-sm text-mist">{[1, 4].includes(local.getDay()) ? 'Today is Monday/Thursday, a Sunnah fasting day.' : hijri && +hijri.day >= 13 && +hijri.day <= 15 ? 'White Days (13th–15th): Sunnah fasting.' : 'Sunnah fasts: Mondays, Thursdays and the White Days (13th–15th of each Hijri month).'}</p>
      </Card>

      <Card title="Today's progress" className="lg:col-span-5 lg:order-3">
        <div className="h-3 overflow-hidden rounded-full bg-night"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(FIVE.filter((k) => today.includes(k)).length / 5) * 100}%` }} /></div>
        <p className="mt-2 text-sm text-mist">{FIVE.filter((k) => today.includes(k)).length} of 5 prayers · Streak: {streak} day{streak === 1 ? '' : 's'} · Tap a prayer above to mark it done</p>
      </Card>

      <Card title="Verse of the day" className="lg:col-span-7 lg:order-7">
        {a ? <>
          <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-[2.2] sm:text-3xl">{a.text}</p>
          <p className="mt-3 max-w-prose leading-relaxed">{b?.text}</p>
          <p className="mt-2 text-sm text-mist">{a.surah.englishName} {a.surah.number}:{a.numberInSurah}</p>
        </> : <Msg s={ayah} />}
      </Card>
    </div>
  )
}

function Month({ loc, now, calc }) {
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 })
  const d = useFetch(`https://api.aladhan.com/v1/calendar/${ym.y}/${ym.m}?latitude=${loc.lat}&longitude=${loc.lng}&method=${calc.method}&school=${calc.school}`)
  const [view, setView] = useState('table')
  const go = (n) => setYm(({ y, m }) => { const x = new Date(y, m - 1 + n, 1); return { y: x.getFullYear(), m: x.getMonth() + 1 } })
  const isCur = ym.y === now.getFullYear() && ym.m === now.getMonth() + 1
  const first = d.data?.[0]?.date?.hijri, last = d.data?.[d.data.length - 1]?.date?.hijri
  const seg = (on) => `rounded-full px-5 py-2 text-sm font-medium transition ${on ? 'bg-gold text-night shadow-md' : 'text-ivory/80 hover:text-gold'}`
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
          <IconBtn onClick={() => go(-1)} aria-label="Previous month"><ChevronLeft className="size-5" /></IconBtn>
          <div className="min-w-40 text-center sm:text-left">
            <h2 className="font-display text-2xl font-semibold leading-none sm:text-3xl">{new Date(ym.y, ym.m - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
            {first && <p className="mt-1.5 text-xs text-mist">{first.month.en} {first.year}{last && last.month.en !== first.month.en ? ` – ${last.month.en} ${last.year}` : ''} AH</p>}
          </div>
          <IconBtn onClick={() => go(1)} aria-label="Next month"><ChevronRight className="size-5" /></IconBtn>
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {!isCur && <Btn onClick={() => setYm({ y: now.getFullYear(), m: now.getMonth() + 1 })}>Today</Btn>}
          <div role="tablist" className="inline-flex rounded-full border border-gold/30 bg-night/60 p-1">
            {[['table', 'Timetable'], ['cal', 'Calendar']].map(([k, n]) => <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)} className={seg(view === k)}>{n}</button>)}
          </div>
        </div>
      </div>

      {d.data && view === 'cal' ? <CalGrid data={d.data} now={now} ym={ym} /> : d.data ? (
        <>
          <div className="overflow-x-auto rounded-3xl border border-gold/25 bg-night/60 shadow-xl shadow-black/20">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-center tabular-nums">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-emerald px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[.16em] text-gold lg:px-6">Date</th>
                  {PRAYERS.map((c) => <th key={c} className="bg-emerald px-3 py-3 text-xs font-semibold uppercase tracking-[.16em] text-gold"><span className="block">{c}</span><span className="block font-arabic text-sm normal-case tracking-normal opacity-80">{AR[c]}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {d.data.map((r) => {
                  const g = r.date.gregorian, dn = +g.day, dt = new Date(ym.y, ym.m - 1, dn)
                  const t = isCur && dn === now.getDate(), fri = dt.getDay() === 5
                  const cell = 'border-b border-gold/10 px-3 py-3 text-sm lg:py-3.5 lg:text-base'
                  return (
                    <tr key={g.date} className={t ? 'bg-gold font-semibold text-night' : fri ? 'bg-gold/10' : 'odd:bg-emerald/10'}>
                      <td className={`sticky left-0 z-[1] border-b border-gold/10 px-4 py-2.5 text-left lg:px-6 ${t ? 'bg-gold' : fri ? 'bg-emerald' : 'bg-night'}`}>
                        <span className="flex items-center gap-3">
                          <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-base font-semibold ${t ? 'bg-night/15' : 'bg-gold/10 text-gold'}`}>{dn}</span>
                          <span className="leading-tight"><span className="block text-sm font-medium">{dt.toLocaleDateString('en-IN', { weekday: 'short' })}{fri && !t ? " · Jumu'ah" : ''}</span><span className="block text-xs opacity-70">{r.date.hijri.day} {r.date.hijri.month.en}</span></span>
                        </span>
                      </td>
                      {PRAYERS.map((c) => <td key={c} className={`${cell} ${c === 'Sunrise' && !t ? 'text-mist' : ''}`}>{to12(r.timings[c])}</td>)}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-mist"><span className="inline-flex items-center gap-2"><span className="size-3 rounded bg-gold" />Today</span><span className="inline-flex items-center gap-2"><span className="size-3 rounded bg-gold/25" />Friday</span><span>Times for {loc.name}</span></p>
        </>
      ) : <Msg s={d} />}
    </div>
  )
}

function Quran() {
  const [n, setN] = useLocal('lastSurah', null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [playing, setPlaying] = useState(-1)
  const [qs, setQs] = useLocal('qsize', 28)
  const au = useRef(null)
  const list = useFetch('https://api.alquran.cloud/v1/surah')
  const s = useFetch(open && n ? `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.sahih,ar.alafasy` : null)
  const stop = () => { au.current?.pause(); setPlaying(-1) }
  const play = (i) => {
    au.current?.pause()
    const ays = s.data?.[2]?.ayahs
    if (!ays || i < 0 || i >= ays.length) return setPlaying(-1)
    const a = new Audio(ays[i].audio); au.current = a; setPlaying(i)
    a.onended = () => play(i + 1); a.play().catch(() => setPlaying(-1))
  }
  useEffect(() => () => au.current?.pause(), [])
  useEffect(() => { if (playing >= 0) document.getElementById('ay' + playing)?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, [playing])

  if (open && n) return (
    <div>
      <div className="sticky top-(--hdr) z-10 mb-4 flex flex-wrap gap-2 bg-night/95 py-2 backdrop-blur">
        <Btn onClick={() => { stop(); setOpen(false) }}>← All surahs</Btn>
        <Btn onClick={() => setQs(Math.max(20, qs - 4))} aria-label="Smaller text">A−</Btn><Btn onClick={() => setQs(Math.min(56, qs + 4))} aria-label="Larger text">A+</Btn>
        {s.data && (playing >= 0 ? <Btn onClick={stop}>⏸ Stop</Btn> : <Btn onClick={() => play(0)}>▶ Play surah (Alafasy)</Btn>)}
      </div>
      {s.data ? <>
        <h2 className="mb-6 text-center font-arabic text-4xl text-gold">{s.data[0].name}</h2>
        <ol className="space-y-4">
          {s.data[0].ayahs.map((a, i) => (
            <li id={'ay' + i} key={a.number} className={`rounded-2xl border p-4 sm:p-5 ${playing === i ? 'border-gold bg-emerald/60' : 'border-gold/20 bg-night/70'}`}>
              <p dir="rtl" lang="ar" style={{ fontSize: qs }} className="font-arabic leading-[2.2]">{a.text}</p>
              <p className="mt-3 max-w-prose leading-relaxed text-ivory/90"><span className="text-gold">{a.numberInSurah}.</span> {s.data[1].ayahs[i].text}</p>
              <button onClick={() => play(i)} className="mt-2 text-sm text-gold">▶ Listen</button>
            </li>
          ))}
        </ol>
      </> : <Msg s={s} />}
    </div>
  )
  if (!list.data) return <Msg s={list} />
  const shown = list.data.filter((x) => `${x.number} ${x.englishName} ${x.englishNameTranslation}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surah name or number" className="mb-4 w-full rounded-full border border-gold/40 bg-night px-5 py-3 text-ivory placeholder:text-mist" />
      {n && <Btn className="mb-4" onClick={() => setOpen(true)}>Continue: {list.data[n - 1]?.englishName}</Btn>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((x) => (
          <li key={x.number}><button onClick={() => { setN(x.number); setOpen(true) }} className="flex w-full items-center justify-between rounded-2xl border border-gold/25 bg-night/70 p-4 text-left hover:border-gold">
            <span className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-sm font-semibold tabular-nums text-gold">{x.number}</span><span className="min-w-0"><b className="block truncate font-medium">{x.englishName}</b><span className="text-sm text-mist">{x.englishNameTranslation} · {x.numberOfAyahs} verses</span></span></span>
            <span className="font-arabic text-2xl">{x.name.replace('سورة', '').trim()}</span>
          </button></li>
        ))}
      </ul>
    </div>
  )
}

function Duas() {
  const [copied, setCopied] = useState(-1)
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DUAS.map(([t, ar, en], i) => (
        <Card key={t} title={t}>
          <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-[2.2] sm:text-3xl">{ar}</p>
          <p className="mt-2 text-ivory/90">{en}</p>
          <button className="mt-3 text-sm text-gold" onClick={() => navigator.clipboard?.writeText(`${ar}\n${en}`).then(() => setCopied(i))}>{copied === i ? 'Copied ✓' : 'Copy'}</button>
        </Card>
      ))}
    </div>
  )
}

function Names() {
  const [q, setQ] = useState('')
  const d = useFetch('https://api.aladhan.com/v1/asmaAlHusna')
  if (!d.data) return <Msg s={d} />
  const shown = d.data.filter((x) => `${x.transliteration} ${x.en.meaning}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or meaning" className="mb-4 w-full rounded-full border border-gold/40 bg-night px-5 py-3 text-ivory placeholder:text-mist" />
      <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {shown.map((x) => (
          <li key={x.number} className="relative rounded-2xl border border-gold/25 bg-night/70 p-4 text-center"><span className="absolute left-3 top-3 grid size-7 place-items-center rounded-lg bg-gold/10 text-xs font-semibold text-gold tabular-nums">{x.number}</span>
            <p className="font-arabic text-4xl text-gold">{x.name}</p>
            <p className="mt-1 font-medium">{x.transliteration}</p>
            <p className="text-sm text-mist">{x.en.meaning}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Tasbih() {
  const [t, setT] = useLocal('tasbih2', TS0)
  const [sure, setSure] = useState(false)
  const s = { ...TS0, ...t }, set = (patch) => setT({ ...s, ...patch })
  const day = new Date().toDateString()
  const gid = GUIDED[s.step] ?? GUIDED[0]
  const id = s.guided ? gid : s.sel
  const d = dhikrOf(id, s.custom), [, , name, ar, meaning, virtue, defGoal] = d
  const goal = s.guided ? GUIDED_GOAL[id] : s.goals[id] ?? defGoal
  const count = s.guided ? s.gc : s.counts[id] || 0
  const rem = count % goal, rounds = Math.floor(count / goal)
  const pct = count === 0 ? 0 : rem === 0 ? 1 : rem / goal
  const buzz = (p) => { if (s.vib) navigator.vibrate?.(p) }
  useEffect(() => { if (!sure) return; const i = setTimeout(() => setSure(false), 3000); return () => clearTimeout(i) }, [sure])

  const tap = () => {
    if (s.snd) clickSound()
    const base = { total: s.total + 1, days: { ...s.days, [day]: (s.days[day] || 0) + 1 } }
    if (s.guided) {
      const c = s.gc + 1
      if (c < goal) { buzz(15); return set({ ...base, gc: c }) }
      if (s.step < GUIDED.length - 1) {
        buzz([80, 40, 80]); toast(`${name} complete. Next: ${dhikrOf(GUIDED[s.step + 1])[2]}`)
        return set({ ...base, step: s.step + 1, gc: 0 })
      }
      buzz([120, 60, 120, 60, 200]); toast.success('Tasbih complete. May Allah accept it from you.')
      return set({ ...base, step: 0, gc: 0 })
    }
    const c = count + 1
    if (c % goal === 0) { buzz([80, 40, 80]); toast.success(`${goal} × ${name} complete`) } else buzz(15)
    set({ ...base, counts: { ...s.counts, [id]: c } })
  }
  const undo = () => {
    if (count < 1) return
    const dec = { total: Math.max(0, s.total - 1), days: { ...s.days, [day]: Math.max(0, (s.days[day] || 0) - 1) } }
    set(s.guided ? { ...dec, gc: s.gc - 1 } : { ...dec, counts: { ...s.counts, [id]: count - 1 } })
  }
  const reset = () => {
    if (!sure) return setSure(true)
    setSure(false); set(s.guided ? { step: 0, gc: 0 } : { counts: { ...s.counts, [id]: 0 } })
  }
  const list = DHIKR.filter((x) => s.cat === 'All' || x[1] === s.cat)
  const goals = [...new Set([defGoal, 33, 99, 100, 500, 1000])].filter((g) => g > 1 || defGoal === 1).sort((a, b) => a - b)
  const week = Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (6 - i)); return [x.toLocaleDateString('en-IN', { weekday: 'narrow' }), s.days[x.toDateString()] || 0] })
  const max = Math.max(1, ...week.map((w) => w[1]))
  const chip = (on) => `rounded-full px-3.5 py-2 text-sm transition ${on ? 'bg-gold text-night' : 'border border-gold/40'}`

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Card>
        <div className="flex gap-2">
          {[[false, 'Free count'], [true, 'After prayer (33·33·34)']].map(([g, n]) => <button key={n} onClick={() => set({ guided: g })} aria-pressed={s.guided === g} className={`${chip(s.guided === g)} flex-1`}>{n}</button>)}
        </div>

        {s.guided ? (
          <ol className="mt-4 grid grid-cols-4 gap-2 text-center text-xs">
            {GUIDED.map((g, i) => (
              <li key={g} className={`rounded-xl border px-1 py-2 ${i === s.step ? 'border-gold bg-gold text-night' : 'border-gold/30'}`}>
                <b className="block text-sm">{i < s.step ? '✓' : i + 1}</b>{dhikrOf(g)[2]}<span className="block opacity-70">× {GUIDED_GOAL[g]}</span>
              </li>
            ))}
          </ol>
        ) : <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Dhikr groups">
            {CATS.map((c) => <button key={c} onClick={() => set({ cat: c })} role="tab" aria-selected={s.cat === c} className={`${chip(s.cat === c)} shrink-0 py-1.5 text-xs`}>{c}</button>)}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {list.map((x) => <button key={x[0]} onClick={() => set({ sel: x[0] })} aria-pressed={s.sel === x[0]} className={chip(s.sel === x[0])}>{x[2]}{(s.counts[x[0]] || 0) > 0 && <span className="ml-1.5 text-xs opacity-70">{s.counts[x[0]]}</span>}</button>)}
            {s.cat === 'All' && <button onClick={() => set({ sel: CUSTOM_ID })} aria-pressed={s.sel === CUSTOM_ID} className={chip(s.sel === CUSTOM_ID)}>＋ Custom</button>}
          </div>
        </>}

        <div className="mt-5 text-center">
          {id === CUSTOM_ID && !s.guided ? (
            <div className="space-y-2">
              <input value={s.custom.name} onChange={(e) => set({ custom: { ...s.custom, name: e.target.value } })} placeholder="Name, e.g. Ya Rahman" aria-label="Dhikr name" className="w-full rounded-full border border-gold/40 bg-night px-4 py-2 text-center text-ivory placeholder:text-mist" />
              <input dir="rtl" lang="ar" value={s.custom.ar} onChange={(e) => set({ custom: { ...s.custom, ar: e.target.value } })} placeholder="Arabic text (optional)" aria-label="Arabic text" className="w-full rounded-full border border-gold/40 bg-night px-4 py-2 text-center font-arabic text-xl text-ivory placeholder:text-mist" />
            </div>
          ) : <>
            <p dir="rtl" lang="ar" className={`font-arabic leading-[2] text-gold ${ar.length > 40 ? 'text-2xl' : 'text-4xl sm:text-5xl'}`}>{ar}</p>
            <p className="mt-1 font-medium">{name}</p>
            {meaning && <p className="text-sm text-ivory/80">{meaning}</p>}
          </>}
          <p className="mx-auto mt-2 max-w-sm text-xs text-mist">{virtue}</p>
        </div>

        <div className="relative mx-auto mt-5 size-60 sm:size-64">
          <svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
            <circle cx="100" cy="100" r="92" fill="none" className="stroke-night" strokeWidth="7" />
            <circle cx="100" cy="100" r="92" fill="none" className="stroke-gold transition-all duration-200" strokeWidth="7" strokeLinecap="round" strokeDasharray="578" strokeDashoffset={578 * (1 - pct)} />
          </svg>
          <button onClick={tap} aria-label={`Count ${name}. Current count ${count}`} className="absolute inset-3.5 flex select-none flex-col items-center justify-center rounded-full border border-gold/50 bg-night shadow-[0_0_60px_-10px_rgb(var(--gold)/.45)] transition active:scale-95 active:bg-emerald/70">
            <span className="font-arabic text-6xl tabular-nums sm:text-7xl">{count}</span>
            <span className="text-sm text-mist">{rem} / {goal}</span>
            <span className="mt-1 text-xs text-gold">{rounds > 0 ? `${rounds} round${rounds > 1 ? 's' : ''} done · ` : ''}Tap to count</span>
          </button>
        </div>

        {!s.guided && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-mist">Goal</span>
            {goals.map((g) => <button key={g} onClick={() => set({ goals: { ...s.goals, [id]: g } })} className={`${chip(goal === g)} py-1.5 text-xs`}>{g}</button>)}
            <input type="number" inputMode="numeric" min="1" max="100000" value={goals.includes(goal) ? '' : goal} onChange={(e) => { const v = Math.floor(+e.target.value); if (v > 0) set({ goals: { ...s.goals, [id]: v } }) }} placeholder="Other" aria-label="Custom goal" className="w-20 rounded-full border border-gold/40 bg-night px-3 py-1.5 text-center text-xs text-ivory placeholder:text-mist" />
          </div>
        )}

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[[Undo2, 'Undo', undo, false], [RotateCcw, sure ? 'Sure?' : 'Reset', reset, sure], [Vibrate, s.vib ? 'Vibrate on' : 'Vibrate off', () => set({ vib: !s.vib }), s.vib], [s.snd ? Volume2 : VolumeX, s.snd ? 'Click on' : 'Click off', () => set({ snd: !s.snd }), s.snd]].map(([Icon, n, fn, on]) => (
            <button key={n} onClick={fn} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl border text-[11px] transition active:scale-95 ${on ? 'border-gold bg-gold/15 text-gold' : 'border-gold/30'}`}><Icon className="size-5" />{n}</button>
          ))}
        </div>
      </Card>

      <Card title="Your dhikr">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div><p className="text-sm text-mist">Today</p><p className="text-2xl font-semibold tabular-nums text-gold">{(s.days[day] || 0).toLocaleString('en-IN')}</p></div>
          <div><p className="text-sm text-mist">All time</p><p className="text-2xl font-semibold tabular-nums text-gold">{s.total.toLocaleString('en-IN')}</p></div>
        </div>
        <div className="mt-4 flex h-16 items-end justify-between gap-1.5" aria-label="Last 7 days">
          {week.map(([l, n], i) => <div key={i} className="flex flex-1 flex-col items-center gap-1"><div title={`${n}`} className={`w-full rounded-t ${i === 6 ? 'bg-gold' : 'bg-gold/40'}`} style={{ height: `${Math.max(4, (n / max) * 44)}px` }} /><span className="text-[10px] text-mist">{l}</span></div>)}
        </div>
      </Card>
    </div>
  )
}

function Qibla({ loc }) {
  const q = useFetch(`https://api.aladhan.com/v1/qibla/${loc.lat}/${loc.lng}`)
  const [live, setLive] = useState(false)
  const [head, setHead] = useState(0)
  useEffect(() => {
    if (!live) return
    const h = (e) => { const v = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null); if (v != null) setHead(v) }
    window.addEventListener('deviceorientationabsolute', h, true); window.addEventListener('deviceorientation', h, true)
    return () => { window.removeEventListener('deviceorientationabsolute', h, true); window.removeEventListener('deviceorientation', h, true) }
  }, [live])
  const enable = async () => {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission && (await DeviceOrientationEvent.requestPermission()) !== 'granted') return } catch { return }
    setLive(true)
  }
  return (
    <Card className="mx-auto max-w-md text-center">
      {q.data ? <>
        <div className="relative mx-auto h-56 w-56 rounded-full border-2 border-gold/60 bg-night/40 shadow-[0_0_60px_-12px_rgb(var(--gold)/.5)] transition-transform duration-200 sm:h-64 sm:w-64" style={{ transform: `rotate(${-head}deg)` }}>
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-sm text-mist">N</span>
          <div className="absolute inset-0" style={{ transform: `rotate(${q.data.direction}deg)` }}><div className="mx-auto mt-6 h-[42%] w-1.5 rounded bg-gold" /></div>
          <span className="absolute inset-0 flex items-center justify-center text-3xl" style={{ transform: `rotate(${head}deg)` }}>🕋</span>
        </div>
        <p className="mt-4 text-2xl font-semibold">{q.data.direction.toFixed(1)}° from North</p>
        <p className="mt-1 text-sm text-mist">{live ? 'Live compass on: point the top of your phone where the gold needle points up.' : 'Use a phone for the live compass.'}</p>
        {!live && <Btn className="mt-3" onClick={enable}>Enable live compass</Btn>}
      </> : <Msg s={q} />}
    </Card>
  )
}

function Zakat() {
  const [sav, setSav] = useState(''), [gold, setGold] = useLocal('gold', '')
  const nisab = (+gold || 0) * 87.48, due = nisab > 0 && +sav >= nisab ? +sav * 0.025 : 0
  const inp = 'mt-1 w-full rounded-xl border border-gold/40 bg-night px-4 py-3 text-lg text-ivory'
  const fmt = (n) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  return (
    <Card className="mx-auto max-w-md space-y-4">
      <label className="block">Total savings (₹)<input type="number" inputMode="decimal" min="0" value={sav} onChange={(e) => setSav(e.target.value)} className={inp} /></label>
      <label className="block">Gold price per gram (₹)<input type="number" inputMode="decimal" min="0" value={gold} onChange={(e) => setGold(e.target.value)} className={inp} /></label>
      <p className="text-mist">Nisab (87.48 g gold): <span className="text-ivory">{fmt(nisab)}</span></p>
      {nisab > 0 && sav !== '' && (due > 0 ? <p className="text-2xl font-semibold text-gold">Zakat due (2.5%): {fmt(due)}</p> : <p className="text-mist">Below nisab: zakat is not due.</p>)}
    </Card>
  )
}

const PRE_BEFORE = [60, 30, 15, 10, 5], PRE_AFTER = [5, 10, 15, 30, 60]
function Alerts({ al, setAl, test, custom, setCustom, onClose }) {
  const supported = !isNative && typeof Notification !== 'undefined'
  const playing = usePlaying()
  const [pv, setPv] = useState(null)
  const [cm, setCm] = useState('')
  const [dir, setDir] = useState(-1)
  const offs = offsetsOf(al), cur = al.tone === 'custom' && custom ? 'custom' : 'adhan'
  const chip = (on) => `rounded-full px-4 py-2 text-sm ${on ? 'bg-gold text-night' : 'border border-gold/40'}`
  const all = [...new Set([...PRE_BEFORE.map((m) => -m), 0, ...PRE_AFTER, ...offs])].sort((a, b) => a - b)
  const group = (title, list) => list.length > 0 && (
    <div className="mt-3"><p className="text-xs uppercase tracking-wide text-mist">{title}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">{list.map((o) => <button key={o} onClick={() => tog(o)} aria-pressed={offs.includes(o)} className={chip(offs.includes(o))}>{offs.includes(o) && '✓ '}{o === 0 ? 'At prayer time' : `${Math.abs(o)} min`}</button>)}</div>
    </div>
  )
  const tog = (o) => {
    const nx = offs.includes(o) ? offs.filter((x) => x !== o) : [...offs, o]
    if (!nx.length) return toast('Keep at least one reminder time')
    setAl({ ...al, offsets: nx.sort((a, b) => a - b) })
  }
  const addCustom = () => {
    const m = Math.round(+cm); if (!m || m < 1 || m > 180) return toast('Enter minutes from 1 to 180')
    const o = dir * m; if (!offs.includes(o)) setAl({ ...al, offsets: [...offs, o].sort((a, b) => a - b) }); setCm('')
  }
  const upload = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return
    if (f.size > 10e6) return toast.error('File too large. Use a clip under 10 MB.')
    try { const c = await saveCustom(f); setCustom(c); setAl({ ...al, tone: 'custom' }); toast.success('Your adhan is saved') } catch { toast.error('Could not save the file.') }
  }
  const remove = async () => { await removeCustom(); setCustom(null); setPv(null); setAl({ ...al, tone: 'adhan' }); toast('Uploaded adhan removed') }
  const preview = (k) => { if (playing && pv === k) return stopAdhan(); setPv(k); playAdhan(al.vol ?? 0.6, k) }
  const master = async () => {
    if (al.on) return setAl({ ...al, on: false })
    unlockAudio()
    if (isNative) {
      if (!(await askNotif())) return toast.error('Notifications are blocked. Allow them in Android Settings > Apps > Daily Prayer > Notifications.')
      await askExact()
    } else if (supported && Notification.permission === 'default') await Notification.requestPermission()
    setAl({ ...al, on: true })
  }
  const rows = [['adhan', 'Adhan · Makkah call to prayer', 'Allahu Akbar, Allahu Akbar…'], ...(custom ? [['custom', 'My adhan', custom.name]] : [])]
  return (
    <Sheet onClose={onClose}>
      <h2 className="text-xl font-semibold text-gold">Prayer alerts</h2>
      <button onClick={master} className={`mt-4 w-full rounded-full px-4 py-3 font-medium ${al.on ? 'bg-gold text-night' : 'border border-gold/40 text-gold'}`}>{al.on ? '🔔 Alerts are ON (tap to turn off)' : '🔕 Turn alerts on'}</button>
      <p className="mt-4 text-sm text-mist">Alert for</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {FIVE.map((k) => <button key={k} onClick={() => setAl({ ...al, prayers: { ...al.prayers, [k]: !al.prayers[k] } })} aria-pressed={al.prayers[k]} className={chip(al.prayers[k])}>{k}</button>)}
      </div>

      <p className="mt-5 text-sm font-medium text-gold">Remind me</p>
      <p className="text-xs text-mist">Pick as many times as you like, before, at, or after each prayer.</p>
      {group('Before the prayer', all.filter((o) => o < 0).reverse())}
      {group('On time', all.filter((o) => o === 0))}
      {group('After the prayer', all.filter((o) => o > 0))}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input type="number" inputMode="numeric" min="1" max="180" value={cm} onChange={(e) => setCm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCustom()} placeholder="Minutes" aria-label="Custom minutes" className="w-24 rounded-full border border-gold/40 bg-night px-4 py-2 text-sm text-ivory placeholder:text-mist" />
        {[[-1, 'Before'], [1, 'After']].map(([v, n]) => <button key={v} onClick={() => setDir(v)} className={chip(dir === v)}>{n}</button>)}
        <Btn onClick={addCustom}>+ Add</Btn>
      </div>
      <p className="mt-3 rounded-xl bg-emerald/40 p-3 text-sm">You will be reminded: <span className="text-gold">{offs.map(offLabel).join(' · ')}</span></p>

      <label className="mt-4 flex items-center gap-3"><input type="checkbox" checked={al.sound} onChange={(e) => { if (e.target.checked) unlockAudio(); setAl({ ...al, sound: e.target.checked }) }} className="h-5 w-5 accent-gold" /> Play adhan sound with every reminder</label>
      <label className="mt-3 flex items-center gap-3"><input type="checkbox" checked={!!al.speak} onChange={(e) => setAl({ ...al, speak: e.target.checked })} className="h-5 w-5 accent-gold" /> Announce the prayer name aloud</label>

      <p className="mt-5 text-sm font-medium text-gold">Notification sound</p>
      <div className="mt-2 space-y-2">
        {rows.map(([k, n, sub]) => (
          <div key={k} className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${cur === k ? 'border-gold bg-emerald/60' : 'border-gold/25'}`}>
            <button onClick={() => setAl({ ...al, tone: k })} className="min-w-0 flex-1 py-1 text-left"><span className="block truncate">{cur === k ? '● ' : '○ '}{n}</span><span className="block truncate pl-5 text-xs text-mist">{sub}</span></button>
            <IconBtn className="size-10" onClick={() => preview(k)} aria-label={playing && pv === k ? 'Stop preview' : `Preview ${n}`}>{playing && pv === k ? '■' : '▶'}</IconBtn>
            {k === 'custom' && <IconBtn className="size-10 border-red-400/60 text-red-300" onClick={remove} aria-label="Remove uploaded adhan">🗑</IconBtn>}
          </div>
        ))}
      </div>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-dashed border-gold/50 px-4 py-2 text-center text-sm text-gold">
        {custom ? 'Replace with another adhan file' : 'Upload your own adhan (mp3, m4a, wav · up to 10 MB)'}
        <input type="file" accept="audio/*" onChange={upload} className="sr-only" />
      </label>
      <label className="mt-3 block text-sm text-mist">Volume<input type="range" min="0.1" max="1" step="0.1" value={al.vol ?? 0.6} onChange={(e) => { setAl({ ...al, vol: +e.target.value }); if (player) player.volume = +e.target.value }} className="mt-1 w-full accent-gold" /></label>
      <div className="mt-5 flex flex-wrap gap-2"><Btn onClick={test}>Test alert</Btn>{playing && <Btn onClick={stopAdhan}>■ Stop adhan</Btn>}<Btn onClick={onClose}>Close</Btn></div>
      {isNative && <AndroidStatus al={al} setAl={setAl} />}
      <p className={isNative ? 'hidden' : 'mt-4 text-xs text-mist'}>Alerts fire while this site is open in a browser tab (a background tab is fine). The adhan plays from the page together with the browser notification, so tap anywhere on the page once after opening it, because browsers need that before they allow sound. Browsers cannot ring when the site is fully closed.{supported && Notification.permission === 'denied' && ' Notifications are blocked for this site in your browser settings, so you will see in-page banners and hear the adhan only.'}{!supported && ' Notifications are not supported here, so you will see in-page banners and hear the adhan only.'}</p>
    </Sheet>
  )
}

function AndroidStatus({ al, setAl }) {
  const [st, setSt] = useState(null), [up, setUp] = useState([]), [n, setN] = useState(0)
  const load = () => { notifStatus().then(setSt); upcoming(4).then(setUp); pendingCount().then(setN) }
  useEffect(() => { load(); const t = setTimeout(load, 2500); return () => clearTimeout(t) }, [al.on])
  const ex = { adhkar: true, kahf: true, fasting: false, ...(al.extras || {}) }
  const row = (ok, label, hint, action, btn) => (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold/25 px-4 py-3">
      <span className="min-w-0"><b className="block text-sm">{ok ? '✅' : '⚠️'} {label}</b><span className="text-xs text-mist">{hint}</span></span>
      {!ok && <Btn onClick={() => action().then(load)}>{btn}</Btn>}
    </div>
  )
  return (
    <div className="mt-6 space-y-2">
      <p className="text-sm font-medium text-gold">Android alerts</p>
      {row(!!st?.notif, 'Notifications', 'Needed to show prayer alerts', askNotif, 'Allow')}
      {row(st ? st.exact : true, 'Exact timing', 'Alerts arrive at the exact minute', askExact, 'Allow')}
      <div className="rounded-2xl border border-gold/25 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Next alerts</p>
        {up.length ? up.map((x) => <p key={x.id} className="mt-2 flex justify-between gap-3 text-sm"><span className="truncate">{x.title}</span><span className="shrink-0 text-mist">{x.at.toLocaleString('en-IN', { weekday: 'short', hour: 'numeric', minute: '2-digit' })}</span></p>) : <p className="mt-2 text-sm text-mist">{al.on ? 'Scheduling…' : 'Turn alerts on to schedule them.'}</p>}
        <p className="mt-3 text-xs text-mist">{n} reminders are scheduled. They keep working when the app is closed or the phone restarts.</p>
      </div>
      <p className="pt-2 text-sm font-medium text-gold">Extra reminders</p>
      {[['adhkar', 'Morning and evening adhkar', 'After Fajr and after Asr'], ['kahf', 'Friday Al-Kahf reminder', "Jumu'ah morning"], ['fasting', 'Monday and Thursday fast', 'The evening before, after Isha']].map(([k, t, h]) => (
        <label key={k} className="flex items-center justify-between gap-3 rounded-2xl border border-gold/25 px-4 py-3"><span><b className="block text-sm">{t}</b><span className="text-xs text-mist">{h}</span></span><input type="checkbox" checked={ex[k]} onChange={(e) => setAl({ ...al, extras: { ...ex, [k]: e.target.checked } })} className="size-5 shrink-0 accent-gold" /></label>
      ))}
      <div className="flex flex-wrap items-center gap-2 pt-2"><Btn onClick={() => { forceNext(); window.dispatchEvent(new Event('prayer-resched')); setTimeout(load, 2500) }}>Refresh alerts</Btn><span className="text-xs text-mist">Use this if alerts look wrong.</span></div>
      <p className="text-xs text-mist">If alerts come late on Xiaomi, Oppo, Vivo, Realme or Samsung phones: Settings → Apps → Daily Prayer → Battery → Unrestricted, and allow Autostart.</p>
    </div>
  )
}

function Setup({ al, setAl, onPick, onClose }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    const ok = await askNotif()
    if (ok) setAl({ ...al, on: true })
    try { const g = await getPosition(); onPick({ name: 'My location', lat: +g.lat.toFixed(4), lng: +g.lng.toFixed(4) }) } catch { toast('Location skipped. You can set it any time with the location button.') }
    if (ok) await askExact()
    setBusy(false); onClose()
  }
  return (
    <Sheet onClose={onClose}>
      <h2 className="text-xl font-semibold text-gold">Welcome</h2>
      <p className="mt-2 text-sm text-mist">Allow two things so the app can work properly:</p>
      <ul className="mt-4 space-y-3">
        <li className="rounded-2xl border border-gold/25 p-4"><b>🔔 Notifications</b><p className="mt-1 text-sm text-mist">Prayer alerts with the adhan, before and after each prayer, even when the app is closed.</p></li>
        <li className="rounded-2xl border border-gold/25 p-4"><b>📍 Location</b><p className="mt-1 text-sm text-mist">Accurate prayer times and Qibla direction for where you are. Used only on this phone.</p></li>
      </ul>
      <div className="mt-6 flex gap-2"><Btn className="flex-1 bg-gold !text-night" onClick={go}>{busy ? 'Please wait…' : 'Allow and continue'}</Btn><Btn className="flex-1" onClick={onClose}>Not now</Btn></div>
    </Sheet>
  )
}

function Picker({ onPick, onClose }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault()
    if (q.trim().length < 2) return
    setBusy(true); setRes(await searchPlaces(q.trim())); setBusy(false)
  }
  const mine = async () => {
    try {
      if (isNative) { const g = await getPosition(); onPick({ name: 'My location', lat: +g.lat.toFixed(4), lng: +g.lng.toFixed(4) }) }
      else navigator.geolocation?.getCurrentPosition((p) => onPick({ name: 'My location', lat: +p.coords.latitude.toFixed(4), lng: +p.coords.longitude.toFixed(4) }))
    } catch { toast.error('Could not get your location. Turn Location on and allow it for this app.') }
  }
  return (
    <Sheet onClose={onClose}>
      <form onSubmit={go} className="flex gap-2">
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search any village, town or street" className="min-w-0 flex-1 rounded-full border border-gold/40 bg-emerald/30 px-4 py-2.5 text-ivory placeholder:text-mist" />
        <button className="rounded-full bg-gold px-5 py-2.5 font-medium text-night">{busy ? '…' : 'Search'}</button>
      </form>
      <div className="mt-3 flex gap-4 text-sm"><button onClick={mine} className="text-gold underline">Use my location</button><button onClick={() => onPick(DEFAULT_LOC)} className="text-gold underline">Reset to {DEFAULT_LOC.name.split(',')[0]}</button></div>
      <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {res?.length === 0 && <li className="text-mist">No places found. Try the nearest town or add the district.</li>}
        {res?.map((r, i) => (
          <li key={i}><button onClick={() => onPick({ name: r.name, lat: r.lat, lng: r.lng })} className="w-full rounded-xl px-3 py-2.5 text-left active:bg-gold/10"><b className="block text-sm">{r.name}</b><span className="text-xs text-mist">{r.sub}</span></button></li>
        ))}
      </ul>
      <button onClick={onClose} className="mt-4 text-sm text-mist">Close</button>
    </Sheet>
  )
}

function Settings({ theme, setTheme, calc, setCalc, P, setPrefs, onClose }) {
  const M = [[3, 'Muslim World League'], [1, 'Karachi'], [4, 'Umm al-Qura (Makkah)'], [2, 'ISNA (North America)'], [5, 'Egyptian Authority'], [7, 'Tehran'], [8, 'Gulf Region'], [9, 'Kuwait'], [10, 'Qatar'], [11, 'Singapore'], [12, 'France (UOIF)'], [13, 'Turkey (Diyanet)'], [15, 'Moonsighting Committee']]
  const chip = (on) => `rounded-full px-4 py-2 text-sm transition ${on ? 'bg-gold text-night' : 'border border-gold/40'}`
  const up = (patch) => setPrefs({ ...P, ...patch })
  const [sc, setSc] = useState(P.scale)
  const head = 'mt-7 text-lg font-semibold text-gold'
  const Switch = ({ on, set, label, hint }) => (
    <button role="switch" aria-checked={on} onClick={() => set(!on)} className="mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-gold/25 px-4 py-3 text-left">
      <span><span className="block text-sm">{label}</span>{hint && <span className="block text-xs text-mist">{hint}</span>}</span>
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-gold' : 'bg-night ring-1 ring-gold/40'}`}><span className={`absolute top-0.5 size-5 rounded-full transition-all ${on ? 'left-[22px] bg-night' : 'left-0.5 bg-gold'}`} /></span>
    </button>
  )
  const exportData = () => {
    const o = {}; BACKUP_KEYS.forEach((k) => { const v = localStorage.getItem(k); if (v != null) o[k] = v })
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o)], { type: 'application/json' })); a.download = `daily-prayer-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click(); toast.success('Backup downloaded')
  }
  const importData = (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return
    f.text().then((t) => { const o = JSON.parse(t); Object.keys(o).filter((k) => BACKUP_KEYS.includes(k)).forEach((k) => localStorage.setItem(k, o[k])); toast.success('Restored. Reloading…'); setTimeout(() => location.reload(), 600) }).catch(() => toast.error('That file is not a valid backup'))
  }
  return (
    <Sheet onClose={onClose}>
      <h2 className="text-xl font-semibold text-gold">Customize</h2>
      <p className="text-sm text-mist">Everything saves automatically on this device.</p>

      <h3 className={head}>Personal</h3>
      <label className="mt-2 block text-sm text-mist">Your name (shown in the greeting)<input value={P.name} maxLength={30} onChange={(e) => up({ name: e.target.value })} placeholder="Leave empty to hide" className="mt-1 w-full rounded-full border border-gold/40 bg-night px-4 py-2.5 text-ivory placeholder:text-mist" /></label>

      <h3 className={head}>Theme</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {THEMES.map(([k, n, bg, ac]) => (
          <button key={k} onClick={() => setTheme(k)} aria-pressed={theme === k} className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center text-xs leading-tight ${theme === k ? 'border-gold bg-emerald/60' : 'border-gold/25'}`}>
            <span className="grid size-11 place-items-center rounded-full border border-white/25" style={{ background: `linear-gradient(135deg, ${bg} 50%, ${ac} 50%)` }}>{theme === k && <Check className="size-5 text-white drop-shadow" />}</span>
            <span className="line-clamp-2 min-h-8">{n}</span>
          </button>
        ))}
      </div>

      <h3 className={head}>Accent colour</h3>
      <p className="text-xs text-mist">Overrides the gold of any theme.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button onClick={() => up({ accent: '' })} aria-pressed={!P.accent} className={`${chip(!P.accent)} py-1.5 text-xs`}>Theme default</button>
        {SWATCHES.map((c) => <button key={c} onClick={() => up({ accent: c })} aria-label={`Accent ${c}`} aria-pressed={P.accent === c} className={`grid size-9 place-items-center rounded-full border-2 ${P.accent === c ? 'border-ivory' : 'border-transparent'}`} style={{ background: c }}>{P.accent === c && <Check className="size-4 text-black/70" />}</button>)}
        <label className="relative grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full border border-dashed border-gold/60 text-xs text-gold">＋<input type="color" aria-label="Pick any colour" value={P.accent || '#C9A24B'} onChange={(e) => up({ accent: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" /></label>
      </div>

      <h3 className={head}>Display</h3>
      <p className="mt-2 text-sm text-mist">Text size · {Math.round(sc * 100)}%</p>
      <div className="mt-2 flex flex-wrap gap-2">{[[0.9, 'Small'], [1, 'Default'], [1.15, 'Large'], [1.3, 'Extra large']].map(([v, n]) => <button key={v} onClick={() => { setSc(v); up({ scale: v }) }} aria-pressed={P.scale === v} className={chip(P.scale === v)}>{n}</button>)}</div>
      <input type="range" min="0.85" max="1.4" step="0.05" value={sc} onChange={(e) => setSc(+e.target.value)} onPointerUp={(e) => up({ scale: +e.currentTarget.value })} onTouchEnd={(e) => up({ scale: +e.currentTarget.value })} onKeyUp={(e) => up({ scale: +e.currentTarget.value })} aria-label="Text size" className="mt-3 w-full accent-gold" />
      <p className="mt-1 text-xs text-mist">Drag, then release to apply.</p>
      <p className="mt-3 text-sm text-mist">Corners</p>
      <div className="mt-2 flex flex-wrap gap-2">{[['sharp', 'Sharp'], ['soft', 'Soft'], ['round', 'Round']].map(([k, n]) => <button key={k} onClick={() => up({ radius: k })} aria-pressed={P.radius === k} className={chip(P.radius === k)}>{n}</button>)}</div>
      <Switch on={P.glass} set={(v) => up({ glass: v })} label="Glass effect" hint="Frosted, blurred cards" />
      <Switch on={P.pattern} set={(v) => up({ pattern: v })} label="Islamic pattern background" />
      <Switch on={P.motion} set={(v) => up({ motion: v })} label="Animations" hint="Turn off for a calmer, faster app" />
      <Switch on={P.h24} set={(v) => up({ h24: v })} label="24-hour clock" hint="Show 17:45 instead of 5:45 PM" />

      <h3 className={head}>Sections</h3>
      <p className="text-xs text-mist">Show only what you use.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {TABS.filter(([k]) => k !== 'home').map(([k, n]) => { const on = !P.hidden.includes(k); return <button key={k} onClick={() => up({ hidden: on ? [...P.hidden, k] : P.hidden.filter((x) => x !== k) })} aria-pressed={on} className={chip(on)}>{on ? '✓ ' : ''}{n}</button> })}
      </div>

      <h3 className={head}>Prayer calculation</h3>
      <div className="mt-3 flex flex-wrap gap-2">{M.map(([id, n]) => <button key={id} onClick={() => setCalc({ ...calc, method: id })} className={chip(calc.method === id)}>{n}</button>)}</div>
      <p className="mt-4 text-sm text-mist">Asr calculation</p>
      <div className="mt-2 flex flex-wrap gap-2">{[[0, "Shafi'i / Standard"], [1, 'Hanafi']].map(([id, n]) => <button key={id} onClick={() => setCalc({ ...calc, school: id })} className={chip(calc.school === id)}>{n}</button>)}</div>

      <h3 className={head}>Backup</h3>
      <p className="text-xs text-mist">Move your trackers, tasbih and settings to another device.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Btn onClick={exportData}><Download className="size-4" />Export</Btn>
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-gold/40 px-4 py-2 text-sm text-gold"><Upload className="size-4" />Import<input type="file" accept="application/json" onChange={importData} className="sr-only" /></label>
      </div>
      <div className="mt-6 flex gap-2"><Btn className="flex-1" onClick={() => { setPrefs(PREF0); setSc(1); setTheme('emerald') }}>Reset look</Btn><Btn className="flex-1 bg-gold !text-night" onClick={onClose}>Done</Btn></div>
    </Sheet>
  )
}

function Events({ hijri, now }) {
  const [list, setList] = useState(null)
  const hy = hijri ? +hijri.year : null
  useEffect(() => {
    if (!hy) return
    const g = (d, m, y) => fetch(`https://api.aladhan.com/v1/hToG/${pad(d)}-${pad(m)}-${y}`).then((r) => r.json()).then((j) => { const [dd, mm, yy] = j.data.gregorian.date.split('-').map(Number); return new Date(yy, mm - 1, dd) })
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    Promise.all(EVENTS.map(async ([n, d, m]) => { let dt = await g(d, m, hy); if (dt < today) dt = await g(d, m, hy + 1); return { n, dt, days: Math.round((dt - today) / 864e5) } }))
      .then((r) => setList(r.sort((a, b) => a.days - b.days))).catch(() => setList(false))
  }, [hy])
  return (
    <div>
      <p className="mb-4 text-sm text-mist">Dates follow the Umm al-Qura calendar and may differ by a day from your local moon sighting.</p>
      {list === false ? <p className="text-mist">Could not load events.</p> : !list ? <p className="text-mist">Loading…</p> : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((e, i) => (
            <li key={e.n} className={`rounded-2xl border p-4 ${i === 0 ? 'border-gold bg-emerald/60' : 'border-gold/25 bg-night/70'}`}>
              <p className="font-semibold text-gold">{e.n}</p>
              <p className="text-sm text-mist">{e.dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="mt-1 text-2xl font-semibold">{e.days === 0 ? 'Today' : `${e.days} days`}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function CalGrid({ data, now, ym }) {
  const first = new Date(ym.y, ym.m - 1, 1).getDay()
  const isNow = (d) => +d === now.getDate() && ym.m === now.getMonth() + 1 && ym.y === now.getFullYear()
  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-gold/25 bg-night/50 p-3 sm:p-5">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wider text-gold/80 sm:gap-2">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>
      <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
        {Array.from({ length: first }).map((_, i) => <div key={'b' + i} />)}
        {data.map((r) => {
          const h = r.date.hijri, ev = h.holidays?.length > 0, t = isNow(r.date.gregorian.day)
          return (
            <div key={r.date.gregorian.date} title={h.holidays?.join(', ')} className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-xs sm:rounded-xl sm:text-base lg:aspect-[5/4] ${t ? 'border-gold bg-gold text-night' : ev ? 'border-gold bg-emerald/60' : 'border-gold/20 bg-night/60'}`}>
              <span className="font-semibold">{+r.date.gregorian.day}</span>
              <span className="font-arabic text-[10px] leading-none opacity-80 sm:text-sm">{h.day}<span className="hidden sm:inline">{+h.day === 1 ? ` ${h.month.en.slice(0, 3)}` : ''}</span></span>
            </div>
          )
        })}
      </div>
      <ul className="mt-4 space-y-1 text-sm text-mist">{data.filter((r) => r.date.hijri.holidays?.length).map((r) => <li key={r.date.gregorian.date}><span className="text-gold">{+r.date.gregorian.day}</span> · {r.date.hijri.holidays.join(', ')}</li>)}</ul>
    </div>
  )
}

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
const kmBetween = (a1, b1, c1, d1) => { const p = Math.PI / 180, h = Math.sin(((c1 - a1) * p) / 2) ** 2 + Math.cos(a1 * p) * Math.cos(c1 * p) * Math.sin(((d1 - b1) * p) / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)) }
// Tries several free servers at once and uses the first that answers
async function overpass(q) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 20000)
  try {
    return await Promise.any(OVERPASS.map((u) => fetch(`${u}?data=${encodeURIComponent(q)}`, { signal: ctl.signal }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json() })))
  } finally { clearTimeout(t); ctl.abort() }
}
const bearing = (a1, b1, c1, d1) => {
  const p = Math.PI / 180, y = Math.sin((d1 - b1) * p) * Math.cos(c1 * p), x = Math.cos(a1 * p) * Math.sin(c1 * p) - Math.sin(a1 * p) * Math.cos(c1 * p) * Math.cos((d1 - b1) * p)
  return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(((Math.atan2(y, x) / p + 360) % 360) / 45) % 8]
}
const fmtKm = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`)
const eta = (d) => (d < 2 ? `${Math.max(1, Math.round(d * 12))} min walk` : `${Math.max(2, Math.round(d * 2))} min drive`)
function MosquesList({ loc }) {
  const [r, setR] = useState(null)
  const [radius, setRadius] = useState(0)
  const [tick, setTick] = useState(0)
  const [rad, setRad] = useState(0)
  const [q, setQ] = useState('')
  useEffect(() => {
    let live = true; setR(null); setRad(0)
    ;(async () => {
      try {
        for (const m of [4000, 10000, 25000]) {
          const a = `(around:${m},${loc.lat},${loc.lng})`
          const qy = `[out:json][timeout:20];(node["amenity"="place_of_worship"]["religion"="muslim"]${a};way["amenity"="place_of_worship"]["religion"="muslim"]${a};node["building"="mosque"]${a};way["building"="mosque"]${a};);out center 80;`
          const j = await overpass(qy)
          const seen = new Set()
          const l = j.elements.map((e) => {
            const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon, t = e.tags || {}
            return { id: e.type + e.id, name: t.name || t['name:en'] || 'Mosque', ar: t['name:ar'], addr: [t['addr:street'], t['addr:suburb'] || t['addr:city']].filter(Boolean).join(', '), la, lo, d: kmBetween(loc.lat, loc.lng, la, lo), dir: bearing(loc.lat, loc.lng, la, lo) }
          }).filter((e) => e.la && !seen.has(e.id) && seen.add(e.id)).sort((x, y) => x.d - y.d)
          if (l.length || m === 25000) { if (live) { setRadius(m / 1000); setR(l) } return }
        }
      } catch { if (live) setR(false) }
    })()
    return () => { live = false }
  }, [loc.lat, loc.lng, tick])
  const gmaps = `https://www.google.com/maps/search/mosque/@${loc.lat},${loc.lng},14z`
  const Fallback = ({ text }) => (
    <Card className="mx-auto max-w-md text-center">
      <p className="text-mist">{text}</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Btn className="min-h-12" onClick={() => setTick((x) => x + 1)}>Try again</Btn>
        <a href={gmaps} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-medium text-night active:opacity-80"><MapPin className="size-4" />Open mosques in Google Maps</a>
      </div>
    </Card>
  )
  if (r === null) return (
    <div role="status" aria-label="Finding mosques" className="space-y-3">
      <p className="text-sm text-mist">Finding mosques near {loc.name}…</p>
      {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-36 w-full !rounded-2xl" />)}
    </div>
  )
  if (r === false) return <Fallback text="Could not load mosques. Your network may be blocking the map service." />
  if (r.length === 0) return <Fallback text={`No mosques found within 25 km of ${loc.name} on the map.`} />
  const chips = [[0, 'All'], ...[1, 3, 5, 10].filter((k) => k < radius && r.some((m) => m.d > k)).map((k) => [k, `${k} km`])]
  const shown = r.filter((m) => (!rad || m.d <= rad) && (!q.trim() || `${m.name} ${m.ar || ''} ${m.addr}`.toLowerCase().includes(q.trim().toLowerCase())))
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-sm text-mist"><b className="text-gold">{shown.length}</b> {shown.length === 1 ? 'mosque' : 'mosques'} near <span className="text-ivory">{loc.name}</span></p>
          <button onClick={() => setTick((x) => x + 1)} className="shrink-0 rounded-full border border-gold/40 px-4 py-2 text-xs text-gold active:bg-gold active:text-night">Refresh</button>
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search by name or street" aria-label="Search mosques" className="w-full rounded-full border border-gold/40 bg-night/60 px-5 py-3 text-ivory placeholder:text-mist" />
        {chips.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {chips.map(([k, n]) => <button key={k} onClick={() => setRad(k)} aria-pressed={rad === k} className={`shrink-0 rounded-full px-5 py-2.5 text-sm ${rad === k ? 'bg-gold font-medium text-night' : 'border border-gold/40 text-ivory'}`}>{n === 'All' ? 'All' : `Within ${n}`}</button>)}
          </div>
        )}
        <a href={gmaps} target="_blank" rel="noreferrer" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-gold/40 text-sm text-gold active:bg-gold/10 sm:inline-flex sm:w-auto sm:px-6"><MapPin className="size-4" />See all on Google Maps</a>
      </div>
      {shown.length === 0 ? <p className="py-10 text-center text-mist">No mosque matches your search.</p> : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-2xl border border-gold/25 bg-night/70">
              <div className="flex items-start gap-3 p-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold"><MapPin className="size-6" /></div>
                <div className="min-w-0 flex-1">
                  <b className="block break-words text-base leading-snug">{m.name}</b>
                  {m.ar && <span className="font-arabic text-lg text-gold">{m.ar}</span>}
                  {m.addr && <p className="mt-0.5 truncate text-xs text-mist">{m.addr}</p>}
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm"><span className="font-semibold text-gold">{fmtKm(m.d)}</span><span className="text-mist">{m.dir} · about {eta(m.d)}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t border-gold/20 text-sm">
                <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${m.la},${m.lo}`} className="flex min-h-12 items-center justify-center bg-gold font-medium text-night active:opacity-80">Directions</a>
                <a target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${m.la},${m.lo}`} className="flex min-h-12 items-center justify-center text-gold active:bg-gold/10">View on map</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Mosques({ loc: home }) {
  const [custom, setCustom] = useState(null)
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null)
  const [busy, setBusy] = useState(false)
  const loc = custom || home
  const go = async (e) => {
    e.preventDefault()
    if (q.trim().length < 2) return
    setBusy(true); setRes(await searchPlaces(q.trim())); setBusy(false)
  }
  return (
    <div className="mx-auto max-w-5xl">
      <form onSubmit={go} className="mb-3 flex gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Find mosques in any place, e.g. Chennai, Mecca" aria-label="Search a place" className="min-w-0 flex-1 rounded-full border border-gold/40 bg-night/60 px-5 py-3 text-ivory placeholder:text-mist" />
        <button className="shrink-0 rounded-full bg-gold px-5 py-3 font-medium text-night active:opacity-80">{busy ? '…' : 'Search'}</button>
      </form>
      {res && (
        <ul className="mb-4 max-h-72 overflow-y-auto rounded-2xl border border-gold/25 bg-night/70">
          {res.length === 0 ? <li className="px-4 py-3 text-sm text-mist">No place found. Try the nearest town or add the district.</li> : res.map((r, i) => (
            <li key={i}><button onClick={() => { setCustom({ name: r.name, lat: r.lat, lng: r.lng }); setRes(null); setQ('') }} className="flex min-h-12 w-full flex-col items-start justify-center border-b border-gold/10 px-4 py-2 text-left last:border-0 active:bg-gold/10"><b className="text-sm">{r.name}</b><span className="text-xs text-mist">{r.sub}</span></button></li>
          ))}
        </ul>
      )}
      {custom && (
        <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-gold">📍 {custom.name}</span>
          <button onClick={() => setCustom(null)} className="text-gold underline">Back to {home.name.split(',')[0]}</button>
        </div>
      )}
      <MosquesList key={`${loc.lat},${loc.lng}`} loc={loc} />
    </div>
  )
}

function Ibadah() {
  const [k, setK] = useLocal('khatm', { days: 30, read: 0, start: new Date().toDateString() })
  const [q, setQ] = useLocal('qada', { Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 })
  const perDay = Math.ceil(604 / k.days)
  const elapsed = Math.max(0, Math.floor((new Date() - new Date(k.start)) / 864e5))
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card title="Quran Khatm planner">
        <label className="block text-sm text-mist">Finish in (days)<input type="number" min="1" max="365" value={k.days} onChange={(e) => setK({ ...k, days: Math.max(1, +e.target.value || 1) })} className="mt-1 w-full rounded-xl border border-gold/40 bg-night px-4 py-2 text-ivory" /></label>
        <p className="mt-3 text-lg">Read <b className="text-gold">{perDay} pages</b> a day (the Quran has 604 pages)</p>
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-night"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(k.read / 604) * 100}%` }} /></div>
        <p className="mt-2 text-sm text-mist">{k.read} pages read · {604 - k.read} left · day {elapsed + 1} of {k.days}{k.read >= perDay * (elapsed + 1) ? ' · on track ✓' : ' · a little behind'}</p>
        <div className="mt-3 flex flex-wrap gap-2"><Btn onClick={() => setK({ ...k, read: Math.min(604, k.read + 1) })}>+1 page</Btn><Btn onClick={() => setK({ ...k, read: Math.min(604, k.read + perDay) })}>+ today's portion</Btn><Btn onClick={() => setK({ ...k, read: 0, start: new Date().toDateString() })}>Restart</Btn></div>
      </Card>
      <Card title="Qada (missed prayers) tracker">
        <ul className="space-y-2">{Object.keys(q).map((n) => (
          <li key={n} className="flex items-center justify-between"><span>{n}</span>
            <span className="flex items-center gap-3"><Btn onClick={() => setQ({ ...q, [n]: Math.max(0, q[n] - 1) })} aria-label={`Made up ${n}`}>−</Btn><b className="w-10 text-center tabular-nums">{q[n]}</b><Btn onClick={() => setQ({ ...q, [n]: q[n] + 1 })} aria-label={`Missed ${n}`}>+</Btn></span></li>
        ))}</ul>
        <p className="mt-3 text-sm text-mist">Tap + when you miss a prayer and − when you make it up. Total to make up: {Object.values(q).reduce((a, b) => a + b, 0)}</p>
      </Card>
    </div>
  )
}
