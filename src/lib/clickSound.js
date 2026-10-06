let clickCtx = null

export function clickSound() {
  try {
    clickCtx = clickCtx || new (window.AudioContext || window.webkitAudioContext)()
    const o = clickCtx.createOscillator(), g = clickCtx.createGain(), t = clickCtx.currentTime
    o.frequency.value = 520; o.connect(g); g.connect(clickCtx.destination)
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.07); o.start(t); o.stop(t + 0.08)
  } catch { /* audio blocked */ }
}
