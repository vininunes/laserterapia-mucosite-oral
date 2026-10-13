/** Marcador anterior a `t` (com folga para que dois cliques seguidos recuem). */
export function previousMarker(markers: readonly number[], t: number, epsilon = 0.25): number {
  let best = 0
  for (const m of markers) if (m < t - epsilon) best = Math.max(best, m)
  return best
}

/** Próximo marcador depois de `t`; sem próximo, devolve `fallback` (fim da timeline). */
export function nextMarker(markers: readonly number[], t: number, fallback: number): number {
  let best = fallback
  for (const m of markers) if (m > t + 1e-6) best = Math.min(best, m)
  return best
}
