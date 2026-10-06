import { useState, useEffect } from 'react'
import { searchPlaces } from '../geocode'
import { MapPin } from 'lucide-react'
import { Card } from '../components/Card'
import { Btn } from '../components/Buttons'

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

export function Mosques({ loc: home }) {
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
