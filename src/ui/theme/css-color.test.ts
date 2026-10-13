import { describe, expect, it } from 'vitest'

import { flatten, parseCssColor, toHex } from './css-color'

describe('parseCssColor', () => {
  it('lê os formatos dos tokens', () => {
    expect(parseCssColor('rgba(37, 99, 235, 1)')).toEqual({ r: 37 / 255, g: 99 / 255, b: 235 / 255, a: 1 })
    expect(parseCssColor(' rgb(255 255 255 / 0.5) ')?.a).toBe(0.5)
    expect(parseCssColor('#fff')).toEqual({ r: 1, g: 1, b: 1, a: 1 })
    expect(parseCssColor('#3d5050b3')?.a).toBeCloseTo(0.7, 2)
    expect(parseCssColor('transparent')?.a).toBe(0)
  })

  it('devolve null para formato desconhecido', () => {
    expect(parseCssColor('oklch(0.5 0.1 200)')).toBeNull()
    expect(parseCssColor('#12')).toBeNull()
    expect(parseCssColor('')).toBeNull()
  })
})

describe('flatten e toHex', () => {
  it('compõe sobre o fundo', () => {
    const white = { r: 1, g: 1, b: 1, a: 1 }
    const halfBlack = { r: 0, g: 0, b: 0, a: 0.5 }
    expect(toHex(flatten(halfBlack, white))).toBe('#808080')
  })
})
