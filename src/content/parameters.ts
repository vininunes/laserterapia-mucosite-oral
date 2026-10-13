/**
 * Parâmetros científicos usados pelas cenas. Regra do projeto: nenhum valor
 * sem fonte. Sem fonte confirmada, `value: null` e `source: 'TODO'` — a UI
 * mostra o parâmetro como pendente.
 */
export interface ScientificParameter {
  id: string
  label: string
  value: number | null
  unit: string
  /** Id de `references.ts`, ou 'TODO' enquanto não houver fonte confirmada. */
  source: string
  note?: string
}

export const parameters = {
  planck: {
    id: 'planck',
    label: 'Constante de Planck (h)',
    value: 6.62607015e-34,
    unit: 'J·s',
    source: 'bipm-si-2019',
    note: 'Valor exato por definição do SI.',
  },
  'speed-of-light': {
    id: 'speed-of-light',
    label: 'Velocidade da luz no vácuo (c)',
    value: 299_792_458,
    unit: 'm/s',
    source: 'bipm-si-2019',
    note: 'Valor exato por definição do SI.',
  },
  'elementary-charge': {
    id: 'elementary-charge',
    label: 'Carga elementar (e)',
    value: 1.602176634e-19,
    unit: 'C',
    source: 'bipm-si-2019',
    note: 'Valor exato por definição do SI. Usada para converter J em eV.',
  },
} satisfies Record<string, ScientificParameter>

export type ParameterId = keyof typeof parameters

export function isPending(p: ScientificParameter): boolean {
  return p.value === null || p.source === 'TODO'
}

/**
 * Valor de um parâmetro que o modelo não pode calcular sem. Lança erro se
 * estiver pendente — o modelo nunca inventa um valor substituto.
 */
export function requireParameter(id: ParameterId): number {
  const p: ScientificParameter = parameters[id]
  if (isPending(p) || p.value === null) throw new Error(`Parâmetro pendente: ${id}`)
  return p.value
}
