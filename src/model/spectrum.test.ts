import { describe, expect, it } from 'vitest'

import { INFRARED_DISPLAY, spectralRegion, wavelengthToRgb } from './spectrum'

describe('wavelengthToRgb', () => {
  it('660 nm é vermelho', () => {
    const { color, visible } = wavelengthToRgb(660)
    expect(visible).toBe(true)
    expect(color.r).toBe(1)
    expect(color.g).toBe(0)
    expect(color.b).toBe(0)
  })

  it('450 nm é azul dominante, 550 nm é verde dominante', () => {
    const blue = wavelengthToRgb(450).color
    expect(blue.b).toBeGreaterThan(blue.r)
    expect(blue.b).toBeGreaterThan(blue.g)
    const green = wavelengthToRgb(550).color
    expect(green.g).toBeGreaterThan(green.r)
    expect(green.g).toBeGreaterThan(green.b)
  })

  it('808 nm é invisível e usa a cor de representação', () => {
    expect(wavelengthToRgb(808)).toEqual({ color: INFRARED_DISPLAY, visible: false })
  })

  it('canais ficam em 0–1 em toda a faixa visível', () => {
    for (let nm = 380; nm <= 780; nm += 1) {
      const { color } = wavelengthToRgb(nm)
      for (const c of [color.r, color.g, color.b]) {
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('spectralRegion', () => {
  it('classifica pelas bordas 380 e 780 nm', () => {
    expect(spectralRegion(379)).toBe('ultravioleta')
    expect(spectralRegion(380)).toBe('visível')
    expect(spectralRegion(780)).toBe('visível')
    expect(spectralRegion(781)).toBe('infravermelho')
  })
})
