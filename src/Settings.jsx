import { useState } from 'react'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, Check, Download, Eye, EyeOff, RotateCcw, Trash2, Upload } from 'lucide-react'
import { Btn, Chip, Group, Segmented, Slider, Stepper, Toggle, Sheet } from './ui.jsx'
import { ACCENTS, APP_VERSION, ARABIC_FONTS, FONTS, HOME_CARDS, METHODS, PREFS0, TABS, THEMES, TUNE_KEYS, exportBackup, importBackup, resetAll } from './data.js'

function Preview() {
  return (
    <div className="surface rounded-card p-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs text-mist">Next prayer</p><p className="text-lg font-semibold text-gold">Asr</p></div>
        <p className="font-arabic text-2xl">العصر</p>
        <span className="gold-fill rounded-full px-3 py-1 text-sm font-semibold tabular-nums">3:42 PM</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-night"><div className="h-full w-2/3 rounded-full bg-gold" /></div>
      <div className="mt-3 flex gap-2"><span className="btn min-h-9 px-3 text-xs">Button</span><span className="chip min-h-9 px-3 text-xs" data-on="true">Selected</span></div>
    </div>
  )
}

function Look({ theme, setTheme, prefs, set }) {
  const custom = theme === 'custom'
  return (
    <>
      <Preview />
      <Group title="Theme">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {THEMES.map(([k, n, bg, ac]) => (
            <button type="button" key={k} onClick={() => setTheme(k)} aria-pressed={theme === k} className={`flex flex-col items-center gap-2 rounded-inner border p-3 text-center text-xs leading-tight transition active:scale-95 ${theme === k ? 'border-gold bg-emerald/60' : 'border-gold/25'}`}>
              <span className="grid size-11 place-items-center rounded-full border border-white/25" style={{ background: `linear-gradient(135deg, ${bg} 50%, ${ac} 50%)` }}>{theme === k && <Check className="size-5 text-white drop-shadow" />}</span>
              <span className="line-clamp-2 min-h-8">{n}</span>
            </button>
          ))}
          <button type="button" onClick={() => setTheme('custom')} aria-pressed={custom} className={`flex flex-col items-center gap-2 rounded-inner border p-3 text-center text-xs leading-tight transition active:scale-95 ${custom ? 'border-gold bg-emerald/60' : 'border-gold/25'}`}>
            <span className="grid size-11 place-items-center rounded-full border border-white/25" style={{ background: `conic-gradient(${prefs.cbg}, ${prefs.cacc}, #f472b6, #60a5fa, ${prefs.cbg})` }}>{custom && <Check className="size-5 text-white drop-shadow" />}</span>
            <span className="line-clamp-2 min-h-8">Create your own</span>
          </button>
        </div>
      </Group>

      {custom ? (
        <Group title="Your colours" hint="Pick any two colours. Text, cards and borders are worked out for you.">
          <div className="flex items-center gap-4"><input type="color" aria-label="Background colour" value={prefs.cbg} onChange={(e) => set({ cbg: e.target.value })} /><span><b className="block text-sm font-medium">Background</b><span className="text-xs text-mist">{prefs.cbg.toUpperCase()}</span></span></div>
          <div className="flex items-center gap-4"><input type="color" aria-label="Accent colour" value={prefs.cacc} onChange={(e) => set({ cacc: e.target.value })} /><span><b className="block text-sm font-medium">Accent</b><span className="text-xs text-mist">{prefs.cacc.toUpperCase()}</span></span></div>
        </Group>
      ) : (
        <Group title="Accent colour" hint="Recolours buttons, highlights and the prayer ring on any theme.">
          <div className="flex flex-wrap items-center gap-2.5">
            <Chip on={!prefs.accent} onClick={() => set({ accent: '' })}>Theme default</Chip>
            {ACCENTS.map((c) => (
              <button type="button" key={c} onClick={() => set({ accent: c })} aria-label={`Accent ${c}`} aria-pressed={prefs.accent === c} className={`grid size-10 place-items-center rounded-full border-2 transition active:scale-90 ${prefs.accent === c ? 'border-ivory' : 'border-white/20'}`} style={{ background: c }}>{prefs.accent === c && <Check className="size-4 text-white drop-shadow" />}</button>
            ))}
            <input type="color" aria-label="Pick any accent colour" value={prefs.accent || '#C9A24B'} onChange={(e) => set({ accent: e.target.value })} className="size-10" />
          </div>
        </Group>
      )}

      <Group title="Text">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map(([k, n, fam]) => <Chip key={k} on={prefs.font === k} onClick={() => set({ font: k })} className="min-h-12 flex-col gap-0 leading-tight" style={{ fontFamily: `"${fam}", sans-serif` }}><span className="text-base">{n}</span><span className="text-[10px] opacity-70">{fam}</span></Chip>)}
        </div>
        <p className="pt-1 text-sm text-mist">Arabic script</p>
        <div className="grid grid-cols-2 gap-2">
          {ARABIC_FONTS.map(([k, n, fam]) => <Chip key={k} on={prefs.arabic === k} onClick={() => set({ arabic: k })} className="min-h-14 flex-col gap-0 leading-snug"><span dir="rtl" lang="ar" className="text-xl" style={{ fontFamily: `"${fam}", serif` }}>بِسْمِ ٱللَّٰهِ</span><span className="text-[10px] opacity-70">{n}</span></Chip>)}
        </div>
        <Slider label="Text size" min={85} max={130} step={5} value={prefs.scale} onChange={(v) => set({ scale: v })} fmt={(v) => `${v}%`} />
      </Group>

      <Group title="Shape & spacing">
        <Slider label="Corner roundness" min={8} max={40} step={2} value={prefs.radius} onChange={(v) => set({ radius: v })} fmt={(v) => `${v}px`} />
        <div><p className="mb-2 text-sm">Spacing</p><Segmented label="Spacing" value={prefs.density} onChange={(v) => set({ density: v })} options={[['compact', 'Compact'], ['comfy', 'Comfortable'], ['spacious', 'Spacious']]} /></div>
      </Group>

      <Group title="Effects">
        <div className="divide-y divide-gold/15">
          <Toggle label="Glass blur" hint="Frosted cards and menus" checked={prefs.glass} onChange={(v) => set({ glass: v })} />
          <Toggle label="Islamic star pattern" hint="Subtle pattern in the background" checked={prefs.pattern} onChange={(v) => set({ pattern: v })} />
          <Toggle label="Ambient glow" hint="Soft light behind the cards" checked={prefs.glow} onChange={(v) => set({ glow: v })} />
          <Toggle label="Animations" hint="Turn off for a calmer, faster feel" checked={prefs.motion} onChange={(v) => set({ motion: v })} />
        </div>
      </Group>
      <Btn className="mt-6 w-full" onClick={() => { setTheme('emerald'); set({ accent: '', font: PREFS0.font, arabic: PREFS0.arabic, scale: 100, radius: 28, density: 'comfy', glass: true, pattern: true, glow: true, motion: true }) }}><RotateCcw className="size-4" /> Reset appearance</Btn>
    </>
  )
}

function Layout({ prefs, set }) {
  const move = (i, d) => { const c = [...prefs.cards], j = i + d; if (j < 0 || j >= c.length) return; [c[i], c[j]] = [c[j], c[i]]; set({ cards: c }) }
  const flip = (i) => set({ cards: prefs.cards.map((c, x) => (x === i ? [c[0], !c[1]] : c)) })
  const pickNav = (k) => {
    if (prefs.nav.includes(k)) { if (prefs.nav.length <= 2) return toast('Keep at least 2 shortcuts'); return set({ nav: prefs.nav.filter((x) => x !== k) }) }
    if (prefs.nav.length >= 4) return toast('Choose up to 4. Tap one to remove it first.')
    set({ nav: [...prefs.nav, k] })
  }
  return (
    <>
      <Group title="Profile">
        <label className="block text-sm">Your name<input className="field mt-1" value={prefs.name} maxLength={40} onChange={(e) => set({ name: e.target.value })} placeholder="Your name" /></label>
        <label className="block text-sm">Greeting<input className="field mt-1" value={prefs.greeting} maxLength={40} onChange={(e) => set({ greeting: e.target.value })} placeholder="Assalamu Alaikum" /></label>
      </Group>
      <Group title="Time">
        <Segmented label="Time format" value={prefs.hour24} onChange={(v) => set({ hour24: v })} options={[[false, '12-hour (3:42 PM)'], [true, '24-hour (15:42)']]} />
        <Toggle label="Show seconds in the countdown" checked={prefs.seconds} onChange={(v) => set({ seconds: v })} />
      </Group>
      <Group title="Home screen" hint="Show, hide and reorder the cards under your prayer times.">
        <ul className="space-y-2">
          {prefs.cards.map(([id, on], i) => (
            <li key={id} className="tile flex items-center gap-2 rounded-inner py-1.5 pl-4 pr-1.5">
              <span className={`min-w-0 flex-1 truncate text-sm ${on ? '' : 'text-mist line-through'}`}>{HOME_CARDS[id]}</span>
              <button type="button" className="iconbtn size-10" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${HOME_CARDS[id]} up`}><ArrowUp className="size-4" /></button>
              <button type="button" className="iconbtn size-10" onClick={() => move(i, 1)} disabled={i === prefs.cards.length - 1} aria-label={`Move ${HOME_CARDS[id]} down`}><ArrowDown className="size-4" /></button>
              <button type="button" className="iconbtn size-10" onClick={() => flip(i)} aria-pressed={on} aria-label={`${on ? 'Hide' : 'Show'} ${HOME_CARDS[id]}`}>{on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
            </li>
          ))}
        </ul>
      </Group>
      <Group title="Bottom bar shortcuts" hint="Pick up to 4. Everything else lives under “More”.">
        <div className="flex flex-wrap gap-2">{TABS.map(([k, n]) => <Chip key={k} on={prefs.nav.includes(k)} onClick={() => pickNav(k)}>{prefs.nav.includes(k) && <span className="mr-1.5 text-xs opacity-70">{prefs.nav.indexOf(k) + 1}</span>}{n}</Chip>)}</div>
      </Group>
      <Group title="Opens on">
        <select className="field" aria-label="Start screen" value={prefs.start} onChange={(e) => set({ start: e.target.value })}>{TABS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select>
      </Group>
    </>
  )
}

function Prayer({ calc, setCalc }) {
  const tune = calc.tune || {}
  const any = Object.values(tune).some(Boolean) || calc.adj
  return (
    <>
      <Group title="Calculation method" hint="Choose the authority used in your region. Times reload instantly.">
        <select className="field" aria-label="Calculation method" value={calc.method} onChange={(e) => setCalc({ ...calc, method: +e.target.value })}>{METHODS.map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select>
        <div><p className="mb-2 text-sm">Asr calculation</p><Segmented label="Asr calculation" value={calc.school} onChange={(v) => setCalc({ ...calc, school: v })} options={[[0, "Shafi'i / Standard"], [1, 'Hanafi']]} /></div>
      </Group>
      <Group title="Fine-tune each prayer" hint="Add or remove minutes to match your local mosque timetable.">
        <ul className="space-y-2">
          {TUNE_KEYS.map((k) => (
            <li key={k} className="tile flex items-center justify-between gap-2 rounded-inner py-1.5 pl-4 pr-2"><span className="text-sm">{k}</span><Stepper value={tune[k] || 0} unit=" min" onChange={(v) => setCalc({ ...calc, tune: { ...tune, [k]: v } })} /></li>
          ))}
        </ul>
      </Group>
      <Group title="Hijri date" hint="Moon sighting can differ by a day. Shift the Hijri date to match yours.">
        <div className="tile flex items-center justify-between gap-2 rounded-inner py-1.5 pl-4 pr-2"><span className="text-sm">Adjust</span><Stepper value={calc.adj || 0} min={-2} max={2} unit=" day" onChange={(v) => setCalc({ ...calc, adj: v })} /></div>
      </Group>
      {any && <Btn className="mt-6 w-full" onClick={() => setCalc({ ...calc, tune: {}, adj: 0 })}><RotateCcw className="size-4" /> Clear all adjustments</Btn>}
    </>
  )
}

function Data({ install, standalone }) {
  const [sure, setSure] = useState(false)
  const restore = async (e) => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return
    try { await importBackup(f); toast.success('Backup restored. Reloading…'); setTimeout(() => location.reload(), 700) } catch { toast.error('That file is not a Daily Prayer backup.') }
  }
  return (
    <>
      <Group title="Install" hint="Add the app to your home screen for a full-screen, offline-ready experience.">
        {standalone ? <p className="text-sm text-mist">✓ You are using the installed app.</p>
          : install ? <Btn solid className="w-full" onClick={install}><Download className="size-4" /> Install app</Btn>
            : <p className="text-sm text-mist">On iPhone: tap Share, then “Add to Home Screen”. On Android or desktop Chrome: open the browser menu and choose “Install app”.</p>}
      </Group>
      <Group title="Backup" hint="Everything is stored privately on this device. Save a copy to move to another phone or browser.">
        <Btn className="w-full" onClick={() => { exportBackup(); toast.success('Backup downloaded') }}><Download className="size-4" /> Export backup</Btn>
        <label className="btn w-full cursor-pointer border-dashed"><Upload className="size-4" /> Restore from backup<input type="file" accept="application/json,.json" onChange={restore} className="sr-only" /></label>
      </Group>
      <Group title="Reset">
        <Btn className="w-full border-red-400/60 text-red-300" onClick={() => { if (!sure) { setSure(true); setTimeout(() => setSure(false), 3500); return } resetAll(); location.reload() }}><Trash2 className="size-4" /> {sure ? 'Tap again to erase everything' : 'Erase all data and settings'}</Btn>
      </Group>
      <p className="mt-6 text-center text-xs text-mist">Version {APP_VERSION} · Prayer data by AlAdhan · Quran by AlQuran Cloud</p>
    </>
  )
}

export default function Settings({ theme, setTheme, prefs, setPrefs, calc, setCalc, install, standalone, onClose }) {
  const [tab, setTab] = useState('look')
  return (
    <Sheet title="Settings" onClose={onClose} wide>
      <div className="sticky top-0 z-10 -mx-5 -mt-2 mb-4 bg-night/95 px-5 pb-3 pt-2 backdrop-blur sm:-mx-6 sm:px-6">
        <Segmented label="Settings sections" value={tab} onChange={setTab} options={[['look', 'Look'], ['layout', 'Layout'], ['prayer', 'Prayer'], ['data', 'Data']]} />
      </div>
      {tab === 'look' && <Look theme={theme} setTheme={setTheme} prefs={prefs} set={setPrefs} />}
      {tab === 'layout' && <Layout prefs={prefs} set={setPrefs} />}
      {tab === 'prayer' && <Prayer calc={calc} setCalc={setCalc} />}
      {tab === 'data' && <Data install={install} standalone={standalone} />}
      <Btn solid className="mt-8 w-full" onClick={onClose}>Done</Btn>
    </Sheet>
  )
}
