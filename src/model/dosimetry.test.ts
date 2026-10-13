import { describe, expect, it } from 'vitest'

import { protocols } from '../content/protocols'
import { deriveDose, deviceDose, doseLane, dosimetryModel, fluenceJcm2, spotRadius, DIMMED_EMPHASIS } from './dosimetry'

const byId = (id: string) => protocols.find((p) => p.id === id)!

describe('fluência e derivados', () => {
  it('fluência = irradiância × tempo / 1000', () => {
    expect(fluenceJcm2(24, 125)).toBeCloseTo(3)
    expect(fluenceJcm2(1000, 2)).toBeCloseTo(2)
  })

  it('potência e energia por ponto', () => {
    const d = deriveDose(byId('rtqt-660-024'))
    expect(d.powerMw).toBeCloseTo(100.08)
    expect(d.energyPerPointJ).toBeCloseTo(1.0008)
  })

  it('sessão usa a faixa de pontos', () => {
    const d = deriveDose(byId('tcth-650'))
    expect(d.sessionTimeS).toEqual([108, 140])
  })

  it('só o protocolo TCTH 632,8 nm tem fluência publicada inconsistente', () => {
    const mismatched = protocols.filter((p) => deriveDose(p).fluenceMismatch).map((p) => p.id)
    expect(mismatched).toEqual(['tcth-632'])
    expect(deriveDose(byId('tcth-632')).computedFluenceJcm2).toBeCloseTo(1.25)
  })
})

describe('dosimetryModel', () => {
  const input = { protocols, start: 3, focus: -1 }

  it('é determinístico', () => {
    expect(dosimetryModel(17.5, input)).toEqual(dosimetryModel(17.5, input))
  })

  it('antes de ligar, nada acumulado', () => {
    for (const lane of dosimetryModel(2, input)) {
      expect(lane.fluenceJcm2).toBe(0)
      expect(lane.emitting).toBe(false)
      expect(lane.done).toBe(false)
    }
  })

  it('acumula linearmente e para no tempo do protocolo', () => {
    const p = byId('rt-632')
    expect(doseLane(3 + 62.5, p, 0, input).fluenceJcm2).toBeCloseTo(1.5)
    const end = doseLane(3 + 200, p, 0, input)
    expect(end.fluenceJcm2).toBeCloseTo(3)
    expect(end.done).toBe(true)
    expect(end.emitting).toBe(false)
  })

  it('a fluência final é a calculada, não a publicada', () => {
    expect(doseLane(1000, byId('tcth-632'), 0, input).fluenceJcm2).toBeCloseTo(1.25)
  })

  it('foco atenua os outros protocolos', () => {
    const lanes = dosimetryModel(10, { ...input, focus: 2 })
    expect(lanes.map((l) => l.emphasis)).toEqual([DIMMED_EMPHASIS, DIMMED_EMPHASIS, 1, DIMMED_EMPHASIS, DIMMED_EMPHASIS])
  })
})

describe('spotRadius', () => {
  it('área π·r²', () => {
    expect(Math.PI * spotRadius(0.24) ** 2).toBeCloseTo(0.24)
  })
})

describe('deviceDose', () => {
  it('irradiância, fluência e energia a partir de potência, tempo e área', () => {
    const d = deviceDose({ powerMw: 100, timeS: 10, areaCm2: 0.25 })
    expect(d.irradianceMwCm2).toBeCloseTo(400)
    expect(d.fluenceJcm2).toBeCloseTo(4)
    expect(d.energyJ).toBeCloseTo(1)
  })

  it('reproduz os protocolos a partir da potência no spot', () => {
    for (const p of protocols) {
      const powerMw = p.irradianceMwCm2 * p.spotCm2
      const d = deviceDose({ powerMw, timeS: p.timePerPointS, areaCm2: p.spotCm2 })
      expect(d.fluenceJcm2).toBeCloseTo(deriveDose(p).computedFluenceJcm2)
    }
  })

  it('mesma potência em spot menor → fluência maior', () => {
    const big = deviceDose({ powerMw: 40, timeS: 10, areaCm2: 1 })
    const small = deviceDose({ powerMw: 40, timeS: 10, areaCm2: 0.04 })
    expect(small.fluenceJcm2 / big.fluenceJcm2).toBeCloseTo(25)
  })
})
