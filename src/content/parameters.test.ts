import { describe, expect, it } from 'vitest'

import { parameters, type ScientificParameter } from './parameters'
import { references } from './references'

describe('parameters', () => {
  const all: ScientificParameter[] = Object.values(parameters)

  it('todo parâmetro com valor tem fonte cadastrada', () => {
    for (const p of all) {
      if (p.value === null) {
        expect(p.source, p.id).toBe('TODO')
      } else {
        expect(references[p.source], `${p.id} → ${p.source}`).toBeDefined()
      }
    }
  })

  it('o id da chave bate com o campo id', () => {
    for (const [key, p] of Object.entries(parameters)) expect(p.id).toBe(key)
  })
})
