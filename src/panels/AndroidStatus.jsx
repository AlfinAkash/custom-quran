import { useState, useEffect } from 'react'
import { notifStatus, upcoming, pendingCount, askNotif, askExact, forceNext } from '../native'
import { Btn } from '../components/Buttons'

export function AndroidStatus({ al, setAl }) {
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
