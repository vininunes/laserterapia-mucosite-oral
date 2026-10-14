import { describe, expect, it } from 'vitest'

import { activeStepIndex, cameraAt, type TimedStep } from './timeline'

const steps = [
  { t: 0, camera: { position: [0, 0, 10] as [number, number, number], target: [0, 0, 0] as [number, number, number] } },
  { t: 4 },
  { t: 8, camera: { position: [10, 0, 0] as [number, number, number], target: [0, 1, 0] as [number, number, number] } },
]

describe('activeStepIndex', () => {
  it('escolhe a última etapa já iniciada', () => {
    expect(activeStepIndex(steps, 0)).toBe(0)
    expect(activeStepIndex(steps, 3.99)).toBe(0)
    expect(activeStepIndex(steps, 4)).toBe(1)
    expect(activeStepIndex(steps, 100)).toBe(2)
  })

  it('devolve 0 antes da primeira etapa', () => {
    expect(activeStepIndex([{ t: 2 }], 1)).toBe(0)
  })
})

describe('cameraAt', () => {
  it('segura as pontas', () => {
    expect(cameraAt(steps, -1)?.position).toEqual([0, 0, 10])
    expect(cameraAt(steps, 20)?.position).toEqual([10, 0, 0])
  })

  it('interpola no meio do trecho, ignorando etapas sem câmera', () => {
    const mid = cameraAt(steps, 4)!
    expect(mid.position[0]).toBeCloseTo(5)
    expect(mid.position[2]).toBeCloseTo(5)
    expect(mid.target[1]).toBeCloseTo(0.5)
  })

  it('usa o keyframe compacto quando pedido, e o normal nas etapas sem ele', () => {
    const compactSteps: TimedStep[] = [
      { t: 0, camera: { position: [0, 0, 10], target: [0, 0, 0] } },
      {
        t: 10,
        camera: { position: [10, 0, 0], target: [0, 0, 0] },
        cameraCompact: { position: [20, 0, 0], target: [1, 0, 0] },
      },
    ]
    expect(cameraAt(compactSteps, 10)?.position).toEqual([10, 0, 0])
    expect(cameraAt(compactSteps, 10, true)?.position).toEqual([20, 0, 0])
    expect(cameraAt(compactSteps, 0, true)?.position).toEqual([0, 0, 10])
  })

  it('devolve undefined sem keyframes', () => {
    expect(cameraAt([{ t: 0 }], 1)).toBeUndefined()
  })
})
