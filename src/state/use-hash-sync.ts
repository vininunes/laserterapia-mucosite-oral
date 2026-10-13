import { useEffect, useRef } from 'react'

import type { SimulationClock } from '../clock/clock'
import { decodeHashState, encodeHashState, type HashState, type NumericParams } from './hash-state'

/**
 * Intervalo mínimo entre escritas no hash. O Safari recusa mais de 100
 * `replaceState` em 30 s; 500 ms fica em 60.
 */
const WRITE_INTERVAL_MS = 500

function writeHash(hash: string) {
  if (hash === window.location.hash) return
  try {
    history.replaceState(history.state, '', hash)
  } catch {
    // Limite de chamadas do navegador: a próxima escrita tenta de novo.
  }
}

interface HashSyncOptions {
  clock: SimulationClock
  scene: string
  params: NumericParams
  /** Hash editado à mão ou colado na mesma aba. */
  onExternalChange(state: ReturnType<typeof decodeHashState>): void
}

/** Mantém o hash da URL em dia com cena, parâmetros, tempo e velocidade. */
export function useHashSync({ clock, scene, params, onExternalChange }: HashSyncOptions) {
  const lastWritten = useRef('')
  const onExternal = useRef(onExternalChange)
  onExternal.current = onExternalChange

  useEffect(() => {
    let timer: number | undefined

    const write = () => {
      timer = undefined
      const s = clock.getSnapshot()
      const state: HashState = { scene, t: s.t, speed: s.speed, params }
      lastWritten.current = encodeHashState(state)
      writeHash(lastWritten.current)
    }
    const schedule = () => {
      if (timer === undefined) timer = window.setTimeout(write, WRITE_INTERVAL_MS)
    }

    write()
    const unsubscribe = clock.subscribe(schedule)
    window.addEventListener('pagehide', write)
    return () => {
      unsubscribe()
      window.removeEventListener('pagehide', write)
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [clock, scene, params])

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === lastWritten.current) return
      onExternal.current(decodeHashState(window.location.hash))
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
}
