import { emWaveScript } from '../content/scenes/em-wave'
import { EmWaveReadout } from './em-wave/readout'
import { EmWaveScene } from './em-wave/scene'
import { defineScene, type SceneDefinition } from './types'

export const scenes: SceneDefinition[] = [
  defineScene({ script: emWaveScript, Component: EmWaveScene, Readout: EmWaveReadout }),
]

export function findScene(id: string | undefined): SceneDefinition | undefined {
  return scenes.find((s) => s.script.id === id)
}
