export const streakOf = (done, now) => {
  let n = 0; const d = new Date(now)
  if ((done[d.toDateString()] || []).length < 5) d.setDate(d.getDate() - 1)
  while ((done[d.toDateString()] || []).length === 5) { n++; d.setDate(d.getDate() - 1) }
  return n
}
