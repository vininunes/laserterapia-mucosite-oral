import { describe, expect, it } from 'vitest'

import { atpParticle, CELL_LAYOUT, cellModel, hash01, MEDIATOR_FLOOR, mediatorParticle, noParticle } from './cell'

const timing = { photon: 4, absorb: 9, atp: 13, signals: 19, inflammation: 25, tissue: 32 }
const input = { wavelengthNm: 660, timing }

describe('cellModel', () => {
  it('é determinístico', () => {
    expect(cellModel(17.2, input)).toEqual(cellModel(17.2, input))
  })

  it('o fóton sai de fora e chega à citocromo c oxidase na absorção', () => {
    expect(cellModel(timing.photon - 1, input).photon.opacity).toBe(0)
    expect(cellModel(timing.photon, input).photon.position).toEqual(CELL_LAYOUT.photonFrom)
    const before = cellModel(timing.absorb - 1e-6, input).photon.position
    before.forEach((v, i) => expect(v).toBeCloseTo(CELL_LAYOUT.cco[i], 3))
    expect(cellModel(timing.absorb, input).photon.opacity).toBe(0)
  })

  it('a enzima só brilha depois da absorção', () => {
    expect(cellModel(timing.absorb - 0.1, input).ccoGlow).toBe(0)
    expect(cellModel(timing.absorb, input).ccoGlow).toBe(1)
  })

  it('ATP extra entra depois de timing.atp', () => {
    expect(cellModel(timing.atp, input).atpBoost).toBe(0)
    expect(cellModel(timing.atp + 3, input).atpBoost).toBe(1)
  })

  it('mediadores inflamatórios diminuem até o piso, sem sumir', () => {
    expect(cellModel(timing.inflammation, input).mediators).toBe(1)
    expect(cellModel(100, input).mediators).toBeCloseTo(MEDIATOR_FLOOR)
  })
})

describe('partículas', () => {
  it('hash01 fica em [0, 1)', () => {
    for (let i = 0; i < 1000; i++) {
      const v = hash01(i)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('ATP extra invisível sem a PBM, visível com ela', () => {
    const extra = CELL_LAYOUT.atpBase + 3
    expect(atpParticle(extra, 5, 0).opacity).toBe(0)
    // Em algum instante do ciclo a partícula aparece.
    const seen = Array.from({ length: 40 }, (_, k) => atpParticle(extra, k * 0.1, 1).opacity)
    expect(Math.max(...seen)).toBeGreaterThan(0.5)
  })

  it('NO só aparece depois da absorção', () => {
    expect(noParticle(0, 8, 9).opacity).toBe(0)
    expect(noParticle(0, 9.5, 9).opacity).toBeGreaterThan(0)
  })

  it('mediadores ficam fora da célula', () => {
    for (let i = 0; i < CELL_LAYOUT.mediatorCount; i++) {
      const [x, y, z] = mediatorParticle(i, 3)
      expect(Math.hypot(x, y, z)).toBeGreaterThan(CELL_LAYOUT.cellRadius)
    }
  })
})
