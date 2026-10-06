import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

// Bottom sheet on phones, centred dialog from 640px up. Has a sticky title bar and a close button.
export function Sheet({ title = 'Panel', onClose, children, wide = false }) {
  return (
    <Dialog.Root open onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`sheet fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-card border border-gold/35 bg-night shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86dvh] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-card ${wide ? 'max-w-2xl' : 'max-w-lg'}`}
        >
          <div className="mx-auto mt-2.5 h-1.5 w-11 shrink-0 rounded-full bg-gold/40 sm:hidden" aria-hidden="true" />
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-3 sm:px-6">
            <Dialog.Title className="text-xl font-semibold text-gold">{title}</Dialog.Title>
            <Dialog.Close aria-label="Close" className="iconbtn size-10"><X className="size-5" /></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const Card = ({ title, icon: Icon, children, className = '', ...p }) => (
  <section {...p} className={`surface rounded-card p-(--pad) ${className}`}>
    {title && <h2 className="mb-3 flex items-center gap-2 font-semibold text-gold">{Icon && <Icon className="size-[1.1rem]" aria-hidden="true" />}{title}</h2>}
    {children}
  </section>
)
export const Btn = ({ className = '', solid = false, ...p }) => <button type="button" {...p} className={`btn ${solid ? 'btn-solid' : ''} ${className}`} />
export const IconBtn = ({ className = '', ...p }) => <button type="button" {...p} className={`iconbtn ${className}`} />
export const Chip = ({ on, className = '', ...p }) => <button type="button" {...p} data-on={!!on} aria-pressed={!!on} className={`chip ${className}`} />

export function Toggle({ checked, onChange, label, hint }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex min-h-12 w-full items-center justify-between gap-4 py-1.5 text-left">
      <span className="min-w-0"><span className="block">{label}</span>{hint && <span className="block text-xs text-mist">{hint}</span>}</span>
      <span className="switch" data-on={!!checked}><i /></span>
    </button>
  )
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="seg">
      {options.map(([v, n]) => <button key={String(v)} type="button" role="radio" aria-checked={value === v} data-on={value === v} onClick={() => onChange(v)}>{n}</button>)}
    </div>
  )
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt = (v) => v }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between text-sm"><span>{label}</span><span className="tabular-nums text-gold">{fmt(value)}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-2 h-8 w-full accent-gold" />
    </label>
  )
}

export function Group({ title, hint, children }) {
  return (
    <section className="mt-6 first:mt-1">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{title}</h3>
      {hint && <p className="mt-1 text-xs text-mist">{hint}</p>}
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  )
}

export function Stepper({ value, onChange, min = -30, max = 30, unit = '' }) {
  return (
    <span className="inline-flex items-center gap-1">
      <button type="button" className="iconbtn size-10" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <b className="w-16 text-center tabular-nums">{value > 0 ? '+' : ''}{value}{unit}</b>
      <button type="button" className="iconbtn size-10" aria-label="Increase" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </span>
  )
}
