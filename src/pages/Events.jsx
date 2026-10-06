import { useState, useEffect } from 'react'
import { pad } from '../lib/time'
import { EVENTS } from '../lib/constants'

export function Events({ hijri, now }) {
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
