import { deriveDose, type DosimetryInput } from '../../model/dosimetry'
import { formatCompact, formatDuration, formatNumber, formatRange } from '../../ui/format-number'
import { guidelineNotes, protocols, type PbmProtocol } from '../protocols'
import type { SceneScript, ScriptStep } from '../types'

/** Instante em que todas as sondas ligam. */
export const DOSE_START = 3

export const protocolName = (p: PbmProtocol) => `${p.context} · ${formatCompact(p.wavelengthNm)} nm`

/**
 * Nome que distingue protocolos com o mesmo contexto e λ (os dois RT + QT
 * 660 nm diferem pelo spot).
 */
export function protocolLabel(p: PbmProtocol): string {
  const twins = protocols.filter((q) => q.context === p.context && q.wavelengthNm === p.wavelengthNm)
  return twins.length > 1 ? `${protocolName(p)} (${formatCompact(p.spotCm2)} cm²)` : protocolName(p)
}

const joinNames = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}` : names[0]

/** Etapa gerada a partir dos dados: o instante em que protocolos completam o ponto. */
function endStep(group: PbmProtocol[]): ScriptStep {
  const time = group[0].timePerPointS
  const parts = group.map((p) => {
    const d = deriveDose(p)
    const mismatch = d.fluenceMismatch
      ? ` O resumo publica ${formatNumber(p.reportedFluenceJcm2, 1)} J/cm², mas ${formatCompact(p.irradianceMwCm2)} mW/cm² × ${time} s = ${formatNumber(d.computedFluenceJcm2, 2)} J/cm²: por isso a barra passa da marca. Conferir no artigo original.`
      : ''
    return `${protocolLabel(p)}: o ponto recebe ${formatNumber(d.computedFluenceJcm2, 2)} J/cm². A sessão repete isso em ${formatRange(p.points, String)} pontos, somando ${formatRange(d.sessionTimeS, formatDuration)} de laser ligado.${mismatch}`
  })
  return {
    t: DOSE_START + time,
    title: `${joinNames(group.map(protocolLabel))} ${group.length > 1 ? 'completam' : 'completa'} o ponto em ${time} s`,
    caption: `O laser fica ${time} s parado sobre o ponto e então passa para o próximo. ${parts.join(' ')}`,
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
      title: 'O que é um ponto e como a dose sobe',
      caption:
        'Um "ponto" é um local da mucosa oral onde a ponta do laser fica parada, iluminando a área do spot. Cada protocolo irradia vários pontos por sessão, um depois do outro. Em velocidade 1× a simulação corre em tempo real: o cronômetro abaixo de cada spot é o tempo que o laser fica sobre aquele ponto. A barra mostra a densidade de energia (fluência) acumulada, em J/cm², e o anel marca a densidade de energia publicada.',
      camera: { position: [0, 3.6, 7.2], target: [0, 0.7, 0] },
      // No celular o close cortava as pistas das pontas: mesma direção, ~1,6× mais longe.
      cameraCompact: { position: [0, 5.4, 11.6], target: [0, 0.7, 0] },
    },
    ...byTime.map(endStep),
    {
      t: DOSE_START + longest + 2,
      title: 'Receitas diferentes, cada uma completa',
      caption: `Cada protocolo combina λ, irradiância, tempo, spot e número de pontos de um jeito próprio. Manuais de laserterapia citam potências de 10 a 100 mW e 1 a 4 J/cm² por ponto; os protocolos de RT + QT da diretriz passam dessa faixa (4,2 e 6,2 J/cm²). ${guidelineNotes.followWholeProtocol}`,
      camera: { position: [-6.5, 5.5, 8.5], target: [0, 0.6, 0] },
    },
  ],
  // 1 unidade = 1 cm; só a altura das barras de densidade de energia é fora de escala.
  scale: { metersPerUnit: 1e-2, note: 'A altura das barras azuis representa J/cm², não comprimento' },
  references: ['zadik-2019', 'mascc-isoo-2020-pbm', 'elad-2020', 'eduardo-bezinelli-2010'],
}

/** Entrada do modelo a partir dos parâmetros da URL. */
export function dosimetryInput(params: DosimetryParams): DosimetryInput {
  return { protocols, start: DOSE_START, focus: params.focus }
}
