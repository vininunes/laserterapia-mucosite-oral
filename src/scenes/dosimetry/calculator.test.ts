import { describe, expect, it } from 'vitest'

import { protocols } from '../../content/protocols'
import { calculatorScript } from '../../content/scenes/calculator'
import { matchingProtocol } from './calculator'

describe('calculadora', () => {
  it('cada preset reproduz exatamente o seu protocolo', () => {
    const presets = calculatorScript.controls.find((c) => c.kind === 'presets')
    if (presets?.kind !== 'presets') throw new Error('sem presets')
    presets.options.forEach((o, i) => {
      const params = { ...calculatorScript.defaults, ...o.values }
      expect(matchingProtocol(params)?.id).toBe(protocols[i].id)
    })
  })

  it('ajustes livres não correspondem a protocolo', () => {
    expect(matchingProtocol({ wavelengthNm: 660, powerMw: 123, timeS: 7, areaCm2: 0.5 })).toBeUndefined()
  })
})
