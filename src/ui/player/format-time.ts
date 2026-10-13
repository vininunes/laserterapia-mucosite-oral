/** `m:ss.d` — décimos bastam para a escala das cenas (segundos a minutos). */
export function formatTime(seconds: number): string {
  const s = Math.max(seconds, 0)
  const tenths = Math.floor(s * 10 + 1e-6)
  const m = Math.floor(tenths / 600)
  const rest = (tenths % 600) / 10
  return `${m}:${rest.toFixed(1).padStart(4, '0')}`
}
