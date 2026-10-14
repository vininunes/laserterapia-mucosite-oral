/**
 * Cria o worker do Monte Carlo como arquivo separado (build normal). No build
 * de arquivo único (`yarn build:single`) o Vite troca este módulo pelo
 * `create-mc-worker.inline.ts`, que embute o worker no próprio HTML.
 */
export function createMcWorker(): Worker {
  return new Worker(new URL('../../model/workers/monte-carlo.worker.ts', import.meta.url), { type: 'module' })
}
