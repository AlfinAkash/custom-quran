import { useState } from 'react'
import { DUAS } from '../content/duas'
import { Card } from '../components/Card'

export function Duas() {
  const [copied, setCopied] = useState(-1)
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {DUAS.map(([t, ar, en], i) => (
        <Card key={t} title={t}>
          <p dir="rtl" lang="ar" className="font-arabic text-2xl leading-[2.2] sm:text-3xl">{ar}</p>
          <p className="mt-2 text-ivory/90">{en}</p>
          <button className="mt-3 text-sm text-gold" onClick={() => navigator.clipboard?.writeText(`${ar}\n${en}`).then(() => setCopied(i))}>{copied === i ? 'Copied ✓' : 'Copy'}</button>
        </Card>
      ))}
    </div>
  )
}
