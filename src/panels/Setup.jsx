import { useState } from 'react'
import { askNotif, getPosition, askExact } from '../native'
import { toast } from 'sonner'
import { Sheet } from '../components/Sheet'
import { Btn } from '../components/Buttons'

export function Setup({ al, setAl, onPick, onClose }) {
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    const ok = await askNotif()
    if (ok) setAl({ ...al, on: true })
    try { const g = await getPosition(); onPick({ name: 'My location', lat: +g.lat.toFixed(4), lng: +g.lng.toFixed(4) }) } catch { toast('Location skipped. You can set it any time with the location button.') }
    if (ok) await askExact()
    setBusy(false); onClose()
  }
  return (
    <Sheet onClose={onClose}>
      <h2 className="text-xl font-semibold text-gold">Welcome</h2>
      <p className="mt-2 text-sm text-mist">Allow two things so the app can work properly:</p>
      <ul className="mt-4 space-y-3">
        <li className="rounded-2xl border border-gold/25 p-4"><b>🔔 Notifications</b><p className="mt-1 text-sm text-mist">Prayer alerts with the adhan, before and after each prayer, even when the app is closed.</p></li>
        <li className="rounded-2xl border border-gold/25 p-4"><b>📍 Location</b><p className="mt-1 text-sm text-mist">Accurate prayer times and Qibla direction for where you are. Used only on this phone.</p></li>
      </ul>
      <div className="mt-6 flex gap-2"><Btn className="flex-1 bg-gold !text-night" onClick={go}>{busy ? 'Please wait…' : 'Allow and continue'}</Btn><Btn className="flex-1" onClick={onClose}>Not now</Btn></div>
    </Sheet>
  )
}
