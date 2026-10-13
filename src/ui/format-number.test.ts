import { describe, expect, it } from 'vitest'

import { formatNumber, formatScientific } from './format-number'

describe('formatNumber', () => {
  it('usa vírgula decimal', () => {
    expect(formatNumber(1.8786, 2)).toBe('1,88')
    expect(formatNumber(454.23, 0)).toBe('454')
  })
})

describe('formatScientific', () => {
  it('formata com expoente sobrescrito', () => {
    expect(formatScientific(3.0098e-19)).toBe('3,01 × 10⁻¹⁹')
    expect(formatScientific(4.5423e14, 1)).toBe('4,5 × 10¹⁴')
  })

  it('normaliza mantissa arredondada para 10', () => {
    expect(formatScientific(9.999e-5)).toBe('1,00 × 10⁻⁴')
  })
})
