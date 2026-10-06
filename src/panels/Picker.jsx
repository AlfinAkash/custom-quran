import { useState } from 'react'
import { isNative, getPosition } from '../native'
import { searchPlaces } from '../geocode'
import { toast } from 'sonner'
import { Sheet } from '../components/Sheet'
import { DEFAULT_LOC } from '../lib/constants'

export function Picker({ onPick, onClose }) {
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
