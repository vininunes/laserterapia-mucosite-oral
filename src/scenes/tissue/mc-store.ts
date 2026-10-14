import { useEffect, useRef, useSyncExternalStore } from 'react'

import type { McConfig, McResult } from '../../model/monte-carlo'
import type { McRequest, McResponse } from '../../model/workers/monte-carlo.worker'
import { createMcWorker } from './create-mc-worker'

export interface McRun {
  key: string
  computing: boolean
  result: McResult | null
  elapsedMs: number | null
}

/** Quantos resultados guardar (cada um tem alguns MB de trajetórias). */
const CACHE_SIZE = 6

/**
 * Resultados do Monte Carlo compartilhados entre a cena 3D e o painel:
 * cada configuração é calculada uma vez, no Web Worker, e fica em cache.
 */
class McStore {
  private worker: Worker | null = null
  private readonly runs = new Map<string, McRun>()
  private readonly ids = new Map<number, string>()
  private readonly listeners = new Set<() => void>()
  private nextId = 0

  subscribe = (l: () => void) => {
    this.listeners.add(l)
    return () => this.listeners.delete(l)
  }

  get(key: string): McRun | undefined {
    return this.runs.get(key)
  }

  request(key: string, config: McConfig) {
    if (this.runs.has(key)) return
    const worker = this.ensureWorker()
    const id = ++this.nextId
    this.ids.set(id, key)
    this.runs.set(key, { key, computing: true, result: null, elapsedMs: null })
    this.evict()
    const message: McRequest = { id, config }
    worker.postMessage(message)
    this.emit()
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker
    const worker = createMcWorker()
    worker.onmessage = (event: MessageEvent<McResponse>) => {
      const key = this.ids.get(event.data.id)
      this.ids.delete(event.data.id)
      if (!key || !this.runs.has(key)) return
      this.runs.set(key, { key, computing: false, result: event.data.result, elapsedMs: event.data.elapsedMs })
      this.emit()
    }
    this.worker = worker
    return worker
  }

  private evict() {
    while (this.runs.size > CACHE_SIZE) {
      const oldest = this.runs.keys().next().value
      if (oldest === undefined) break
      this.runs.delete(oldest)
    }
  }

  private emit() {
    this.listeners.forEach((l) => l())
  }
}

const store = new McStore()

/**
 * Resultado para `config`. Enquanto uma configuração nova é calculada,
 * devolve o último resultado pronto deste consumidor (a cena não pisca) com
 * `computing: true`. `null` = não calcular.
 */
export function useMcRun(config: McConfig | null): McRun | null {
  const key = config ? JSON.stringify(config) : null

  useEffect(() => {
    if (key && config) store.request(key, config)
    // `config` muda de identidade a cada render; `key` resume o conteúdo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const run = useSyncExternalStore(store.subscribe, () => (key ? store.get(key) : undefined))
  const lastDone = useRef<McRun | null>(null)
  if (run?.result) lastDone.current = run
  if (!key) return null
  if (run?.result) return run
  return lastDone.current ? { ...lastDone.current, computing: true } : (run ?? { key, computing: true, result: null, elapsedMs: null })
}
