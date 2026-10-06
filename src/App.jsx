import { useEffect, useState, useRef, useMemo } from 'react'
import { isNative, nativeInit, onResume, onAction, snooze, cancelAll, scheduleAll, notifStatus, sendTest } from './native'
import EDITION from './edition.json'
import { motion } from 'motion/react'
import { toast, Toaster } from 'sonner'
import { Moon, MapPin, Bell, BellOff, Palette, Ellipsis } from 'lucide-react'
import { useLocal } from './lib/storage'
import { DEFAULT_LOC, FIVE, ICONS, PREF0, PRIMARY, TABS } from './lib/constants'
import { runtime } from './lib/runtime'
import { rgbOf } from './lib/color'
import { hm, pad, to12 } from './lib/time'
import { useFetch } from './lib/useFetch'
import { loadAdhan, loadCustom, unlockAudio } from './lib/adhan'
import { alertText, dueList, fire, firedIds, markFired, offsetsOf } from './lib/alerts'
import { IconBtn } from './components/Buttons'
import { PageHead } from './components/PageHead'
import { Home } from './pages/Home'
import { Month } from './pages/Month'
import { Quran } from './pages/Quran'
import { Duas } from './pages/Duas'
import { Names } from './pages/Names'
import { Tasbih } from './pages/Tasbih'
import { Qibla } from './pages/Qibla'
import { Zakat } from './pages/Zakat'
import { Events } from './pages/Events'
import { Mosques } from './pages/Mosques'
import { Ibadah } from './pages/Ibadah'
import { Sheet } from './components/Sheet'
import { Settings } from './panels/SettingsPanel'
import { Picker } from './panels/Picker'
import { Setup } from './panels/Setup'
import { Alerts } from './panels/Alerts'

export default function App() {
  const [loc, setLoc] = useLocal('loc', DEFAULT_LOC)
  const [al, setAl] = useLocal('alerts', { on: false, offsets: [-5, 0], sound: true, tone: 'adhan', vol: 0.6, prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true } })
  const [done, setDone] = useLocal('done', {})
  const [theme, setTheme] = useLocal('theme', EDITION.theme || 'emerald')
  const [calc, setCalc] = useLocal('calc', { method: EDITION.method ?? 3, school: EDITION.school ?? 0 })
  const [prefs, setPrefs] = useLocal('prefs', PREF0)
  const P = { ...PREF0, ...prefs }
  runtime.use24 = P.h24; runtime.userName = P.name
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
      loc, calc, al, prayers: FIVE, offsets: offsetsOf(al), who: runtime.userName,
      describe: ({ k, off, time, next, jumuah }) => {
        const jm = jumuah && k === 'Dhuhr', head = jm ? "Jumu'ah" : k
        const title = off === 0 ? `${head} · ${to12(time)}` : off < 0 ? `${head} in ${-off} minutes` : `${head} · ${off} minutes ago`
        const body = jm && off === 0 ? "Jumu'ah Mubarak. It is time for the Jumu'ah prayer." : alertText({ k, off, time })
        return { title, body, large: `${body}${next ? `\nNext: ${next.k} at ${to12(next.time)}` : ''}\n${runtime.userName || 'Daily Prayer'}` }
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
