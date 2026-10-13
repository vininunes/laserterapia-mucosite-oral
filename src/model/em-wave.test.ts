import { describe, expect, it } from 'vitest'

import { EM_SPAN, EM_VISUAL, emWaveModel, fieldAt, sampleField, visualWavelength } from './em-wave'

const timing = { bField: 6, ruler: 12, photon: 18, compare: 24 }
const input = { wavelengthA: 660, wavelengthB: 808, compare: 1, showB: 1, timing }

describe('emWaveModel', () => {
  it('é determinístico', () => {
    expect(emWaveModel(17.3, input)).toEqual(emWaveModel(17.3, input))
  })

  it('em t = 0 só existe a fonte: frente da onda em xMin e B oculto', () => {
    const s = emWaveModel(0, input)
    expect(s.waves[0].front).toBe(EM_VISUAL.xMin)
    expect(s.waves[0].bOpacity).toBe(0)
    expect(s.waves[1].opacity).toBe(0)
  })

  it('a frente anda na velocidade visual e para no fim do eixo', () => {
    expect(emWaveModel(2, input).waves[0].front).toBeCloseTo(EM_VISUAL.xMin + 2 * EM_VISUAL.speed)
    expect(emWaveModel(100, input).waves[0].front).toBe(EM_VISUAL.xMax)
  })

  it('B entra no roteiro e respeita o toggle', () => {
    expect(emWaveModel(timing.bField + EM_VISUAL.fade, input).waves[0].bOpacity).toBe(1)
    expect(emWaveModel(30, { ...input, showB: 0 }).waves[0].bOpacity).toBe(0)
  })

  it('comparação separa as faixas e liga o laser B só a partir de timing.compare', () => {
    const before = emWaveModel(timing.compare - 1, input)
    expect(before.waves[0].laneY).toBe(0)
    expect(before.waves[1].opacity).toBe(0)

    const after = emWaveModel(timing.compare + EM_VISUAL.fade, input)
    expect(after.waves[0].laneY).toBe(EM_VISUAL.laneOffset)
    expect(after.waves[1].laneY).toBe(-EM_VISUAL.laneOffset)
    expect(after.waves[1].opacity).toBe(1)
    expect(after.waves[1].front).toBeCloseTo(EM_VISUAL.xMin + EM_VISUAL.fade * EM_VISUAL.speed)

    expect(emWaveModel(30, { ...input, compare: 0 }).waves[1].opacity).toBe(0)
  })

  it('λ visual é proporcional ao real e as duas ondas viajam à mesma velocidade', () => {
    const s = emWaveModel(30, input)
    expect(s.waves[1].lambda / s.waves[0].lambda).toBeCloseTo(808 / 660)
    expect(s.waves[0].omega / s.waves[0].k).toBeCloseTo(s.waves[1].omega / s.waves[1].k)
  })

  it('o fóton percorre o eixo e reaparece na fonte', () => {
    const at = (t: number) => emWaveModel(t, input).photon
    expect(at(timing.photon - 1).opacity).toBe(0)
    expect(at(timing.photon + 2).x).toBeCloseTo(EM_VISUAL.xMin + 2 * EM_VISUAL.speed)
    const period = EM_SPAN / EM_VISUAL.speed
    expect(at(timing.photon + period + 1).x).toBeCloseTo(at(timing.photon + 1).x)
  })

  it('expõe as grandezas físicas de cada λ', () => {
    const [a, b] = emWaveModel(0, input).waves
    expect(a.photonEnergyEv).toBeCloseTo(1.8786, 3)
    expect(b.photonEnergyEv).toBeCloseTo(1.5345, 3)
    expect(a.visible).toBe(true)
    expect(b.visible).toBe(false)
  })
})

describe('fieldAt e sampleField', () => {
  const w = emWaveModel(4, input).waves[0]

  it('é zero à frente da onda e contínuo na frente', () => {
    expect(fieldAt(w, w.front + 0.01, 4)).toBe(0)
    expect(Math.abs(fieldAt(w, w.front - 1e-6, 4))).toBeLessThan(1e-4)
  })

  it('repete a cada λ', () => {
    const x = EM_VISUAL.xMin + 0.7
    expect(fieldAt(w, x + visualWavelength(660), 4)).toBeCloseTo(fieldAt(w, x, 4))
  })

  it('a onda anda para +x: o padrão em t+dt é o de t deslocado de v·dt', () => {
    const later = emWaveModel(4.5, input).waves[0]
    const x = EM_VISUAL.xMin + 1.3
    expect(fieldAt(later, x + 0.5 * EM_VISUAL.speed, 4.5)).toBeCloseTo(fieldAt(w, x, 4))
  })

  it('sampleField cobre xMin..xMax e fica em −1..1', () => {
    const out = sampleField(emWaveModel(30, input).waves[0], 30, new Float32Array(121))
    expect(out[0]).toBeCloseTo(fieldAt(emWaveModel(30, input).waves[0], EM_VISUAL.xMin, 30))
    for (const v of out) expect(Math.abs(v)).toBeLessThanOrEqual(1)
  })
})
