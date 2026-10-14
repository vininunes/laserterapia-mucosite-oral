import { TISSUE_WAVELENGTHS } from '../../model/tissue-optics'
import { wavelengthOptionLabel } from '../lasers'
import type { SceneScript } from '../types'

/** Lançamento dos fótons desenhados e velocidade da animação das trajetórias. */
export const TISSUE_TIMING = {
  launchStart: 4,
  launchWindow: 14,
  /** Vértices gravados por segundo (cada vértice = 8 interações). */
  verticesPerSecond: 24,
  /** A câmera volta para a célula-alvo, ponte para a cena 3. */
  focusCell: 47,
}

/**
 * Célula-alvo em destaque no fim da cena: fileira do meio do epitélio do bloco
 * da esquerda (x = −9 mm), na face da frente (z = 3 mm). A cena realça a
 * célula desenhada na fileira mais próxima desta altura e, nela, a mais
 * próxima deste x.
 */
export const TISSUE_FOCUS_CELL: [number, number, number] = [-9, -0.21, 2.92]

export type TissueParams = {
  wavelengthA: number
  wavelengthB: number
  seed: number
  photons: number
}

const wavelengthOptions = TISSUE_WAVELENGTHS.map((nm) => ({ value: nm, label: wavelengthOptionLabel(nm) }))

type Pose = { position: [number, number, number]; target: [number, number, number] }

/** Os dois enquadramentos da cena: a comparação dos blocos e o close no epitélio do bloco da esquerda. */
const overview: Pose = { position: [0, 2, 31], target: [0, -4, 0] }
const closeUp: Pose = { position: [-6.2, 0.6, 7], target: [-9, -0.8, 0] }
/**
 * No celular os rótulos das camadas ficam à esquerda do bloco da esquerda,
 * fora do tecido: a câmera recua e desloca para a esquerda para caberem.
 */
const overviewCompact: Pose = { position: [-3, 2, 37], target: [-3, -4, 0] }
const closeUpCompact: Pose = { position: [-9.5, 0.6, 9], target: [-12, -0.8, 0] }

export const tissueScript: SceneScript<TissueParams> = {
  id: 'tecido',
  title: 'A luz dentro da mucosa: absorção, espalhamento e profundidade',
  shortTitle: 'Tecido',
  duration: 56,
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
        'Dois blocos da mucosa da bochecha, lado a lado, cada um iluminado por um λ. Em escala real (mm): epitélio de ~0,55 mm, lâmina própria, que tem os vasos e onde se instala a inflamação da mucosite, e submucosa. É até aí que a luz do tratamento precisa chegar. No epitélio, desenhadas fora de escala (cada uma mede poucas dezenas de µm), estão as células-alvo: a cena 3 entra numa delas.',
      camera: overview,
      cameraCompact: overviewCompact,
    },
    {
      t: TISSUE_TIMING.launchStart,
      title: 'Os fótons entram',
      caption:
        'Cada ponto é um fóton do laser. Ele anda em linha reta até interagir com o tecido: ou é espalhado (muda de direção) ou é absorvido (para e deixa uma marca). Aqui, de perto, as camadas finas do topo.',
      camera: closeUp,
      cameraCompact: closeUpCompact,
    },
    {
      t: 12,
      title: 'O espalhamento domina',
      caption:
        'Na mucosa, um fóton é espalhado centenas de vezes antes de ser absorvido. Por isso ele faz um passeio aleatório (random walk) e boa parte da luz volta para a superfície. O painel Grandezas mostra quanto volta, quanto cada camada absorve e até onde a luz chega.',
      camera: overview,
      cameraCompact: overviewCompact,
    },
    {
      t: 22,
      title: 'A janela óptica',
      caption:
        'Entre o vermelho e o infravermelho próximo (cerca de 600 a 1.000 nm; os limites variam entre autores) o tecido absorve pouca luz: abaixo disso a hemoglobina absorve forte, acima a água. É a "janela óptica" que a PBM aproveita para a luz chegar às células-alvo.',
      camera: overview,
      cameraCompact: overviewCompact,
    },
    {
      t: 31,
      title: 'Por que o infravermelho vai mais fundo',
      caption:
        'Com estes dados, a profundidade alcançada por 10% dos fótons é maior em 808 nm que em 660 nm, mesmo com o sangue oxigenado absorvendo um pouco mais em 808 nm (veja μa no painel). O motivo é o espalhamento (μs\'), que diminui com o λ.',
      camera: overview,
      cameraCompact: overviewCompact,
    },
    {
      t: 39,
      title: 'Por que o vermelho basta na boca',
      caption:
        'Nos protocolos MASCC/ISOO de prevenção a luz é aplicada dentro da boca, com a ponteira na mucosa. O alvo (epitélio e lâmina própria, menos de 1 mm) fica logo abaixo, e o vermelho chega até ele: é o que a diretriz recomenda. A vantagem de profundidade do infravermelho importa quando a luz precisa atravessar mais tecido até o alvo.',
      camera: overview,
      cameraCompact: overviewCompact,
    },
    {
      t: TISSUE_TIMING.focusCell,
      title: 'A célula-alvo',
      caption:
        'De volta ao epitélio, agora numa só célula (ainda fora de escala). A luz que chega até aqui só tem efeito se for absorvida por moléculas dentro dela. A cena 3 entra nesta célula para mostrar o que acontece quando ela absorve um fóton.',
      camera: {
        position: [TISSUE_FOCUS_CELL[0] + 0.25, TISSUE_FOCUS_CELL[1] + 0.3, TISSUE_FOCUS_CELL[2] + 1.3],
        target: TISSUE_FOCUS_CELL,
      },
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
