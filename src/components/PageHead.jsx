import { ICONS, SUB, TABS } from '../lib/constants'

export function PageHead({ tab }) {
  const Icon = ICONS[tab]
  return (
    <div className="mb-6 flex items-center gap-4">
      <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-gold to-gold/70 text-night shadow-lg shadow-black/25 sm:size-14"><Icon className="size-6 sm:size-7" /></div>
      <div className="min-w-0"><h2 className="font-display text-3xl font-semibold leading-none sm:text-4xl">{TABS.find((t) => t[0] === tab)?.[1]}</h2><p className="mt-1.5 truncate text-sm text-mist">{SUB[tab]}</p></div>
    </div>
  )
}
