import { useState, useEffect } from 'react'

export const store = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } }
export function useLocal(k, d) { const [v, set] = useState(() => store(k, d)); useEffect(() => localStorage.setItem(k, JSON.stringify(v)), [k, v]); return [v, set] }
