import type { TestCubeParams } from '../../model/test-cube'
import type { SceneScript } from '../types'

/** Cena de teste da Fase 1. Sai do menu quando as cenas reais entrarem. */
export const testCubeScript: SceneScript<TestCubeParams> = {
  id: 'teste',
  title: 'Cena de teste — cubo girando',
  shortTitle: 'Teste',
  duration: 12,
  defaults: { rotationSpeed: 0.25, size: 1 },
  controls: [
    { kind: 'slider', key: 'rotationSpeed', label: 'Rotação', min: 0, max: 2, step: 0.05, unit: 'voltas/s' },
    { kind: 'slider', key: 'size', label: 'Tamanho', min: 0.5, max: 2, step: 0.1 },
  ],
  steps: [
    {
      t: 0,
      title: 'Início',
      caption: 'O cubo começa parado na origem. Use o player para tocar, pausar e arrastar a agulha.',
      camera: { position: [3, 2.5, 4], target: [0, 0, 0] },
    },
    {
      t: 4,
      title: 'Câmera lateral',
      caption: 'A câmera segue os keyframes do roteiro: o mesmo instante sempre mostra o mesmo enquadramento.',
      camera: { position: [5, 0.6, 0], target: [0, 0, 0] },
    },
    {
      t: 8,
      title: 'Vista de cima',
      caption: 'Recarregue a página: o hash da URL restaura a cena, o tempo e os parâmetros.',
      camera: { position: [0.01, 6, 0.01], target: [0, 0, 0] },
    },
  ],
  references: [],
}
