import { describe, expect, it } from 'vitest'

import { formatLength, niceScale } from './scale'

describe('niceScale', () => {
  it('escolhe 1, 2 ou 5 × 10ⁿ que caiba no tamanho máximo', () => {
    // 1 mm = 30 px → até 96 px cabem 3,2 mm → 2 mm (60 px).
    expect(niceScale(30_000, 96)).toEqual({ meters: 0.002, px: 60 })
    // 1 cm = 50 px → até 96 px cabem 1,92 cm → 1 cm (50 px).
    expect(niceScale(5_000, 96)?.meters).toBeCloseTo(0.01)
    // 1 µm = 20 px → até 96 px cabem 4,8 µm → 2 µm.
    expect(niceScale(2e7, 96)?.meters).toBeCloseTo(2e-6)
  })

  it('a barra nunca passa do máximo nem fica menor que 1/5 dele', () => {
    for (const ppm of [1e3, 3.3e3, 7.7e4, 1.2e6, 9e8]) {
      const s = niceScale(ppm, 96)!
      expect(s.px).toBeLessThanOrEqual(96 + 1e-6)
      expect(s.px).toBeGreaterThan(96 / 5)
    }
  })

  it('sem medida válida, nada', () => {
    expect(niceScale(0)).toBeNull()
  })
})

describe('formatLength', () => {
  it('usa a unidade adequada', () => {
    expect(formatLength(0.02)).toBe('2 cm')
    expect(formatLength(0.005)).toBe('5 mm')
    expect(formatLength(0.0005)).toBe('500 µm')
    expect(formatLength(5e-7)).toBe('500 nm')
  })
})
