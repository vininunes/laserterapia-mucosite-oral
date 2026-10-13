import { describe, expect, it } from 'vitest'

import { protocols } from './protocols'
import { references } from './references'

describe('protocols', () => {
  it('todo protocolo tem fonte cadastrada', () => {
    for (const p of protocols) expect(references[p.source], p.id).toBeDefined()
  })

  it('ids únicos e valores positivos', () => {
    expect(new Set(protocols.map((p) => p.id)).size).toBe(protocols.length)
    for (const p of protocols) {
      for (const v of [p.wavelengthNm, p.irradianceMwCm2, p.timePerPointS, p.reportedFluenceJcm2, p.spotCm2]) {
        expect(v, p.id).toBeGreaterThan(0)
      }
      expect(p.points[0]).toBeLessThanOrEqual(p.points[1])
    }
  })

  it('todos os protocolos recomendados usam luz vermelha', () => {
    for (const p of protocols) {
      expect(p.wavelengthNm).toBeGreaterThanOrEqual(632.8)
      expect(p.wavelengthNm).toBeLessThanOrEqual(660)
    }
  })
})
