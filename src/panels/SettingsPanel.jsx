import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Download, Upload } from 'lucide-react'
import { BACKUP_KEYS, PREF0, SWATCHES, TABS, THEMES } from '../lib/constants'
import { Sheet } from '../components/Sheet'
import { Btn } from '../components/Buttons'

export function Settings({ theme, setTheme, calc, setCalc, P, setPrefs, onClose }) {
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
