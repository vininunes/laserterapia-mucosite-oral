/** Bibliografia centralizada; as cenas referenciam por id. */
export interface Reference {
  id: string
  /** Citação completa no formato ABNT ou Vancouver (a definir pela pesquisa). */
  citation: string
  url?: string
  doi?: string
}

export const references: Record<string, Reference> = {}
