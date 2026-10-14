import McWorker from '../../model/workers/monte-carlo.worker.ts?worker&inline'

/**
 * Variante do build de arquivo único: o worker vai embutido no HTML (blob),
 * porque um `index.html` aberto como arquivo não carrega `assets/` separados.
 */
export function createMcWorker(): Worker {
  return new McWorker()
}
