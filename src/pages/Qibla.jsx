import { useState, useEffect } from 'react'
import { useFetch } from '../lib/useFetch'
import { Card } from '../components/Card'
import { Btn } from '../components/Buttons'
import { Msg } from '../components/Msg'

export function Qibla({ loc }) {
  const q = useFetch(`https://api.aladhan.com/v1/qibla/${loc.lat}/${loc.lng}`)
  const [live, setLive] = useState(false)
  const [head, setHead] = useState(0)
  useEffect(() => {
    if (!live) return
    const h = (e) => { const v = e.webkitCompassHeading ?? (e.absolute && e.alpha != null ? 360 - e.alpha : null); if (v != null) setHead(v) }
    window.addEventListener('deviceorientationabsolute', h, true); window.addEventListener('deviceorientation', h, true)
    return () => { window.removeEventListener('deviceorientationabsolute', h, true); window.removeEventListener('deviceorientation', h, true) }
  }, [live])
  const enable = async () => {
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission && (await DeviceOrientationEvent.requestPermission()) !== 'granted') return } catch { return }
    setLive(true)
  }
  return (
    <Card className="mx-auto max-w-md text-center">
      {q.data ? <>
        <div className="relative mx-auto h-56 w-56 rounded-full border-2 border-gold/60 bg-night/40 shadow-[0_0_60px_-12px_rgb(var(--gold)/.5)] transition-transform duration-200 sm:h-64 sm:w-64" style={{ transform: `rotate(${-head}deg)` }}>
          <span className="absolute left-1/2 top-2 -translate-x-1/2 text-sm text-mist">N</span>
          <div className="absolute inset-0" style={{ transform: `rotate(${q.data.direction}deg)` }}><div className="mx-auto mt-6 h-[42%] w-1.5 rounded bg-gold" /></div>
          <span className="absolute inset-0 flex items-center justify-center text-3xl" style={{ transform: `rotate(${head}deg)` }}>🕋</span>
        </div>
        <p className="mt-4 text-2xl font-semibold">{q.data.direction.toFixed(1)}° from North</p>
        <p className="mt-1 text-sm text-mist">{live ? 'Live compass on: point the top of your phone where the gold needle points up.' : 'Use a phone for the live compass.'}</p>
        {!live && <Btn className="mt-3" onClick={enable}>Enable live compass</Btn>}
      </> : <Msg s={q} />}
    </Card>
  )
}
