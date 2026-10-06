import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Undo2, RotateCcw, Vibrate, Volume2, VolumeX } from 'lucide-react'
import { useLocal } from '../lib/storage'
import { CATS, CUSTOM_ID, DHIKR, GUIDED, GUIDED_GOAL, TS0, dhikrOf } from '../content/dhikr'
import { clickSound } from '../lib/clickSound'
import { Card } from '../components/Card'

export function Tasbih() {
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
