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
  title: 'Cena 1 — A luz como onda eletromagnética',
  shortTitle: 'Onda EM',
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
      title: 'A luz é uma onda eletromagnética',
      caption:
        'A luz é uma perturbação que se propaga pelo espaço. À esquerda, a fonte emite a onda, que avança para a direita. A curva colorida é o campo elétrico (E).',
      camera: { position: [0, 1.2, 12], target: [0, 0, 0] },
    },
    {
      t: emWaveTiming.bField,
      title: 'Campos elétrico e magnético',
      caption:
        'Junto com o campo elétrico oscila um campo magnético (B). Os dois são perpendiculares entre si e à direção de propagação, e oscilam em fase. Aqui E e B aparecem do mesmo tamanho para facilitar a leitura.',
      camera: { position: [-7.5, 4.5, 8], target: [0, 0, 0] },
    },
    {
      t: emWaveTiming.ruler,
      title: 'Comprimento de onda',
      caption:
        'A distância entre duas cristas seguidas é o comprimento de onda (λ). Ele define a cor da luz visível e, fora dela, o tipo de radiação: ultravioleta abaixo e infravermelho acima.',
      camera: { position: [1, 1.8, 7.5], target: [1, 0.8, 0] },
    },
    {
      t: emWaveTiming.photon,
      title: 'Energia do fóton',
      caption:
        'A luz também se comporta como pacotes de energia, os fótons. Cada fóton carrega E = hc/λ: quanto maior o comprimento de onda, menor a energia. Os valores estão no painel Grandezas.',
      camera: { position: [-4, 2.5, 8.5], target: [-1, 0, 0] },
    },
    {
      t: emWaveTiming.compare,
      title: 'Vermelho × infravermelho',
      caption:
        'Por padrão, a comparação é entre 660 nm (vermelho) e 808 nm (infravermelho próximo). As duas ondas viajam à mesma velocidade; a de 808 nm tem cristas mais espaçadas, frequência menor e fótons menos energéticos.',
      camera: { position: [0, 0.5, 14], target: [0, 0, 0] },
    },
    {
      t: 35,
      title: 'Tudo ligado',
      caption:
        'Comprimento de onda, frequência e energia andam juntos: f = c/λ e E = h·f. Pause e mude λ no painel para ver a cor, o espaçamento das cristas e a energia mudarem ao mesmo tempo.',
      camera: { position: [-8, 5, 11], target: [0, 0, 0] },
    },
  ],
  references: ['bipm-si-2019', 'bruton-1996'],
}
