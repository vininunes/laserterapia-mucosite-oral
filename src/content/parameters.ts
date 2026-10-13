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

export const parameters: Record<string, ScientificParameter> = {}

export function isPending(p: ScientificParameter): boolean {
  return p.value === null || p.source === 'TODO'
}
