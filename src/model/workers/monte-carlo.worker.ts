/// <reference lib="webworker" />
import { runMonteCarlo, type McConfig, type McResult } from '../monte-carlo'

export interface McRequest {
  id: number
  config: McConfig
}

export interface McResponse {
  id: number
  result: McResult
  elapsedMs: number
}

/** Roda o Monte Carlo fora da thread da UI e devolve os buffers por transferência. */
self.onmessage = (event: MessageEvent<McRequest>) => {
  const { id, config } = event.data
  const start = performance.now()
  const result = runMonteCarlo(config)
  const response: McResponse = { id, result, elapsedMs: performance.now() - start }
  const transfer = [
    result.paths.buffer,
    result.pathLengths.buffer,
    result.fates.buffer,
    result.absorbedByLayer.buffer,
    result.absorbedByDepth.buffer,
    result.reachedDepth.buffer,
  ]
  ;(self as unknown as DedicatedWorkerGlobalScope).postMessage(response, transfer as Transferable[])
}
