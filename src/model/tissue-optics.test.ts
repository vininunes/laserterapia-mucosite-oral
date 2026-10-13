import { describe, expect, it } from 'vitest'

import { depthReachedBy, runMonteCarlo } from './monte-carlo'
import { layerCaveats, mucosaLayers, muaBloodMucosa, musPrime, SUBMUCOSA_MODEL_DEPTH_CM, tissueMcConfig } from './tissue-optics'

describe('absorção', () => {
  it('μa do sangue da mucosa confere com a conta à mão', () => {
    // 2,39 mg/mL ÷ 64500 g/mol; S = 0,941; ε(660) = 319,6 / 3226,56
    const molar = 2.39 / 64500
    const expected = 2.303 * molar * (0.941 * 319.6 + 0.059 * 3226.56)
    expect(muaBloodMucosa(660)).toBeCloseTo(expected, 10)
    expect(muaBloodMucosa(660)).toBeCloseTo(0.0419, 4)
  })

  it('com sangue oxigenado, 808 nm é MAIS absorvido que 660 nm', () => {
    // Resultado não óbvio dos dados; a cena precisa explicar a penetração pelo espalhamento.
    expect(muaBloodMucosa(808)).toBeGreaterThan(muaBloodMucosa(660))
  })

  it('o epitélio, avascular, só tem a absorção da água', () => {
    const [epi, lp] = mucosaLayers(660)
    expect(epi.vascular).toBe(false)
    expect(epi.muaPerCm).toBeCloseTo(0.65 * 0.0032, 10)
    expect(lp.muaPerCm).toBeGreaterThan(epi.muaPerCm)
  })
})

describe('espalhamento', () => {
  it("μs' segue o ajuste a(λ/500)^−b", () => {
    expect(musPrime('musp-dermis-a', 'musp-dermis-b', 660)).toBeCloseTo(45.3 * Math.pow(660 / 500, -1.292), 10)
    expect(musPrime('musp-mucous-a', 'musp-mucous-b', 808)).toBeCloseTo(8.6, 1)
  })

  it('o espalhamento cai com o comprimento de onda em todas as camadas', () => {
    const red = mucosaLayers(660)
    const ir = mucosaLayers(808)
    red.forEach((l, i) => expect(ir[i].musPerCm).toBeLessThan(l.musPerCm))
  })

  it('μs = μs\' / (1 − g)', () => {
    for (const l of mucosaLayers(660)) expect(l.musPerCm).toBeCloseTo(l.musPrimePerCm / (1 - l.g), 10)
  })
})

describe('camadas', () => {
  it('espessuras em cm a partir das fontes; submucosa semi-infinita por falta de dado', () => {
    const [epi, lp, sub] = mucosaLayers(660)
    expect(epi.thicknessCm).toBeCloseTo(0.05454)
    expect(lp.thicknessCm).toBeCloseTo(0.015)
    expect(sub.semiInfinite).toBe(true)
    expect(sub.thicknessCm).toBe(SUBMUCOSA_MODEL_DEPTH_CM)
  })

  it('lista pendências e proxies', () => {
    const c = layerCaveats(mucosaLayers(660))
    expect(c.pending).toEqual(['thickness-submucosa'])
    expect(c.proxies).toContain('anisotropy-g')
    expect(c.proxies).toContain('musp-dermis-a')
  })
})

describe('Monte Carlo com os dados da mucosa', () => {
  const run = (nm: 660 | 808) =>
    runMonteCarlo(tissueMcConfig(nm, { photons: 4000, seed: 7, recordPaths: 0, spotRadiusCm: 0.05 }))

  it('808 nm chega mais fundo que 660 nm (mesma seed)', () => {
    expect(depthReachedBy(run(808), 0.1)).toBeGreaterThan(depthReachedBy(run(660), 0.1))
  })

  it('quase nenhum fóton chega ao corte do modelo', () => {
    expect(run(808).transmitted).toBeLessThan(0.01)
  })
})
