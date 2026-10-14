import type { EmWaveParams, EmWaveTiming } from '../../model/em-wave'
import type { SceneScript } from '../types'

/** Quando cada elemento entra em cena. As etapas abaixo usam os mesmos instantes. */
export const emWaveTiming: EmWaveTiming = {
  bField: 7,
  ruler: 14,
  photon: 21,
  compare: 28,
}

export const emWaveScript: SceneScript<EmWaveParams> = {
  id: 'onda-em',
  title: 'A luz do laser: onda eletromagnética, λ e energia do fóton',
  shortTitle: 'A luz',
  duration: 42,
  defaults: { wavelengthA: 660, wavelengthB: 808, compare: 1, showB: 1 },
  controls: [
    { kind: 'slider', key: 'wavelengthA', label: 'λ do laser A', min: 380, max: 1000, step: 1, unit: 'nm' },
    { kind: 'slider', key: 'wavelengthB', label: 'λ do laser B (comparação)', min: 380, max: 1000, step: 1, unit: 'nm' },
    { kind: 'toggle', key: 'compare', label: 'Mostrar comparação' },
    { kind: 'toggle', key: 'showB', label: 'Mostrar campo magnético' },
  ],
  steps: [
    {
      t: 0,
      title: 'Por que começar pela luz?',
      caption:
        'A laserterapia de baixa potência, também chamada fotobiomodulação (PBM), usa luz de baixa intensidade para prevenir e tratar a mucosite oral, a inflamação e ulceração da boca causada por quimioterapia e radioterapia. Para entender o tratamento, começamos pelo que o laser emite: uma onda eletromagnética que sai da fonte, à esquerda, e avança.',
      camera: { position: [0, 1.2, 12], target: [0, 0, 0] },
    },
    {
      t: emWaveTiming.bField,
      title: 'Campos elétrico e magnético',
      caption:
        'A luz é feita de um campo elétrico (E) e um campo magnético (B) que oscilam juntos, perpendiculares entre si e à direção de propagação. É essa energia eletromagnética que o laser leva até a mucosa. Aqui E e B aparecem do mesmo tamanho para facilitar a leitura.',
      camera: { position: [-7.5, 4.5, 8], target: [0, 0, 0] },
    },
    {
      t: emWaveTiming.ruler,
      title: 'Comprimento de onda: a primeira escolha do protocolo',
      caption:
        'A distância entre duas cristas é o comprimento de onda (λ). No tratamento ele define a cor do laser e até onde a luz chega no tecido (cena Tecido). Os protocolos recomendados pela MASCC/ISOO para prevenir a mucosite usam luz vermelha, de 632,8 a 660 nm: o laser de He-Ne (632,8 nm) e diodos de InGaAlP. O infravermelho (como 808 nm) vem de diodos de GaAlAs.',
      camera: { position: [1, 1.8, 7.5], target: [1, 0.8, 0] },
    },
    {
      t: emWaveTiming.photon,
      title: 'A célula absorve fótons',
      caption:
        'A célula não absorve a onda inteira, e sim pacotes de energia, os fótons. Cada fóton carrega E = hc/λ; em 660 nm são cerca de 1,88 eV, pouco demais para ionizar ou quebrar o DNA. Por isso a PBM age por efeito fotoquímico, não por destruição do tecido (cena Célula).',
      camera: { position: [-4, 2.5, 8.5], target: [-1, 0, 0] },
    },
    {
      t: emWaveTiming.compare,
      title: 'Vermelho × infravermelho',
      caption:
        'Por padrão, 660 nm (vermelho, a faixa dos protocolos recomendados para prevenção) contra 808 nm (infravermelho próximo, também usado em estudos de PBM). As duas ondas viajam à mesma velocidade; a de 808 nm tem cristas mais espaçadas e fótons menos energéticos. O infravermelho é invisível: a curva tracejada é só representação.',
      camera: { position: [0, 0.5, 14], target: [0, 0, 0] },
    },
    {
      t: 35,
      title: 'O que levar para o tratamento',
      caption:
        'λ define a cor, a energia de cada fóton e a profundidade que a luz alcança na mucosa. A quantidade de luz entregue, a dose, depende de potência, tempo e área do spot (cenas Protocolos e Calculadora). Pause e mude λ no painel para ver tudo mudar junto.',
      camera: { position: [-8, 5, 11], target: [0, 0, 0] },
    },
  ],
  // λ proporcional ao real: 660 nm ↦ 2 unidades (EM_VISUAL.unitsPer660nm).
  scale: { metersPerUnit: 330e-9, note: 'Vale para o comprimento de onda; o aparelho e a altura da onda não estão em escala' },
  references: ['bipm-si-2019', 'bruton-1996', 'zadik-2019', 'karu-1998'],
}
