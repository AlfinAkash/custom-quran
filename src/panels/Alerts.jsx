import { useState } from 'react'
import { isNative, askNotif, askExact } from '../native'
import { toast } from 'sonner'
import { playAdhan, player, removeCustom, saveCustom, stopAdhan, unlockAudio, usePlaying } from '../lib/adhan'
import { offLabel, offsetsOf } from '../lib/alerts'
import { Sheet } from '../components/Sheet'
import { FIVE } from '../lib/constants'
import { Btn, IconBtn } from '../components/Buttons'
import { AndroidStatus } from './AndroidStatus'

const PRE_BEFORE = [60, 30, 15, 10, 5], PRE_AFTER = [5, 10, 15, 30, 60]

export function Alerts({ al, setAl, test, custom, setCustom, onClose }) {
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
