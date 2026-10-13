import type { SceneModel } from './types'

/** Cena de teste da Fase 1: cubo girando, só para validar relógio, player e URL. */
export type TestCubeParams = {
  /** Voltas por segundo em torno do eixo Y. */
  rotationSpeed: number
  /** Aresta do cubo, em unidades da cena. */
  size: number
}

export interface TestCubeState {
  rotationX: number
  rotationY: number
  scale: number
}

export const testCubeModel: SceneModel<TestCubeParams, TestCubeState> = (t, params) => ({
  rotationX: 0.35 * Math.sin(t * 0.5),
  rotationY: 2 * Math.PI * params.rotationSpeed * t,
  // Pulso de 5 % a 1 Hz: deixa o scrubbing visível mesmo com rotação zero.
  scale: params.size * (1 + 0.05 * Math.sin(2 * Math.PI * t)),
})
