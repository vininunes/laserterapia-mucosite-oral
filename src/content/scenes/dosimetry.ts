import { deriveDose, type DosimetryInput } from '../../model/dosimetry'
import { formatCompact, formatDuration, formatNumber, formatRange } from '../../ui/format-number'
import { guidelineNotes, protocols, type PbmProtocol } from '../protocols'
import type { SceneScript, ScriptStep } from '../types'

/** Instante em que todas as sondas ligam. */
export const DOSE_START = 3

export const protocolName = (p: PbmProtocol) => `${p.context} · ${formatCompact(p.wavelengthNm)} nm`

/** Etapa gerada a partir dos dados: o instante em que protocolos completam o ponto. */
function endStep(group: PbmProtocol[]): ScriptStep {
  const time = group[0].timePerPointS
  const parts = group.map((p) => {
    const d = deriveDose(p)
    const mismatch = d.fluenceMismatch
      ? ` O resumo publica ${formatNumber(p.reportedFluenceJcm2, 1)} J/cm², mas ${formatCompact(p.irradianceMwCm2)} mW/cm² × ${time} s = ${formatNumber(d.computedFluenceJcm2, 2)} J/cm²: por isso a barra passa da marca. Conferir no artigo original.`
      : ''
    return `${protocolName(p)} (spot ${formatCompact(p.spotCm2)} cm²): ${formatNumber(d.computedFluenceJcm2, 2)} J/cm² no ponto; ${formatRange(p.points, String)} pontos por sessão, ${formatRange(d.sessionTimeS, formatDuration)} de irradiação.${mismatch}`
  })
  return {
    t: DOSE_START + time,
    title: `${time} s: ${group.length > 1 ? `${group.length} protocolos completam` : 'protocolo completa'} o ponto`,
    caption: parts.join(' '),
  }
}

const byTime = [...new Set(protocols.map((p) => p.timePerPointS))]
  .sort((a, b) => a - b)
  .map((time) => protocols.filter((p) => p.timePerPointS === time))

const longest = byTime[byTime.length - 1][0].timePerPointS

export type DosimetryParams = {
  /** Índice do protocolo em foco; −1 = todos. */
  focus: number
}

export const dosimetryScript: SceneScript<DosimetryParams> = {
  id: 'dosimetria',
  title: 'Protocolos MASCC/ISOO para prevenção da mucosite oral',
  shortTitle: 'Protocolos',
  duration: DOSE_START + longest + 6,
  defaults: { focus: -1 },
  controls: [
    {
      kind: 'select',
      key: 'focus',
      label: 'Protocolo em foco',
      options: [
        { value: -1, label: 'Todos os protocolos' },
        ...protocols.map((p, i) => ({
          value: i,
          label: `${protocolName(p)} · ${formatCompact(p.spotCm2)} cm² · ${formatNumber(p.reportedFluenceJcm2, 1)} J/cm²`,
        })),
      ],
    },
  ],
  steps: [
    {
      t: 0,
      title: 'Cinco protocolos recomendados',
      caption:
        'Para prevenir a mucosite oral em adultos que fazem transplante de células-tronco hematopoéticas (TCTH) ou radioterapia de cabeça e pescoço, com ou sem quimioterapia, a diretriz MASCC/ISOO recomenda cinco protocolos de PBM intraoral, cada um vindo de um estudo. Spots e sondas estão em escala real: cada quadrado da grade tem 1 cm.',
      camera: { position: [0, 7.5, 10.5], target: [0, 0.4, 0] },
    },
    {
      t: DOSE_START,
      title: 'Fluência = irradiância × tempo',
      caption:
        'As sondas ligam juntas. A barra atrás de cada spot mostra a fluência acumulada (J/cm²) e sobe na velocidade da irradiância (mW/cm²): irradiância alta chega rápido à dose; baixa precisa de mais tempo. O anel marca a fluência publicada.',
      camera: { position: [0, 3.6, 7.2], target: [0, 0.7, 0] },
    },
    ...byTime.map(endStep),
    {
      t: DOSE_START + longest + 2,
      title: 'Receitas diferentes, cada uma completa',
      caption: `Cada protocolo combina λ, irradiância, tempo, spot e número de pontos de um jeito próprio. ${guidelineNotes.followWholeProtocol}`,
      camera: { position: [-6.5, 5.5, 8.5], target: [0, 0.6, 0] },
    },
  ],
  references: ['zadik-2019', 'mascc-isoo-2020-pbm', 'elad-2020'],
}

/** Entrada do modelo a partir dos parâmetros da URL. */
export function dosimetryInput(params: DosimetryParams): DosimetryInput {
  return { protocols, start: DOSE_START, focus: params.focus }
}
