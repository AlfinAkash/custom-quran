import { useState } from 'react'
import { useLocal } from '../lib/storage'
import { Card } from '../components/Card'

export function Zakat() {
  const [sav, setSav] = useState(''), [gold, setGold] = useLocal('gold', '')
  const nisab = (+gold || 0) * 87.48, due = nisab > 0 && +sav >= nisab ? +sav * 0.025 : 0
  const inp = 'mt-1 w-full rounded-xl border border-gold/40 bg-night px-4 py-3 text-lg text-ivory'
  const fmt = (n) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 })
  return (
    <Card className="mx-auto max-w-md space-y-4">
      <label className="block">Total savings (₹)<input type="number" inputMode="decimal" min="0" value={sav} onChange={(e) => setSav(e.target.value)} className={inp} /></label>
      <label className="block">Gold price per gram (₹)<input type="number" inputMode="decimal" min="0" value={gold} onChange={(e) => setGold(e.target.value)} className={inp} /></label>
      <p className="text-mist">Nisab (87.48 g gold): <span className="text-ivory">{fmt(nisab)}</span></p>
      {nisab > 0 && sav !== '' && (due > 0 ? <p className="text-2xl font-semibold text-gold">Zakat due (2.5%): {fmt(due)}</p> : <p className="text-mist">Below nisab: zakat is not due.</p>)}
    </Card>
  )
}
