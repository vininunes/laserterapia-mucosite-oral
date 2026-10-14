/**
 * Comprimento "redondo" (1, 2 ou 5 × 10ⁿ metros) para uma barra de escala de
 * até `maxPx` pixels, dado quantos pixels vale um metro.
 */
export function niceScale(pxPerMeter: number, maxPx = 96): { meters: number; px: number } | null {
  if (!(pxPerMeter > 0)) return null
  const raw = maxPx / pxPerMeter
  const base = 10 ** Math.floor(Math.log10(raw))
  const meters = [5, 2, 1].map((k) => k * base).find((m) => m <= raw * (1 + 1e-9)) ?? base
  return { meters, px: meters * pxPerMeter }
}

/** "5 mm", "1 cm", "500 nm", "20 µm" (números em pt-BR). */
export function formatLength(meters: number): string {
  const [factor, unit] =
    meters >= 1e-2 ? [1e2, 'cm'] : meters >= 1e-3 ? [1e3, 'mm'] : meters >= 1e-6 ? [1e6, 'µm'] : [1e9, 'nm']
  const value = Math.round(meters * factor * 1000) / 1000
  return `${value.toLocaleString('pt-BR')} ${unit}`
}
