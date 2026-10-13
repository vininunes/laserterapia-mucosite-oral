/**
 * Estado compartilhável serializado no hash da URL:
 *   #cena=teste&t=3.25&v=1&p.rotationSpeed=0.5&p.size=1.2
 * Funções puras; a sincronização com `window.location` fica em `use-hash-sync`.
 */

export type NumericParams = Record<string, number>

export interface HashState {
  scene: string
  t: number
  speed: number
  params: NumericParams
}

const PARAM_PREFIX = 'p.'

/** Arredonda para não poluir a URL com ruído de ponto flutuante. */
function fmt(n: number, digits: number) {
  return String(Number(n.toFixed(digits)))
}

export function encodeHashState(state: HashState): string {
  const q = new URLSearchParams()
  q.set('cena', state.scene)
  q.set('t', fmt(state.t, 2))
  q.set('v', fmt(state.speed, 2))
  for (const key of Object.keys(state.params).sort()) {
    q.set(PARAM_PREFIX + key, fmt(state.params[key], 4))
  }
  return '#' + q.toString()
}

/** Leitura crua e tolerante: campos ausentes ou não numéricos ficam de fora. */
export function decodeHashState(hash: string): Partial<HashState> & { params: NumericParams } {
  const q = new URLSearchParams(hash.replace(/^#/, ''))
  const out: Partial<HashState> & { params: NumericParams } = { params: {} }

  const scene = q.get('cena')
  if (scene) out.scene = scene

  const t = Number(q.get('t'))
  if (q.has('t') && Number.isFinite(t)) out.t = t

  const speed = Number(q.get('v'))
  if (q.has('v') && Number.isFinite(speed) && speed > 0) out.speed = speed

  q.forEach((value, key) => {
    if (!key.startsWith(PARAM_PREFIX)) return
    const n = Number(value)
    if (value !== '' && Number.isFinite(n)) out.params[key.slice(PARAM_PREFIX.length)] = n
  })

  return out
}

export interface ParamBounds {
  key: string
  min?: number
  max?: number
  /** Valores aceitos (selects e toggles). */
  options?: readonly number[]
}

/**
 * Valida parâmetros vindos da URL contra os controles da cena: chaves
 * desconhecidas são descartadas, números fora da faixa são limitados e
 * valores fora das opções voltam ao padrão.
 */
export function sanitizeParams<P extends NumericParams>(
  defaults: P,
  bounds: readonly ParamBounds[],
  raw: NumericParams
): P {
  const out: NumericParams = { ...defaults }
  for (const b of bounds) {
    if (!(b.key in raw)) continue
    let v = raw[b.key]
    if (b.options) {
      if (!b.options.includes(v)) continue
    } else {
      if (b.min !== undefined) v = Math.max(v, b.min)
      if (b.max !== undefined) v = Math.min(v, b.max)
    }
    out[b.key] = v
  }
  return out as P
}
