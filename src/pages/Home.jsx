import { Check } from 'lucide-react'
import { useFetch } from '../lib/useFetch'
import { add, dayOfYear, pad, to12 } from '../lib/time'
import { streakOf } from '../lib/streak'
import { AR, FIVE, PICON, PRAYERS, RAK } from '../lib/constants'
import { Card } from '../components/Card'
import { HADITH } from '../content/hadith'
import { Msg } from '../components/Msg'

export function Home({ timings, next, err, day, local, done, setDone, hijri }) {
  const today = done[day] || []
  const toggle = (k) => setDone({ ...done, [day]: today.includes(k) ? today.filter((x) => x !== k) : [...today, k] })
  const ayah = useFetch(`https://api.alquran.cloud/v1/ayah/${((dayOfYear(local) * 17) % 6236) + 1}/editions/quran-uthmani,en.sahih`)
  const a = ayah.data?.[0], b = ayah.data?.[1]
  const streak = streakOf(done, local)
  return (
    <div className="stagger grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
      <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-gold/40 bg-linear-to-b from-emerald/80 to-emerald/30 p-5 text-center shadow-2xl shadow-black/30 sm:p-8 lg:sticky lg:top-[calc(var(--hdr)+1rem)] lg:col-span-5 lg:max-w-none">
        <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
        {next ? (
          <div className="relative mx-auto aspect-square w-full max-w-56 short:max-w-40 sm:max-w-64">
            <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
              <defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: 'rgb(var(--gold))' }} /><stop offset="1" style={{ stopColor: 'rgb(var(--ivory))' }} /></linearGradient></defs>
              <circle cx="100" cy="100" r="90" fill="none" className="stroke-night" strokeWidth="8" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="url(#ringg)" strokeWidth="8" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgb(var(--gold) / .6))', transition: 'stroke-dashoffset 1s linear' }} strokeDasharray="565.5" strokeDashoffset={565.5 * (1 - next.pct)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm text-mist">Next prayer</p>
              <p className="font-display text-4xl font-semibold text-gold">{next.k}</p>
              <p className="font-arabic text-3xl tabular-nums min-[360px]:text-4xl sm:text-5xl">{pad(next.h)}:{pad(next.m)}:{pad(next.s)}</p>
              <p className="text-sm text-mist">at {to12(timings[next.k])}</p>
            </div>
          </div>
        ) : err ? <p className="py-16 text-mist">Could not load prayer times.</p> : <div className="skeleton mx-auto aspect-square w-full max-w-56 !rounded-full" role="status" aria-label="Loading prayer times" />}
        {hijri && <p className="relative mt-5 inline-flex rounded-full border border-gold/30 bg-night/40 px-4 py-1.5 text-xs text-mist">{hijri.day} {hijri.month.en} {hijri.year} AH</p>}
      </div>

      <div className="@container lg:col-span-7"><div className="grid gap-2 @md:grid-cols-3 @md:gap-3 @4xl:grid-cols-6">
        {PRAYERS.map((k) => {
          const on = next?.k === k, sun = k === 'Sunrise', ok = today.includes(k)
          return (
            <button key={k} disabled={sun} onClick={() => toggle(k)} aria-pressed={sun ? undefined : ok} className={`flex min-h-16 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] @md:flex-col @md:justify-center @md:gap-1 @md:p-4 @md:text-center ${on ? 'border-gold bg-gold text-night shadow-[0_0_28px_rgb(var(--gold)/0.4)]' : 'border-gold/25 bg-night/70'} ${sun ? 'opacity-70' : ''}`}>
              <span className="flex items-center gap-3 @md:flex-col @md:gap-0">
                <span className={`grid size-11 shrink-0 place-items-center rounded-full ${on ? 'bg-night/15' : 'bg-gold/10 text-gold'}`}>{(() => { const PI = PICON[k]; return <PI className="size-5" /> })()}</span>
                <span><b className="block text-base font-semibold @md:text-sm">{k} <span className={`font-arabic text-base font-normal ${on ? '' : 'text-gold'}`}>{AR[k]}</span></b><span className="block text-xs opacity-70">{RAK[k] ? `${RAK[k]} rakat fard` : 'Fajr time ends'}</span></span>
              </span>
              <span className="text-right @md:text-center">
                <span className="block text-xl font-semibold tabular-nums">{timings ? to12(timings[k]) : '—'}</span>
                <span className="flex h-5 items-center justify-end gap-1 text-xs @md:justify-center">{ok && <><Check className="size-3.5" /> Prayed</>}</span>
              </span>
            </button>
          )
        })}
      </div></div>

      <Card title="Morning & night times" className="lg:col-span-12 lg:order-5">
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[['Imsak', timings?.Imsak], ['Duha (approx.)', timings && add(timings.Sunrise, 20)], ['Islamic midnight', timings?.Midnight], ['Last third (Tahajjud)', timings?.Lastthird]].map(([n, v]) => (
            <div key={n}><p className="text-sm text-mist">{n}</p><p className="text-lg font-semibold tabular-nums">{v ? to12(v) : '—'}</p></div>
          ))}
        </div>
      </Card>

      <Card title="Hadith of the day" className="lg:col-span-5 lg:order-6">
        <p className="text-lg leading-relaxed">“{HADITH[dayOfYear(local) % HADITH.length][0]}”</p>
        <p className="mt-2 text-sm text-mist">Meaning of the hadith, paraphrased · {HADITH[dayOfYear(local) % HADITH.length][1]}</p>
      </Card>

      <Card title="Fasting: Sehri & Iftar" className="lg:col-span-7 lg:order-4">
        <p className="text-lg">Sehri ends <b className="text-gold">{timings ? to12(timings.Fajr) : '—'}</b> · Iftar <b className="text-gold">{timings ? to12(timings.Maghrib) : '—'}</b></p>
        <p className="mt-1 text-sm text-mist">{[1, 4].includes(local.getDay()) ? 'Today is Monday/Thursday, a Sunnah fasting day.' : hijri && +hijri.day >= 13 && +hijri.day <= 15 ? 'White Days (13th–15th): Sunnah fasting.' : 'Sunnah fasts: Mondays, Thursdays and the White Days (13th–15th of each Hijri month).'}</p>
      </Card>

      <Card title="Today's progress" className="lg:col-span-5 lg:order-3">
        <div className="h-3 overflow-hidden rounded-full bg-night"><div className="h-full rounded-full bg-gold transition-all" style={{ width: `${(FIVE.filter((k) => today.includes(k)).length / 5) * 100}%` }} /></div>
        <p className="mt-2 text-sm text-mist">{FIVE.filter((k) => today.includes(k)).length} of 5 prayers · Streak: {streak} day{streak === 1 ? '' : 's'} · Tap a prayer above to mark it done</p>
      </Card>

      <Card title="Verse of the day" className="lg:col-span-7 lg:order-7">
        {a ? <>
          <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-[2.2] sm:text-3xl">{a.text}</p>
          <p className="mt-3 max-w-prose leading-relaxed">{b?.text}</p>
          <p className="mt-2 text-sm text-mist">{a.surah.englishName} {a.surah.number}:{a.numberInSurah}</p>
        </> : <Msg s={ayah} />}
      </Card>
    </div>
  )
}
