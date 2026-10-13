import { useEffect, useRef, useState } from 'react'

import type { McConfig, McResult } from '../../model/monte-carlo'
import type { McRequest, McResponse } from '../../model/workers/monte-carlo.worker'

export interface McState {
  /** Último resultado pronto (continua visível enquanto um novo é calculado). */
  result: McResult | null
  computing: boolean
  elapsedMs: number | null
}

/**
 * Calcula o Monte Carlo no Web Worker sempre que a configuração muda. A UI
 * não trava; respostas atrasadas de configurações antigas são descartadas.
 * `config` nulo = não calcular (ex.: parâmetros pendentes).
 */
export function useMonteCarlo(config: McConfig | null): McState {
  const workerRef = useRef<Worker | null>(null)
  const lastId = useRef(0)
  const [state, setState] = useState<McState>({ result: null, computing: false, elapsedMs: null })

  useEffect(() => {
    const worker = new Worker(new URL('../../model/workers/monte-carlo.worker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker
    worker.onmessage = (event: MessageEvent<McResponse>) => {
      if (event.data.id !== lastId.current) return
      setState({ result: event.data.result, computing: false, elapsedMs: event.data.elapsedMs })
    }
    return () => {
      worker.terminate()
      workerRef.current = null
    }
  }, [])

  const key = config ? JSON.stringify(config) : null
  useEffect(() => {
    const worker = workerRef.current
    if (!worker || !key) return
    const id = ++lastId.current
    setState((s) => ({ ...s, computing: true }))
    const request: McRequest = { id, config: JSON.parse(key) as McConfig }
    worker.postMessage(request)
  }, [key])

  return state
}
