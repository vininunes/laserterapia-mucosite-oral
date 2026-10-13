import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from 'react'

import { useFrame } from '@react-three/fiber'

import type { ClockSnapshot, SimulationClock } from './clock'

export const ClockContext = createContext<SimulationClock | null>(null)

export function useClock(): SimulationClock {
  const clock = useContext(ClockContext)
  if (!clock) throw new Error('useClock precisa de um ClockContext')
  return clock
}

/**
 * Assina um valor derivado do relógio. O componente só re-renderiza quando o
 * valor selecionado muda — use seletores que devolvem primitivos.
 */
export function useClockValue<T>(selector: (s: ClockSnapshot) => T): T {
  const clock = useClock()
  return useSyncExternalStore(clock.subscribe, () => selector(clock.getSnapshot()))
}

/**
 * Dirige o relógio com `requestAnimationFrame` enquanto estiver tocando.
 * Montar uma vez, no topo da aplicação. Aba oculta não avança.
 */
export function useClockDriver(clock: SimulationClock) {
  const playing = useSyncExternalStore(clock.subscribe, () => clock.getSnapshot().playing)

  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!document.hidden) clock.tick(dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [clock, playing])
}

/**
 * Ponte player ↔ relógio: devolve exatamente o que o `Player` espera. O
 * player não conhece o relógio; as cenas não conhecem o player.
 */
export function useSimulationClock() {
  const clock = useClock()
  const t = useClockValue((s) => s.t)
  const playing = useClockValue((s) => s.playing)
  const speed = useClockValue((s) => s.speed)
  const duration = useClockValue((s) => s.duration)

  const onSeek = useCallback((next: number) => clock.seek(next), [clock])
  const onPlayingChange = useCallback((next: boolean) => clock.setPlaying(next), [clock])
  const onSpeedChange = useCallback((next: number) => clock.setSpeed(next), [clock])

  return { t, playing, speed, duration, onSeek, onPlayingChange, onSpeedChange }
}

/**
 * Para componentes R3F: chama `callback(t)` a cada frame renderizado, sem
 * re-render React. Com `frameloop="demand"`, frames só acontecem quando o
 * relógio muda (ver `ClockInvalidator`).
 */
export function useClockFrame(callback: (t: number) => void) {
  const clock = useClock()
  useFrame(() => callback(clock.getSnapshot().t))
}
