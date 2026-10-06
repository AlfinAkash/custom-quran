import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { Btn, IconBtn } from '../components/Buttons'
import { AR, PRAYERS } from '../lib/constants'
import { to12 } from '../lib/time'
import { Msg } from '../components/Msg'

export function Month({ loc, now, calc }) {
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
