import { describe, expect, it } from 'vitest'

import { scenes } from '../../scenes/registry'

describe('roteiros', () => {
  for (const { script } of scenes) {
    it(`${script.id}: etapas ordenadas e dentro da duração`, () => {
      const times = script.steps.map((s) => s.t)
      expect(times).toEqual([...times].sort((a, b) => a - b))
      expect(new Set(times).size).toBe(times.length)
      for (const t of times) {
        expect(t).toBeGreaterThanOrEqual(0)
        expect(t).toBeLessThan(script.duration)
      }
    })

    it(`${script.id}: padrões respeitam os controles`, () => {
      for (const c of script.controls) {
        const v = script.defaults[c.key]
        expect(v, c.key).toBeDefined()
        if (c.kind === 'slider') {
          expect(v).toBeGreaterThanOrEqual(c.min)
          expect(v).toBeLessThanOrEqual(c.max)
        } else if (c.kind === 'select') {
          expect(c.options.map((o) => o.value)).toContain(v)
        } else {
          expect([0, 1]).toContain(v)
        }
      }
    })
  }
})
