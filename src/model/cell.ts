import type { SceneModel, Vec3 } from './types'

/**
 * Cena celular — ESQUEMÁTICA. Não simula bioquímica: só coreografa, em
 * função de `t`, os passos do mecanismo descrito na literatura (fóton →
 * citocromo c oxidase → NO liberado → mais ATP → sinalização → menos
 * mediadores inflamatórios). Quantidades e velocidades são ilustrativas.
 */

export interface CellTiming {
  photon: number
  absorb: number
  atp: number
  signals: number
  inflammation: number
  tissue: number
}

export const CELL_LAYOUT = {
  /** Ponto da mitocôndria em foco onde fica a citocromo c oxidase atingida. */
  cco: [1.25, -0.2, 0.9] as Vec3,
  mitochondrion: [1.2, -0.5, 0.4] as Vec3,
  photonFrom: [3.2, 6.5, 3.5] as Vec3,
  cellRadius: 4,
  /** Partículas de ATP: as de base sempre existem; as extras entram com a PBM. */
  atpBase: 24,
  atpExtra: 56,
  noCount: 10,
  mediatorCount: 48,
  fade: 1.5,
} as const

export type CellParams = { wavelengthNm: number }
export type CellInput = CellParams & { timing: CellTiming }

export interface CellState {
  photon: { position: Vec3; opacity: number }
  /** Brilho da citocromo c oxidase (0–1). */
  ccoGlow: number
  /** 0–1: quanto do ATP "extra" já apareceu. */
  atpBoost: number
  /** 0–1: pulso de sinalização intracelular. */
  signals: number
  /** Opacidade dos mediadores inflamatórios (1 → 0,3: redução, não eliminação). */
  mediators: number
  /** 0–1: células vizinhas (volta ao tecido). */
  tissue: number
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)
const smooth = (x: number) => {
  const c = clamp01(x)
  return c * c * (3 - 2 * c)
}
const ramp = (t: number, start: number, dur: number = CELL_LAYOUT.fade) => smooth((t - start) / dur)

function lerp3(a: Vec3, b: Vec3, k: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

export const MEDIATOR_FLOOR = 0.3

export const cellModel: SceneModel<CellInput, CellState> = (t, { timing }) => {
  const travel = clamp01((t - timing.photon) / (timing.absorb - timing.photon))
  const absorbed = t >= timing.absorb
  // Pulso de sinalização: sobe e desce em ~5 s.
  const sig = clamp01((t - timing.signals) / 5)
  return {
    photon: {
      position: lerp3(CELL_LAYOUT.photonFrom, CELL_LAYOUT.cco, smooth(travel)),
      opacity: t < timing.photon || absorbed ? 0 : 1,
    },
    ccoGlow: absorbed ? Math.max(0.35, 1 - (t - timing.absorb) / 4) : 0,
    atpBoost: ramp(t, timing.atp, 3),
    signals: Math.sin(Math.PI * sig) * (t >= timing.signals ? 1 : 0),
    mediators: 1 - (1 - MEDIATOR_FLOOR) * ramp(t, timing.inflammation, 4),
    tissue: ramp(t, timing.tissue, 2.5),
  }
}

/** Pseudoaleatório determinístico em [0, 1) a partir de um inteiro. */
export function hash01(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4294967296
}

/** Direção unitária determinística para a partícula `i` de uma família `salt`. */
export function particleDirection(i: number, salt: number): Vec3 {
  const u = hash01(i * 7 + salt) * 2 - 1
  const phi = hash01(i * 13 + salt + 1) * Math.PI * 2
  const r = Math.sqrt(1 - u * u)
  return [r * Math.cos(phi), u, r * Math.sin(phi)]
}

const ATP_PERIOD = 4
const ATP_REACH = 2.6

/**
 * Posição e opacidade da partícula de ATP `i` em `t`: nasce na mitocôndria,
 * se afasta e reaparece em ciclos. Índices ≥ `atpBase` são o ATP extra.
 */
export function atpParticle(i: number, t: number, atpBoost: number): { position: Vec3; opacity: number } {
  const dir = particleDirection(i, 101)
  const phase = hash01(i + 900) * ATP_PERIOD
  const k = ((t + phase) % ATP_PERIOD) / ATP_PERIOD
  const d = 0.5 + ATP_REACH * k
  const m = CELL_LAYOUT.mitochondrion
  const fade = Math.sin(Math.PI * k)
  const extra = i >= CELL_LAYOUT.atpBase
  // O extra aparece em sequência à medida que `atpBoost` cresce.
  const share = extra ? clamp01(atpBoost * CELL_LAYOUT.atpExtra - (i - CELL_LAYOUT.atpBase)) : 1
  return { position: [m[0] + dir[0] * d, m[1] + dir[1] * d, m[2] + dir[2] * d], opacity: fade * share }
}

/** NO saindo da citocromo c oxidase depois da absorção. */
export function noParticle(i: number, t: number, absorbAt: number): { position: Vec3; opacity: number } {
  const since = t - absorbAt
  if (since < 0) return { position: CELL_LAYOUT.cco, opacity: 0 }
  const dir = particleDirection(i, 303)
  const d = 0.15 + since * 0.35
  const c = CELL_LAYOUT.cco
  return {
    position: [c[0] + dir[0] * d, c[1] + dir[1] * d, c[2] + dir[2] * d],
    opacity: clamp01(1 - since / 6),
  }
}

/** Mediadores inflamatórios flutuando ao redor da célula. */
export function mediatorParticle(i: number, t: number): Vec3 {
  const dir = particleDirection(i, 505)
  const r = CELL_LAYOUT.cellRadius + 0.8 + hash01(i + 77) * 1.6
  const wobble = 0.25 * Math.sin(t * 0.6 + hash01(i + 55) * 6.28)
  return [dir[0] * (r + wobble), dir[1] * (r + wobble), dir[2] * (r + wobble)]
}
