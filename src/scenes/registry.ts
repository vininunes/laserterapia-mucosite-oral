import { testCubeScript } from '../content/scenes/test-cube'
import { TestCubeScene } from './test-cube-scene'
import { defineScene, type SceneDefinition } from './types'

export const scenes: SceneDefinition[] = [defineScene({ script: testCubeScript, Component: TestCubeScene })]

export function findScene(id: string | undefined): SceneDefinition | undefined {
  return scenes.find((s) => s.script.id === id)
}
