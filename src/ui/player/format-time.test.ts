import { describe, expect, it } from 'vitest'

import { formatTime } from './format-time'

describe('formatTime', () => {
  it('formata minutos, segundos e décimos', () => {
    expect(formatTime(0)).toBe('0:00.0')
    expect(formatTime(3.27)).toBe('0:03.2')
    expect(formatTime(61.5)).toBe('1:01.5')
    expect(formatTime(-2)).toBe('0:00.0')
  })
})
