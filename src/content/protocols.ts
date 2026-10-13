/**
 * Protocolos de PBM intraoral RECOMENDADOS pela diretriz MASCC/ISOO para
 * PREVENÇÃO de mucosite oral em adultos (Zadik et al., 2019).
 *
 * Valores transcritos do resumo enviado pela pesquisa em 13/10/2026, sem
 * correção. Cada linha é um protocolo de um estudo; a diretriz pede seguir
 * todos os parâmetros do protocolo escolhido, sem combinar linhas.
 * Pendente: conferência com o artigo original (ver `flags`).
 */

export type TreatmentContext = 'TCTH' | 'RT' | 'RT + QT'

export interface PbmProtocol {
  id: string
  context: TreatmentContext
  wavelengthNm: number
  irradianceMwCm2: number
  timePerPointS: number
  /** Fluência como publicada. Pode não bater com irradiância × tempo. */
  reportedFluenceJcm2: number
  spotCm2: number
  /** Pontos por sessão; [mín, máx] quando a fonte dá uma faixa. */
  points: [number, number]
  schedule: string
  /** Id de `references.ts`. */
  source: string
  /** Marcações a conferir no artigo, exibidas como alerta. */
  flags: string[]
}

export const IRRADIANCE_ASTERISK =
  'A irradiância aparece com * no documento-fonte; o significado da marcação não está no resumo. Verificar no artigo completo.'

export const protocols: PbmProtocol[] = [
  {
    id: 'tcth-632',
    context: 'TCTH',
    wavelengthNm: 632.8,
    irradianceMwCm2: 31.25,
    timePerPointS: 40,
    reportedFluenceJcm2: 1.0,
    spotCm2: 0.8,
    points: [18, 18],
    schedule: 'Do dia seguinte ao fim do condicionamento, por 5 dias',
    source: 'zadik-2019',
    flags: [],
  },
  {
    id: 'tcth-650',
    context: 'TCTH',
    wavelengthNm: 650,
    irradianceMwCm2: 1000,
    timePerPointS: 2,
    reportedFluenceJcm2: 2.0,
    spotCm2: 0.04,
    points: [54, 70],
    schedule: 'Do 1º dia do condicionamento até D+2 (7 a 13 dias)',
    source: 'zadik-2019',
    flags: [IRRADIANCE_ASTERISK],
  },
  {
    id: 'rt-632',
    context: 'RT',
    wavelengthNm: 632.8,
    irradianceMwCm2: 24,
    timePerPointS: 125,
    reportedFluenceJcm2: 3.0,
    spotCm2: 1,
    points: [12, 12],
    schedule: 'Todo o curso de radioterapia',
    source: 'zadik-2019',
    flags: [],
  },
  {
    id: 'rtqt-660-024',
    context: 'RT + QT',
    wavelengthNm: 660,
    irradianceMwCm2: 417,
    timePerPointS: 10,
    reportedFluenceJcm2: 4.2,
    spotCm2: 0.24,
    points: [72, 72],
    schedule: 'Todo o curso de radioterapia',
    source: 'zadik-2019',
    flags: [IRRADIANCE_ASTERISK],
  },
  {
    id: 'rtqt-660-004',
    context: 'RT + QT',
    wavelengthNm: 660,
    irradianceMwCm2: 625,
    timePerPointS: 10,
    reportedFluenceJcm2: 6.2,
    spotCm2: 0.04,
    points: [69, 69],
    schedule: 'Todo o curso de radioterapia',
    source: 'zadik-2019',
    flags: [IRRADIANCE_ASTERISK],
  },
]

export const contextInfo: Record<TreatmentContext, { label: string; evidenceLevel: string }> = {
  TCTH: {
    label: 'Transplante de células-tronco hematopoéticas, com condicionamento por quimioterapia em altas doses, com ou sem irradiação corporal total',
    evidenceLevel: 'I',
  },
  RT: { label: 'Radioterapia de cabeça e pescoço, sem quimioterapia', evidenceLevel: 'II' },
  'RT + QT': { label: 'Radioterapia de cabeça e pescoço com quimioterapia concomitante', evidenceLevel: 'I' },
}

/** Notas gerais do resumo da diretriz (mascc-isoo-2020-pbm). */
export const guidelineNotes = {
  noGuidelineChemoOnly: 'Somente quimioterapia: nenhuma diretriz possível.',
  followWholeProtocol: 'Siga todos os parâmetros do protocolo escolhido; não combine valores de linhas diferentes.',
  safety:
    'Nos ensaios randomizados analisados não foram relatados eventos adversos de curto ou longo prazo. Em um estudo de coorte, 15% dos pacientes relataram ardência imediata, não dolorosa, após laser de diodo de 635 nm.',
  oralCancer: 'Para pacientes com câncer oral, a diretriz pede considerações de segurança específicas.',
}
