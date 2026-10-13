import { describe, expect, it } from 'vitest'

import { scenes } from '../../scenes/registry'
import { references } from '../references'
import { isKeyed } from '../types'

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
      for (const c of script.controls.filter(isKeyed)) {
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

describe('presets', () => {
  for (const { script } of scenes) {
    for (const c of script.controls) {
      if (c.kind !== 'presets') continue
      it(`${script.id}: presets só usam parâmetros existentes e dentro da faixa`, () => {
        const keyed = new Map(script.controls.filter(isKeyed).map((k) => [k.key, k]))
        for (const o of c.options) {
          for (const [key, v] of Object.entries(o.values)) {
            const k = keyed.get(key)
            expect(k, `${o.label} → ${key}`).toBeDefined()
            if (k?.kind === 'slider') {
              expect(v).toBeGreaterThanOrEqual(k.min)
              expect(v).toBeLessThanOrEqual(k.max)
            } else if (k?.kind === 'select') {
              expect(k.options.map((x) => x.value)).toContain(v)
            }
          }
        }
      })
    }
  }
})

describe('referências dos roteiros', () => {
  for (const { script } of scenes) {
    it(`${script.id}: cita só referências cadastradas`, () => {
      for (const id of script.references) expect(references[id], id).toBeDefined()
    })
  }
})
