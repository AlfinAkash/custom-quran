import { useState } from 'react'
import { useFetch } from '../lib/useFetch'
import { Msg } from '../components/Msg'

export function Names() {
  const [q, setQ] = useState('')
  const d = useFetch('https://api.aladhan.com/v1/asmaAlHusna')
  if (!d.data) return <Msg s={d} />
  const shown = d.data.filter((x) => `${x.transliteration} ${x.en.meaning}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a name or meaning" className="mb-4 w-full rounded-full border border-gold/40 bg-night px-5 py-3 text-ivory placeholder:text-mist" />
      <ul className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
        {shown.map((x) => (
          <li key={x.number} className="relative rounded-2xl border border-gold/25 bg-night/70 p-4 text-center"><span className="absolute left-3 top-3 grid size-7 place-items-center rounded-lg bg-gold/10 text-xs font-semibold text-gold tabular-nums">{x.number}</span>
            <p className="font-arabic text-4xl text-gold">{x.name}</p>
            <p className="mt-1 font-medium">{x.transliteration}</p>
            <p className="text-sm text-mist">{x.en.meaning}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
