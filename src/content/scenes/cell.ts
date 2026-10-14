import type { CellParams, CellTiming } from '../../model/cell'
import { wavelengthOptionLabel } from '../lasers'
import type { SceneScript } from '../types'

export const cellTiming: CellTiming = {
  photon: 5,
  absorb: 10,
  atp: 15,
  signals: 21,
  inflammation: 27,
  analgesia: 32,
  healing: 37,
  tissue: 43,
}

const overview = { position: [0, 2.5, 13] as [number, number, number], target: [0, 0, 0] as [number, number, number] }

export const cellScript: SceneScript<CellParams> = {
  id: 'celula',
  title: 'O que a luz faz na célula: citocromo c oxidase, ATP e inflamação',
  shortTitle: 'Célula',
  duration: 52,
  illustrative: true,
  scale: { outOfScale: true, note: 'Esquema fora de escala: uma célula real mede poucas dezenas de µm' },
  defaults: { wavelengthNm: 660 },
  controls: [
    {
      kind: 'select',
      key: 'wavelengthNm',
      label: 'Comprimento de onda do fóton',
      options: [632.8, 650, 660, 808].map((nm) => ({
        value: nm,
        label: wavelengthOptionLabel(nm),
      })),
    },
  ],
  steps: [
    {
      t: 0,
      title: 'Uma célula da mucosa',
      caption:
        'Agora, dentro de uma célula do epitélio da mucosa oral. Tudo aqui é esquemático: o núcleo, as mitocôndrias, onde a célula produz energia (ATP), e, em volta, mediadores inflamatórios (pontos vermelhos), sinais químicos que na mucosite ampliam a lesão.',
      camera: overview,
    },
    {
      t: cellTiming.photon,
      title: 'O fóton chega',
      caption:
        'Um fóton do laser entra na célula. A luz só tem efeito biológico se for absorvida, e para isso precisa encontrar uma molécula capaz de captá-la: um fotoaceptor.',
      camera: { position: [6, 4.5, 10.5], target: [1, 0.5, 0.5] },
    },
    {
      t: cellTiming.absorb,
      title: 'A citocromo c oxidase absorve a luz',
      caption:
        'O principal fotoaceptor proposto para a PBM é a citocromo c oxidase, enzima da cadeia respiratória da mitocôndria, que absorve luz vermelha e infravermelha próxima. Uma hipótese aceita é que a luz desloca o óxido nítrico (NO) que inibe a enzima, deixando-a trabalhar mais.',
      // Close-up por dentro da membrana (os mediadores ficam fora, atrás da câmera).
      camera: { position: [2.4, 0.5, 2.9], target: [1.2, -0.3, 0.6] },
    },
    {
      t: cellTiming.atp,
      title: 'Mais ATP',
      caption:
        'Com a enzima mais ativa, a mitocôndria produz mais ATP, a "moeda" de energia da célula (pontos verdes). Células com mais energia disponível tendem a resistir melhor ao dano e a se reparar mais rápido.',
      camera: { position: [6.5, 3.5, 10], target: [0.6, -0.3, 0.3] },
    },
    {
      t: cellTiming.signals,
      title: 'Sinalização dentro da célula',
      caption:
        'A mudança no metabolismo gera sinais de curta duração, como pequenas quantidades de espécies reativas de oxigênio (brilho amarelo), que ativam fatores de transcrição e alteram quais genes a célula expressa.',
      camera: { position: [-4, 3.5, 11], target: [0, 0, 0] },
    },
    {
      t: cellTiming.inflammation,
      title: 'Modulação da inflamação',
      caption:
        'Um dos efeitos descritos é a redução de mediadores pró-inflamatórios. Na animação os pontos vermelhos diminuem, mas não somem: a PBM modula a inflamação, não a elimina.',
      camera: overview,
    },
    {
      t: cellTiming.analgesia,
      title: 'Menos dor',
      caption:
        'Os mediadores inflamatórios também sensibilizam as terminações nervosas da mucosa. Com menos deles, a dor tende a diminuir; a literatura descreve ainda a liberação de endorfinas. É o efeito analgésico, que na mucosite ajuda o paciente a comer, falar e higienizar a boca.',
      camera: overview,
    },
    {
      t: cellTiming.healing,
      title: 'Reparo do epitélio',
      caption:
        'O terceiro efeito é o cicatrizante. Com mais energia disponível, as células do epitélio se multiplicam e o tecido se refaz (as células vizinhas aparecem). Na lâmina própria, abaixo, descreve-se mais síntese de colágeno e formação de vasos (angiogênese), melhorando a circulação local.',
      camera: { position: [0, 5, 15], target: [0, 0, 0] },
    },
    {
      t: cellTiming.tissue,
      title: 'De volta à mucosite',
      caption:
        'Na mucosite oral, a quimioterapia e a radioterapia desencadeiam estresse oxidativo e uma cascata inflamatória que leva à ulceração (modelo de Sonis). Atenuar essa cascata e apoiar o reparo do epitélio ajuda a explicar o benefício observado nos estudos que embasam a recomendação da MASCC/ISOO.',
      camera: { position: [0, 7, 17], target: [0, 0, 0] },
    },
  ],
  references: ['karu-1999', 'hamblin-2017', 'sonis-2004', 'zadik-2019', 'bjordal-2011', 'piva-2011', 'franca-2009'],
}
