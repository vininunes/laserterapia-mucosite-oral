/** Destino dos botões ⏮ ⏭: cena (índice) e tempo de início da etapa. */
export interface StepTarget {
  scene: number
  t: number
}

/** Índice da etapa em `t`: a última que já começou (0 antes da primeira). */
function stepIndex(times: readonly number[], t: number) {
  let index = 0
  for (let i = 0; i < times.length; i++) if (times[i] <= t + 1e-6) index = i
  return index
}

/**
 * Próxima etapa; na última etapa da cena, a primeira etapa da próxima cena.
 * `stepTimes[c]` são os inícios das etapas da cena `c`, em ordem.
 * Na última etapa da última cena, `null`.
 */
export function nextStep(stepTimes: readonly (readonly number[])[], scene: number, t: number): StepTarget | null {
  const times = stepTimes[scene] ?? []
  const i = stepIndex(times, t)
  if (i + 1 < times.length) return { scene, t: times[i + 1] }
  if (scene + 1 < stepTimes.length) return { scene: scene + 1, t: stepTimes[scene + 1][0] ?? 0 }
  return null
}

/**
 * Etapa anterior; na primeira etapa da cena, a última etapa da cena anterior.
 * Na primeira etapa da primeira cena, `null`.
 */
export function previousStep(stepTimes: readonly (readonly number[])[], scene: number, t: number): StepTarget | null {
  const times = stepTimes[scene] ?? []
  const i = stepIndex(times, t)
  if (i > 0) return { scene, t: times[i - 1] }
  if (scene > 0) {
    const prev = stepTimes[scene - 1]
    return { scene: scene - 1, t: prev[prev.length - 1] ?? 0 }
  }
  return null
}
