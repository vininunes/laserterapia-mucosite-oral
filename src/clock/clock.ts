/**
 * Relógio da simulação: fonte única de `t` para player e cenas. TypeScript
 * puro — não conhece React, Three.js nem o player. O avanço por frame é feito
 * por quem o dirige (`useClockDriver`), chamando `tick(dtReal)`.
 */

export interface ClockSnapshot {
  /** Tempo na timeline, em segundos. */
  t: number
  playing: boolean
  /** Multiplicador do tempo real. */
  speed: number
  /** Duração total da timeline da cena ativa, em segundos. */
  duration: number
}

export const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8, 16] as const

/** Maior passo aceito por frame: evita um salto após a aba ficar oculta. */
export const MAX_FRAME_DT = 0.1

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/** Avanço puro de um frame. Ao chegar ao fim, para. */
export function advance(s: ClockSnapshot, realDt: number): ClockSnapshot {
  if (!s.playing) return s
  const dt = clamp(realDt, 0, MAX_FRAME_DT)
  const t = Math.min(s.t + dt * s.speed, s.duration)
  return { ...s, t, playing: t < s.duration }
}

function sameSnapshot(a: ClockSnapshot, b: ClockSnapshot) {
  return a.t === b.t && a.playing === b.playing && a.speed === b.speed && a.duration === b.duration
}

export class SimulationClock {
  private snapshot: ClockSnapshot
  private readonly listeners = new Set<() => void>()
  private readonly endListeners = new Set<() => void>()

  constructor(initial: ClockSnapshot) {
    const duration = Math.max(initial.duration, 0)
    this.snapshot = { ...initial, duration, t: clamp(initial.t, 0, duration) }
  }

  getSnapshot = (): ClockSnapshot => this.snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private set(next: ClockSnapshot) {
    if (sameSnapshot(this.snapshot, next)) return
    this.snapshot = next
    this.listeners.forEach((l) => l())
  }

  /**
   * Avisa quando a reprodução chega ao fim da timeline sozinha (pelo `tick`).
   * Pausar, buscar ou trocar de cena não disparam.
   */
  onEnd = (listener: () => void): (() => void) => {
    this.endListeners.add(listener)
    return () => this.endListeners.delete(listener)
  }

  tick(realDt: number) {
    const before = this.snapshot
    const next = advance(before, realDt)
    this.set(next)
    if (before.playing && !next.playing) this.endListeners.forEach((l) => l())
  }

  seek(t: number) {
    this.set({ ...this.snapshot, t: clamp(t, 0, this.snapshot.duration) })
  }

  setPlaying(playing: boolean) {
    const s = this.snapshot
    // Play no fim recomeça do início, como no player do T2S.
    const t = playing && s.t >= s.duration ? 0 : s.t
    this.set({ ...s, t, playing: playing && s.duration > 0 })
  }

  setSpeed(speed: number) {
    if (!(speed > 0)) return
    this.set({ ...this.snapshot, speed })
  }

  /** Troca de cena: nova duração, tempo e estado de reprodução. */
  load(next: Pick<ClockSnapshot, 'duration'> & Partial<Pick<ClockSnapshot, 't' | 'playing'>>) {
    const duration = Math.max(next.duration, 0)
    this.set({
      ...this.snapshot,
      duration,
      t: clamp(next.t ?? 0, 0, duration),
      playing: next.playing ?? false,
    })
  }
}
