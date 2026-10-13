import { frequencyHz, photonEnergyEv } from './photon'
import { wavelengthToRgb, type Rgb } from './spectrum'
import type { SceneModel } from './types'

/**
 * Cena 1 — onda eletromagnética. Eixos: propagação em +x, campo elétrico em
 * y, campo magnético em z.
 *
 * ESCALA ILUSTRATIVA: λ visual proporcional ao λ real (660 nm ↦ 2 unidades),
 * mas a velocidade de propagação é lenta para ser acompanhável. As amplitudes
 * de E e B são desenhadas iguais; no vácuo |B| = |E| / c.
 */
export const EM_VISUAL = {
  unitsPer660nm: 2,
  /** Velocidade visual de propagação, em unidades/s (a mesma para todo λ). */
  speed: 1.6,
  xMin: -6,
  xMax: 6,
  amplitude: 1,
  /** Afastamento vertical das duas ondas no modo comparação. */
  laneOffset: 1.7,
  /** Duração das transições de entrada. */
  fade: 1.5,
} as const

export const EM_SPAN = EM_VISUAL.xMax - EM_VISUAL.xMin

/** Instantes (s) em que cada elemento entra. Definidos no roteiro. */
export interface EmWaveTiming {
  bField: number
  ruler: number
  photon: number
  compare: number
}

export type EmWaveParams = {
  /** λ do laser A, em nm. */
  wavelengthA: number
  /** λ do laser B (comparação), em nm. */
  wavelengthB: number
  /** 1 mostra a comparação a partir de `timing.compare`. */
  compare: number
  /** 1 mostra o campo magnético a partir de `timing.bField`. */
  showB: number
}

export type EmWaveInput = EmWaveParams & { timing: EmWaveTiming }

export interface WaveState {
  wavelengthNm: number
  /** λ na cena, em unidades. */
  lambda: number
  /** Número de onda visual, rad/unidade. */
  k: number
  /** Frequência angular visual, rad/s. */
  omega: number
  /** Instante em que a fonte começou a emitir. */
  emittedAt: number
  /** Até onde a onda já chegou (x); além disso o campo é zero. */
  front: number
  /** Posição vertical do eixo de propagação. */
  laneY: number
  opacity: number
  /** Opacidade do campo B, relativa à da onda. */
  bOpacity: number
  color: Rgb
  visible: boolean
  frequencyHz: number
  photonEnergyEv: number
}

export interface EmWaveState {
  waves: [WaveState, WaveState]
  rulerOpacity: number
  photon: { x: number; opacity: number }
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/** Rampa suave de 0 a 1 começando em `start`. */
export function reveal(t: number, start: number, duration: number = EM_VISUAL.fade): number {
  const x = clamp01((t - start) / duration)
  return x * x * (3 - 2 * x)
}

export function visualWavelength(nm: number): number {
  return (EM_VISUAL.unitsPer660nm * nm) / 660
}

function wave(nm: number, emittedAt: number, t: number, laneY: number, opacity: number, bOpacity: number): WaveState {
  const lambda = visualWavelength(nm)
  const k = (2 * Math.PI) / lambda
  const { color, visible } = wavelengthToRgb(nm)
  return {
    wavelengthNm: nm,
    lambda,
    k,
    omega: k * EM_VISUAL.speed,
    emittedAt,
    front: Math.min(EM_VISUAL.xMin + EM_VISUAL.speed * Math.max(t - emittedAt, 0), EM_VISUAL.xMax),
    laneY,
    opacity,
    bOpacity,
    color,
    visible,
    frequencyHz: frequencyHz(nm),
    photonEnergyEv: photonEnergyEv(nm),
  }
}

export const emWaveModel: SceneModel<EmWaveInput, EmWaveState> = (t, p) => {
  const { timing } = p
  const compareK = p.compare ? reveal(t, timing.compare) : 0
  const bK = p.showB ? reveal(t, timing.bField) : 0
  const photonK = reveal(t, timing.photon)

  // Um fóton por vez percorre o eixo do laser A, saindo da fonte.
  const travelled = (EM_VISUAL.speed * Math.max(t - timing.photon, 0)) % EM_SPAN
  const edge = clamp01(Math.min(travelled, EM_SPAN - travelled) / 0.6)

  return {
    waves: [
      wave(p.wavelengthA, 0, t, compareK * EM_VISUAL.laneOffset, 1, bK),
      // O laser B só liga quando a comparação começa.
      wave(p.wavelengthB, timing.compare, t, -compareK * EM_VISUAL.laneOffset, compareK, bK),
    ],
    rulerOpacity: reveal(t, timing.ruler),
    photon: { x: EM_VISUAL.xMin + travelled, opacity: photonK * edge },
  }
}

/**
 * Campo normalizado (−1…1) em `x` no instante `t`. A onda sai da fonte em
 * `xMin` e anda para +x; à frente do `front` ainda não chegou nada.
 */
export function fieldAt(w: WaveState, x: number, t: number): number {
  if (x > w.front || t < w.emittedAt) return 0
  return Math.sin(w.k * (x - EM_VISUAL.xMin) - w.omega * (t - w.emittedAt))
}

/** Preenche `out` com o campo em `n = out.length` pontos igualmente espaçados de xMin a xMax. */
export function sampleField(w: WaveState, t: number, out: Float32Array): Float32Array {
  const n = out.length
  for (let i = 0; i < n; i++) {
    const x = EM_VISUAL.xMin + (EM_SPAN * i) / (n - 1)
    out[i] = fieldAt(w, x, t)
  }
  return out
}
