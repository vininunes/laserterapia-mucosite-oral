import { describe, expect, it } from 'vitest'

import { frequencyHz, photonEnergyEv, photonEnergyJ } from './photon'

describe('fóton', () => {
  it('energia em eV bate com hc ≈ 1239,84 eV·nm', () => {
    expect(photonEnergyEv(660)).toBeCloseTo(1239.84198 / 660, 5)
    expect(photonEnergyEv(808)).toBeCloseTo(1239.84198 / 808, 5)
  })

  it('660 nm ≈ 1,88 eV e 808 nm ≈ 1,53 eV', () => {
    expect(photonEnergyEv(660)).toBeCloseTo(1.8786, 3)
    expect(photonEnergyEv(808)).toBeCloseTo(1.5345, 3)
  })

  it('frequência de 660 nm ≈ 454 THz', () => {
    expect(frequencyHz(660) / 1e12).toBeCloseTo(454.23, 1)
  })

  it('E = h·f', () => {
    expect(photonEnergyJ(808)).toBeCloseTo(6.62607015e-34 * frequencyHz(808), 40)
  })

  it('λ maior → fóton menos energético', () => {
    expect(photonEnergyEv(808)).toBeLessThan(photonEnergyEv(660))
  })
})
