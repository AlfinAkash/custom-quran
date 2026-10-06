import { useState, useRef, useEffect } from 'react'
import { useLocal } from '../lib/storage'
import { useFetch } from '../lib/useFetch'
import { Btn } from '../components/Buttons'
import { Msg } from '../components/Msg'

export function Quran() {
  const [n, setN] = useLocal('lastSurah', null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [playing, setPlaying] = useState(-1)
  const [qs, setQs] = useLocal('qsize', 28)
  const au = useRef(null)
  const list = useFetch('https://api.alquran.cloud/v1/surah')
  const s = useFetch(open && n ? `https://api.alquran.cloud/v1/surah/${n}/editions/quran-uthmani,en.sahih,ar.alafasy` : null)
  const stop = () => { au.current?.pause(); setPlaying(-1) }
  const play = (i) => {
    au.current?.pause()
    const ays = s.data?.[2]?.ayahs
    if (!ays || i < 0 || i >= ays.length) return setPlaying(-1)
    const a = new Audio(ays[i].audio); au.current = a; setPlaying(i)
    a.onended = () => play(i + 1); a.play().catch(() => setPlaying(-1))
  }
  useEffect(() => () => au.current?.pause(), [])
  useEffect(() => { if (playing >= 0) document.getElementById('ay' + playing)?.scrollIntoView({ block: 'center', behavior: 'smooth' }) }, [playing])

  if (open && n) return (
    <div>
      <div className="sticky top-(--hdr) z-10 mb-4 flex flex-wrap gap-2 bg-night/95 py-2 backdrop-blur">
        <Btn onClick={() => { stop(); setOpen(false) }}>← All surahs</Btn>
        <Btn onClick={() => setQs(Math.max(20, qs - 4))} aria-label="Smaller text">A−</Btn><Btn onClick={() => setQs(Math.min(56, qs + 4))} aria-label="Larger text">A+</Btn>
        {s.data && (playing >= 0 ? <Btn onClick={stop}>⏸ Stop</Btn> : <Btn onClick={() => play(0)}>▶ Play surah (Alafasy)</Btn>)}
      </div>
      {s.data ? <>
        <h2 className="mb-6 text-center font-arabic text-4xl text-gold">{s.data[0].name}</h2>
        <ol className="space-y-4">
          {s.data[0].ayahs.map((a, i) => (
            <li id={'ay' + i} key={a.number} className={`rounded-2xl border p-4 sm:p-5 ${playing === i ? 'border-gold bg-emerald/60' : 'border-gold/20 bg-night/70'}`}>
              <p dir="rtl" lang="ar" style={{ fontSize: qs }} className="font-arabic leading-[2.2]">{a.text}</p>
              <p className="mt-3 max-w-prose leading-relaxed text-ivory/90"><span className="text-gold">{a.numberInSurah}.</span> {s.data[1].ayahs[i].text}</p>
              <button onClick={() => play(i)} className="mt-2 text-sm text-gold">▶ Listen</button>
            </li>
          ))}
        </ol>
      </> : <Msg s={s} />}
    </div>
  )
  if (!list.data) return <Msg s={list} />
  const shown = list.data.filter((x) => `${x.number} ${x.englishName} ${x.englishNameTranslation}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surah name or number" className="mb-4 w-full rounded-full border border-gold/40 bg-night px-5 py-3 text-ivory placeholder:text-mist" />
      {n && <Btn className="mb-4" onClick={() => setOpen(true)}>Continue: {list.data[n - 1]?.englishName}</Btn>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((x) => (
          <li key={x.number}><button onClick={() => { setN(x.number); setOpen(true) }} className="flex w-full items-center justify-between rounded-2xl border border-gold/25 bg-night/70 p-4 text-left hover:border-gold">
            <span className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/40 bg-gold/10 text-sm font-semibold tabular-nums text-gold">{x.number}</span><span className="min-w-0"><b className="block truncate font-medium">{x.englishName}</b><span className="text-sm text-mist">{x.englishNameTranslation} · {x.numberOfAyahs} verses</span></span></span>
            <span className="font-arabic text-2xl">{x.name.replace('سورة', '').trim()}</span>
          </button></li>
        ))}
      </ul>
    </div>
  )
}
