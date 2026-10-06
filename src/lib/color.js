export const rgbOf = (h) => { const n = parseInt(h.slice(1), 16); return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}` }
