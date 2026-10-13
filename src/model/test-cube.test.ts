import { describe, expect, it } from 'vitest'

import { testCubeModel } from './test-cube'

const params = { rotationSpeed: 0.5, size: 1.2 }

describe('testCubeModel', () => {
  it('é determinístico', () => {
    expect(testCubeModel(3.7, params)).toEqual(testCubeModel(3.7, params))
  })

  it('parte do repouso em t = 0', () => {
    const s = testCubeModel(0, params)
    expect(s.rotationX).toBe(0)
    expect(s.rotationY).toBe(0)
    expect(s.scale).toBeCloseTo(params.size)
  })

  it('gira rotationSpeed voltas por segundo', () => {
    expect(testCubeModel(2, params).rotationY).toBeCloseTo(2 * Math.PI)
    expect(testCubeModel(2, { ...params, rotationSpeed: 1 }).rotationY).toBeCloseTo(4 * Math.PI)
  })
})
