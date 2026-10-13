import { describe, expect, it } from 'vitest'

import type { SceneDefinition } from '../scenes/types'
import { resolveHashState } from './initial-state'

const scene = (id: string): SceneDefinition => ({
  script: {
    id,
    title: id,
    shortTitle: id,
    duration: 10,
    defaults: { a: 1 },
    controls: [{ kind: 'slider', key: 'a', label: 'a', min: 0, max: 2, step: 0.1 }],
    steps: [],
    references: [],
  },
  Component: () => null,
})

const scenes = [scene('x'), scene('y')]

describe('resolveHashState', () => {
  it('restaura cena, tempo e parâmetros válidos', () => {
    const r = resolveHashState({ scene: 'y', t: 4, speed: 2, params: { a: 5 } }, scenes)
    expect(r.scene.script.id).toBe('y')
    expect(r).toMatchObject({ t: 4, speed: 2, params: { a: 2 } })
  })

  it('cai na primeira cena com padrões quando a cena não existe', () => {
    const r = resolveHashState({ scene: 'z', t: 4, params: { a: 0.5 } }, scenes)
    expect(r.scene.script.id).toBe('x')
    expect(r).toMatchObject({ t: 0, params: { a: 1 } })
  })

  it('limita o tempo à duração', () => {
    expect(resolveHashState({ scene: 'x', t: 99, params: {} }, scenes).t).toBe(10)
  })
})
