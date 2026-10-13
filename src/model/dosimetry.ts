import type { SceneModel } from './types'

/**
 * Cena 6 — dosimetria. Fluência (J/cm²) = irradiância (mW/cm²) × tempo (s) / 1000.
 * Potência (mW) = irradiância × área do spot. Energia (J) = potência × tempo / 1000.
 */

export interface DoseProtocol {
  irradianceMwCm2: number
  timePerPointS: number
  reportedFluenceJcm2: number
  spotCm2: number
  points: [number, number]
}

export function fluenceJcm2(irradianceMwCm2: number, timeS: number): number {
  return (irradianceMwCm2 * timeS) / 1000
}

export interface DoseDerived {
  powerMw: number
  energyPerPointJ: number
  computedFluenceJcm2: number
  /** Fluência publicada difere de irradiância × tempo além do arredondamento. */
  fluenceMismatch: boolean
  /** Tempo de irradiação por sessão, em s (só a soma dos pontos). */
  sessionTimeS: [number, number]
  sessionEnergyJ: [number, number]
}

/**
 * Tolerância para considerar a fluência publicada consistente: meia unidade
 * da última casa publicada (todas as fluências do resumo têm 1 casa).
 */
export const FLUENCE_TOLERANCE = 0.05 + 1e-9

export function deriveDose(p: DoseProtocol): DoseDerived {
  const powerMw = p.irradianceMwCm2 * p.spotCm2
  const energyPerPointJ = (powerMw * p.timePerPointS) / 1000
  const computedFluenceJcm2 = fluenceJcm2(p.irradianceMwCm2, p.timePerPointS)
  return {
    powerMw,
    energyPerPointJ,
    computedFluenceJcm2,
    fluenceMismatch: Math.abs(computedFluenceJcm2 - p.reportedFluenceJcm2) > FLUENCE_TOLERANCE,
    sessionTimeS: [p.points[0] * p.timePerPointS, p.points[1] * p.timePerPointS],
    sessionEnergyJ: [p.points[0] * energyPerPointJ, p.points[1] * energyPerPointJ],
  }
}

export interface DoseLaneState {
  /** Tempo de irradiação decorrido no ponto, em s. */
  elapsedS: number
  /** Fluência acumulada no ponto, J/cm². */
  fluenceJcm2: number
  /** 0–1 do tempo do protocolo. */
  progress: number
  /** Laser ligado agora. */
  emitting: boolean
  done: boolean
  /** Ênfase visual: 1 normal, menor quando outro protocolo está em foco. */
  emphasis: number
}

export type DosimetryInput = {
  protocols: readonly DoseProtocol[]
  /** Instante em que todas as sondas ligam. */
  start: number
  /** Índice do protocolo em foco, ou −1 para todos. */
  focus: number
}

export const DIMMED_EMPHASIS = 0.25

export function doseLane(t: number, p: DoseProtocol, index: number, input: DosimetryInput): DoseLaneState {
  const elapsedS = Math.min(Math.max(t - input.start, 0), p.timePerPointS)
  return {
    elapsedS,
    fluenceJcm2: fluenceJcm2(p.irradianceMwCm2, elapsedS),
    progress: elapsedS / p.timePerPointS,
    emitting: t >= input.start && elapsedS < p.timePerPointS,
    done: elapsedS >= p.timePerPointS,
    emphasis: input.focus < 0 || input.focus === index ? 1 : DIMMED_EMPHASIS,
  }
}

export const dosimetryModel: SceneModel<DosimetryInput, DoseLaneState[]> = (t, input) =>
  input.protocols.map((p, i) => doseLane(t, p, i, input))

/** Raio de um spot circular com a área dada (mesma unidade de comprimento). */
export function spotRadius(areaCm2: number): number {
  return Math.sqrt(areaCm2 / Math.PI)
}
