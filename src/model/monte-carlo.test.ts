import { describe, expect, it } from 'vitest'

import { depthReachedBy, Fate, mulberry32, pathEnd, pathPosition, runMonteCarlo, sampleHgCos, type McConfig } from './monte-carlo'

/**
 * Coeficientes de FIXTURE: números redondos só para testar a física do
 * algoritmo. Não são propriedades de tecido nenhum.
 */
const fixture = (overrides: Partial<McConfig> = {}): McConfig => ({
  layers: [
    { name: 'a', thicknessCm: 0.05, muaPerCm: 1, musPerCm: 100, g: 0.9 },
    { name: 'b', thicknessCm: 0.6, muaPerCm: 1, musPerCm: 100, g: 0.9 },
  ],
  photons: 4000,
  seed: 42,
  recordPaths: 50,
  maxSteps: 400,
  recordEvery: 1,
  maxRecorded: 401,
  spotRadiusCm: 0.1,
  binCm: 0.005,
  ...overrides,
})

describe('mulberry32', () => {
  it('é reproduzível e fica em [0, 1)', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const v = a()
      expect(v).toBe(b())
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('sampleHgCos', () => {
  it('g = 0 é isotrópico; g alto concentra para frente', () => {
    expect(sampleHgCos(0, 0)).toBe(-1)
    expect(sampleHgCos(0, 1)).toBe(1)
    let mean = 0
    const r = mulberry32(1)
    for (let i = 0; i < 20000; i++) mean += sampleHgCos(0.9, r())
    // Para Henyey-Greenstein, <cosθ> = g.
    expect(mean / 20000).toBeCloseTo(0.9, 1)
  })
})

describe('runMonteCarlo', () => {
  it('mesma seed, mesmo resultado; seed diferente, resultado diferente', () => {
    const a = runMonteCarlo(fixture())
    const b = runMonteCarlo(fixture())
    expect(a.paths).toEqual(b.paths)
    expect(a.absorbedByDepth).toEqual(b.absorbedByDepth)
    expect(runMonteCarlo(fixture({ seed: 43 })).remitted).not.toBe(a.remitted)
  })

  it('conserva fótons: absorvidos + remitidos + transmitidos + perdidos = 1', () => {
    const r = runMonteCarlo(fixture())
    const absorbed = r.absorbedByLayer.reduce((s, v) => s + v, 0)
    expect(absorbed + r.remitted + r.transmitted + r.lost).toBeCloseTo(1, 10)
    expect(r.absorbedByDepth.reduce((s, v) => s + v, 0)).toBeCloseTo(absorbed, 10)
  })

  it('sem espalhamento segue Beer-Lambert: T = e^(−μa·d)', () => {
    const r = runMonteCarlo(
      fixture({
        photons: 20000,
        layers: [{ name: 'só absorção', thicknessCm: 0.1, muaPerCm: 10, musPerCm: 1e-9, g: 0 }],
      })
    )
    expect(r.transmitted).toBeCloseTo(Math.exp(-1), 1.5)
    expect(r.remitted).toBe(0)
  })

  it('mais absorção → luz chega menos fundo', () => {
    const low = runMonteCarlo(fixture())
    const high = runMonteCarlo(
      fixture({
        layers: fixture().layers.map((l) => ({ ...l, muaPerCm: l.muaPerCm * 5 })),
      })
    )
    expect(depthReachedBy(high, 0.1)).toBeLessThan(depthReachedBy(low, 0.1))
  })

  it('trajetórias começam na superfície e terminam com o destino registrado', () => {
    const r = runMonteCarlo(fixture())
    for (let i = 0; i < 50; i++) {
      expect(r.paths[i * r.pathStride + 2]).toBe(0)
      expect(r.pathLengths[i]).toBeGreaterThan(1)
      expect([Fate.Absorbed, Fate.Remitted, Fate.Transmitted, Fate.Lost]).toContain(r.fates[i])
    }
  })
})

describe('pathPosition', () => {
  it('interpola entre vértices e termina no fim da trajetória', () => {
    const r = runMonteCarlo(fixture())
    const out: [number, number, number] = [0, 0, 0]
    expect(pathPosition(r, 0, -1, 10, out)).toBe(false)
    expect(pathPosition(r, 0, 0, 10, out)).toBe(true)
    expect(out[2]).toBe(0)
    const end = (r.pathLengths[0] - 1) / 10
    expect(pathPosition(r, 0, end + 0.01, 10, out)).toBe(false)
  })
})

describe('gravação subamostrada', () => {
  it('não muda a estatística, só o que é desenhado', () => {
    const full = runMonteCarlo(fixture())
    const sparse = runMonteCarlo(fixture({ recordEvery: 10, maxRecorded: 20 }))
    expect(sparse.absorbedByDepth).toEqual(full.absorbedByDepth)
    expect(sparse.remitted).toBe(full.remitted)
    for (let i = 0; i < 50; i++) expect(sparse.pathLengths[i]).toBeLessThanOrEqual(20)
  })

  it('o ponto de absorção é gravado quando a trajetória cabe no teto', () => {
    const full = runMonteCarlo(fixture())
    const sparse = runMonteCarlo(fixture({ recordEvery: 7, maxRecorded: 401 }))
    for (let i = 0; i < 50; i++) {
      if (full.fates[i] !== Fate.Absorbed) continue
      const a: [number, number, number] = [0, 0, 0]
      const b: [number, number, number] = [0, 0, 0]
      pathEnd(full, i, a)
      pathEnd(sparse, i, b)
      expect(b).toEqual(a)
    }
  })
})
