import { TISSUE_WAVELENGTHS } from '../../model/tissue-optics'
import type { SceneScript } from '../types'

/** Lançamento dos fótons desenhados e velocidade da animação das trajetórias. */
export const TISSUE_TIMING = {
  launchStart: 4,
  launchWindow: 14,
  /** Vértices gravados por segundo (cada vértice = 8 interações). */
  verticesPerSecond: 24,
}

export type TissueParams = {
  wavelengthA: number
  wavelengthB: number
  seed: number
  photons: number
}

const wavelengthOptions = TISSUE_WAVELENGTHS.map((nm) => ({
  value: nm,
  label: `${nm.toLocaleString('pt-BR')} nm${nm > 780 ? ' (infravermelho)' : ' (vermelho)'}`,
}))

const overview = { position: [0, 2, 31] as [number, number, number], target: [0, -4, 0] as [number, number, number] }

export const tissueScript: SceneScript<TissueParams> = {
  id: 'tecido',
  title: 'A luz dentro da mucosa: absorção, espalhamento e profundidade',
  shortTitle: 'Tecido',
  duration: 44,
  defaults: { wavelengthA: 660, wavelengthB: 808, seed: 42, photons: 20000 },
  controls: [
    { kind: 'select', key: 'wavelengthA', label: 'Bloco da esquerda', options: wavelengthOptions },
    { kind: 'select', key: 'wavelengthB', label: 'Bloco da direita', options: wavelengthOptions },
    {
      kind: 'select',
      key: 'photons',
      label: 'Fótons na estatística',
      options: [5000, 20000, 50000].map((n) => ({ value: n, label: n.toLocaleString('pt-BR') })),
    },
    { kind: 'slider', key: 'seed', label: 'Semente do sorteio', min: 1, max: 999, step: 1 },
  ],
  steps: [
    {
      t: 0,
      title: 'As camadas da mucosa jugal',
      caption:
        'Dois blocos da mucosa da bochecha, lado a lado, cada um iluminado por um λ. Em escala real (mm): epitélio de ~0,55 mm, lâmina própria, que tem os vasos e onde se instala a inflamação da mucosite, e submucosa. É até aí que a luz do tratamento precisa chegar.',
      camera: overview,
    },
    {
      t: TISSUE_TIMING.launchStart,
      title: 'Os fótons entram',
      caption:
        'Cada ponto é um fóton do laser. Ele anda em linha reta até interagir com o tecido: ou é espalhado (muda de direção) ou é absorvido (para e deixa uma marca). Aqui, de perto, as camadas finas do topo.',
      camera: { position: [-6.2, 0.6, 7], target: [-9, -0.8, 0] },
    },
    {
      t: 12,
      title: 'O espalhamento domina',
      caption:
        'Na mucosa, um fóton é espalhado centenas de vezes antes de ser absorvido. Por isso ele faz um passeio aleatório (random walk) e boa parte da luz volta para a superfície. O painel Grandezas mostra quanto volta, quanto cada camada absorve e até onde a luz chega.',
      camera: { position: [0, -1, 26], target: [0, -3, 0] },
    },
    {
      t: 22,
      title: 'A janela óptica',
      caption:
        'Entre o vermelho e o infravermelho próximo (cerca de 600 a 1.000 nm; os limites variam entre autores) o tecido absorve pouca luz: abaixo disso a hemoglobina absorve forte, acima a água. É a "janela óptica" que a PBM aproveita para a luz chegar às células-alvo.',
      camera: overview,
    },
    {
      t: 31,
      title: 'Por que o infravermelho vai mais fundo',
      caption:
        'Com estes dados, a profundidade alcançada por 10% dos fótons é maior em 808 nm que em 660 nm, mesmo com o sangue oxigenado absorvendo um pouco mais em 808 nm (veja μa no painel). O motivo é o espalhamento (μs\'), que diminui com o λ. Na clínica isso orienta a escolha: vermelho para a superfície da mucosa, como nos protocolos MASCC/ISOO de prevenção, e infravermelho para alvos mais profundos.',
      camera: { position: [10, -1.5, 27], target: [0, -4, 0] },
    },
  ],
  references: [
    'jacques-2013',
    'salomatina-2006',
    'bashkatov-2005',
    'greening-2016',
    'prahl-hemoglobin',
    'hale-querry-1973',
    'yaroslavsky-2023',
    'di-stasio-2019',
    'kurtzman-2021',
    'anderson-parrish-1981',
    'chung-2012',
  ],
}
