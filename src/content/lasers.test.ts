import { describe, expect, it } from 'vitest'

import { laserMedium, wavelengthOptionLabel } from './lasers'

describe('laserMedium', () => {
  it('reconhece os três tipos do TCC', () => {
    expect(laserMedium(632.8)).toBe('He-Ne')
    expect(laserMedium(650)).toBe('InGaAlP')
    expect(laserMedium(660)).toBe('InGaAlP')
    expect(laserMedium(808)).toBe('GaAlAs')
  })

  it('fora das faixas não inventa', () => {
    expect(laserMedium(450)).toBeUndefined()
    expect(laserMedium(980)).toBeUndefined()
  })

  it('monta o rótulo com região e meio', () => {
    expect(wavelengthOptionLabel(660)).toBe('660 nm (vermelho, InGaAlP)')
    expect(wavelengthOptionLabel(808)).toBe('808 nm (infravermelho, GaAlAs)')
  })
})
