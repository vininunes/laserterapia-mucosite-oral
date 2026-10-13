import { describe, expect, it } from 'vitest'

import { decodeHashState, encodeHashState, sanitizeParams } from './hash-state'

describe('hash da URL', () => {
  it('faz ida e volta', () => {
    const state = { scene: 'teste', t: 3.256, speed: 0.5, params: { size: 1.2, rotationSpeed: 0.5 } }
    const hash = encodeHashState(state)
    expect(hash).toBe('#cena=teste&t=3.26&v=0.5&p.rotationSpeed=0.5&p.size=1.2')
    expect(decodeHashState(hash)).toEqual({ ...state, t: 3.26 })
  })

  it('ignora lixo', () => {
    expect(decodeHashState('#t=abc&v=-1&p.size=&p.x=nope&outro=1')).toEqual({ params: {} })
    expect(decodeHashState('')).toEqual({ params: {} })
  })
})

describe('sanitizeParams', () => {
  const defaults = { size: 1, mode: 660 }
  const bounds = [
    { key: 'size', min: 0.5, max: 2 },
    { key: 'mode', options: [660, 808] },
  ]

  it('limita à faixa e descarta chaves desconhecidas', () => {
    expect(sanitizeParams(defaults, bounds, { size: 9, intruso: 1 })).toEqual({ size: 2, mode: 660 })
  })

  it('rejeita valor fora das opções', () => {
    expect(sanitizeParams(defaults, bounds, { mode: 700 })).toEqual(defaults)
    expect(sanitizeParams(defaults, bounds, { mode: 808 })).toEqual({ size: 1, mode: 808 })
  })
})
