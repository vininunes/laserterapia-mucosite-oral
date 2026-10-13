import { describe, expect, it } from 'vitest'

import { formatCompact, formatDuration, formatNumber, formatRange, formatScientific } from './format-number'

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

describe('formatDuration, formatRange e formatCompact', () => {
  it('formata durações', () => {
    expect(formatDuration(40)).toBe('40 s')
    expect(formatDuration(720)).toBe('12 min')
    expect(formatDuration(108)).toBe('1 min 48 s')
  })

  it('formata faixas', () => {
    expect(formatRange([18, 18], String)).toBe('18')
    expect(formatRange([54, 70], String)).toBe('54 a 70')
  })

  it('formatCompact', () => {
    expect(formatCompact(632.8)).toBe('632,8')
    expect(formatCompact(0.04)).toBe('0,04')
    expect(formatCompact(1000)).toBe('1.000')
  })
})
