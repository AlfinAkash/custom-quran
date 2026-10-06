import { useState, useEffect } from 'react'
import { store } from './storage'

// ---------- Adhan sound (built-in call to prayer + optional uploaded adhan) ----------
const ADHAN_SRC = `${import.meta.env.BASE_URL}adhan.mp3`

const SILENT = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='
export let player = null, adhanUrl = null, customUrl = null, playingNow = false, unlocked = false
const playListeners = new Set()
const setPlaying = (v) => { playingNow = v; playListeners.forEach((f) => f(v)) }

export function usePlaying() {
  const [p, set] = useState(playingNow)
  useEffect(() => { playListeners.add(set); set(playingNow); return () => { playListeners.delete(set) } }, [])
  return p
}

const getPlayer = () => {
  if (!player) { player = new Audio(); player.preload = 'auto'; player.onended = () => setPlaying(false) }
  return player
}

// Browsers only allow sound after the person has touched the page once; this "unlocks" the audio element silently.
export function unlockAudio() {
  if (unlocked) return
  try {
    const p = getPlayer(); p.muted = true; p.src = SILENT
    p.play().then(() => { if (p.src === SILENT) p.pause(); p.muted = false; unlocked = true }).catch(() => { p.muted = false })
  } catch { /* unsupported */ }
}

export const loadAdhan = () => fetch(ADHAN_SRC).then((r) => r.blob()).then((b) => { adhanUrl = URL.createObjectURL(b) }).catch(() => {})

export async function playAdhan(vol = 0.6, which = 'adhan') {
  try {
    const p = getPlayer(); p.muted = false; p.volume = vol
    p.src = which === 'custom' && customUrl ? customUrl : adhanUrl || ADHAN_SRC
    await p.play(); setPlaying(true); return true
  } catch { setPlaying(false); return false }
}

export function stopAdhan() { if (!player) return; player.pause(); try { player.currentTime = 0 } catch { /* ignore */ } setPlaying(false) }

const idbOp = (mode, fn) => new Promise((res, rej) => {
  const o = indexedDB.open('daily-prayer', 1)
  o.onupgradeneeded = () => o.result.createObjectStore('kv')
  o.onerror = () => rej(o.error)
  o.onsuccess = () => { const tx = o.result.transaction('kv', mode), rq = fn(tx.objectStore('kv')); tx.oncomplete = () => res(rq.result); tx.onerror = () => rej(tx.error) }
})

export async function loadCustom() {
  try {
    let rec = await idbOp('readonly', (s) => s.get('tone'))
    if (!rec) { // move a tone saved by the older version into the new storage
      const old = store('customTone', null)
      if (old) { rec = { name: 'My uploaded adhan', blob: await (await fetch(old)).blob() }; await idbOp('readwrite', (s) => s.put(rec, 'tone')) }
    }
    if (customUrl) URL.revokeObjectURL(customUrl)
    customUrl = rec ? URL.createObjectURL(rec.blob) : null
    if (rec) localStorage.removeItem('customTone')
    return rec ? { name: rec.name } : null
  } catch { return null }
}

export const saveCustom = async (file) => { await idbOp('readwrite', (s) => s.put({ name: file.name, blob: file }, 'tone')); return loadCustom() }

export async function removeCustom() {
  stopAdhan()
  try { await idbOp('readwrite', (s) => s.delete('tone')) } catch { /* ignore */ }
  localStorage.removeItem('customTone')
  if (customUrl) URL.revokeObjectURL(customUrl)
  customUrl = null
}
