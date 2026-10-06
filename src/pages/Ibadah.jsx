import { useLocal } from '../lib/storage'
import { Card } from '../components/Card'
import { Btn } from '../components/Buttons'

export function Ibadah() {
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
