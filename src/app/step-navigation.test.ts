import { describe, expect, it } from 'vitest'

import { nextStep, previousStep } from './step-navigation'

// Três cenas: inícios das etapas de cada uma.
const steps = [
  [0, 5, 10],
  [0, 4],
  [0, 3, 6, 9],
]

describe('nextStep', () => {
  it('avança para a próxima etapa da mesma cena', () => {
    expect(nextStep(steps, 0, 0)).toEqual({ scene: 0, t: 5 })
    expect(nextStep(steps, 0, 7)).toEqual({ scene: 0, t: 10 })
  })

  it('na última etapa vai para a primeira etapa da próxima cena', () => {
    expect(nextStep(steps, 0, 10)).toEqual({ scene: 1, t: 0 })
    expect(nextStep(steps, 0, 12)).toEqual({ scene: 1, t: 0 })
  })

  it('na última etapa da última cena não há destino', () => {
    expect(nextStep(steps, 2, 9.5)).toBeNull()
  })
})

describe('previousStep', () => {
  it('volta para a etapa anterior da mesma cena', () => {
    expect(previousStep(steps, 0, 10)).toEqual({ scene: 0, t: 5 })
    expect(previousStep(steps, 0, 7)).toEqual({ scene: 0, t: 0 })
  })

  it('na primeira etapa vai para a última etapa da cena anterior', () => {
    expect(previousStep(steps, 1, 0)).toEqual({ scene: 0, t: 10 })
    expect(previousStep(steps, 2, 2)).toEqual({ scene: 1, t: 4 })
  })

  it('na primeira etapa da primeira cena não há destino', () => {
    expect(previousStep(steps, 0, 3)).toBeNull()
  })
})
