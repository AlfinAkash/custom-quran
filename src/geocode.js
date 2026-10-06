// Search any place in the world (villages and streets included). Uses OpenStreetMap first, then Open-Meteo.
const parts = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

export async function searchPlaces(q) {
  const out = []
  const seen = new Set()
  const add = (name, sub, lat, lng) => {
    const k = `${lat.toFixed(2)},${lng.toFixed(2)}`
    if (seen.has(k) || !name) return
    seen.add(k); out.push({ name, sub, lat: +lat.toFixed(4), lng: +lng.toFixed(4) })
  }
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=8&accept-language=en`)
    if (r.ok) for (const x of await r.json()) { const p = parts(x.display_name); add(p.slice(0, 2).join(', '), p.slice(2).join(', '), +x.lat, +x.lon) }
  } catch { /* try the next service */ }
  if (out.length < 3) {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=8&language=en`)
      const j = await r.json()
      for (const x of j.results || []) add([x.name, x.admin2].filter(Boolean).join(', '), [x.admin1, x.country].filter(Boolean).join(', '), x.latitude, x.longitude)
    } catch { /* no more services */ }
  }
  return out
}
