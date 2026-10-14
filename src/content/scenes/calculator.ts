import { wavelengthOptionLabel } from '../lasers'
import { guidelineNotes, protocols } from '../protocols'
import type { SceneScript } from '../types'
import { protocolName } from './dosimetry'

/** Instante em que o laser liga. */
export const CALC_START = 3
export const CALC_MAX_TIME_S = 125

export type CalculatorParams = {
  wavelengthNm: number
  powerMw: number
  timeS: number
  areaCm2: number
}

/** λ dos protocolos recomendados + 808 nm (infravermelho, para comparação). */
const wavelengths = [...new Set([...protocols.map((p) => p.wavelengthNm), 808])].sort((a, b) => a - b)

export const calculatorScript: SceneScript<CalculatorParams> = {
  id: 'calculadora',
  title: 'Calculadora de dose: potência, tempo e área do spot',
  shortTitle: 'Calculadora',
  duration: CALC_START + CALC_MAX_TIME_S + 3,
  // Padrão: protocolo RT + QT 660 nm, spot 0,24 cm² (potência = 417 mW/cm² × 0,24 cm²).
  defaults: { wavelengthNm: 660, powerMw: 100.08, timeS: 10, areaCm2: 0.24 },
  controls: [
    {
      kind: 'presets',
      label: 'Carregar protocolo recomendado',
      placeholder: 'Escolha um protocolo…',
      options: protocols.map((p) => ({
        label: `${protocolName(p)} · ${p.spotCm2.toLocaleString('pt-BR')} cm²`,
        values: {
          wavelengthNm: p.wavelengthNm,
          // O protocolo publica irradiância; o aparelho é ajustado em potência.
          powerMw: Number((p.irradianceMwCm2 * p.spotCm2).toFixed(2)),
          timeS: p.timePerPointS,
          areaCm2: p.spotCm2,
        },
      })),
    },
    {
      kind: 'select',
      key: 'wavelengthNm',
      label: 'Comprimento de onda',
      options: wavelengths.map((nm) => ({
        value: nm,
        label: wavelengthOptionLabel(nm),
      })),
    },
    { kind: 'slider', key: 'powerMw', label: 'Potência', min: 1, max: 500, step: 0.01, unit: 'mW' },
    { kind: 'slider', key: 'timeS', label: 'Tempo por ponto', min: 1, max: CALC_MAX_TIME_S, step: 1, unit: 's' },
    { kind: 'slider', key: 'areaCm2', label: 'Área do spot', min: 0.01, max: 1.5, step: 0.01, unit: 'cm²' },
  ],
  steps: [
    {
      t: 0,
      title: 'Dose é energia por área',
      caption:
        'Na PBM para mucosite oral, a dose é a fluência, também chamada densidade de energia (J/cm²): quanta energia de luz chega a cada centímetro quadrado da mucosa. Ela sai de três ajustes do aparelho: potência (mW), tempo por ponto (s) e área do spot (cm²). Ajuste-os no painel.',
      camera: { position: [0, 4.5, 8.5], target: [0, 1, -0.4] },
    },
    {
      t: CALC_START,
      title: 'Laser ligado',
      caption:
        'Irradiância = potência ÷ área (mW/cm²): é a "velocidade" da dose. Fluência = irradiância × tempo ÷ 1000. A barra sobe enquanto o laser está ligado e para quando o tempo do ponto acaba.',
      camera: { position: [2.4, 3.2, 7.2], target: [0, 1, -0.4] },
    },
    {
      t: 20,
      title: 'O spot muda tudo',
      caption:
        'A mesma potência concentrada num spot menor dá irradiância e fluência maiores. Teste: pause, reduza a área do spot e veja a barra e o painel. Por isso um protocolo informa a área, não só os J/cm².',
      camera: { position: [-2.6, 4, 6.8], target: [0, 0.6, 0] },
    },
    {
      t: 60,
      title: 'Compare com os protocolos',
      caption: `Os anéis marcam a fluência publicada de cada protocolo recomendado pela MASCC/ISOO. Use "Carregar protocolo" para ver os ajustes reais de cada um. Atingir o mesmo J/cm² não torna dois protocolos equivalentes. ${guidelineNotes.followWholeProtocol}`,
      camera: { position: [3.2, 2.6, 6.4], target: [0, 1.2, -0.8] },
    },
  ],
  references: ['zadik-2019', 'mascc-isoo-2020-pbm'],
}
