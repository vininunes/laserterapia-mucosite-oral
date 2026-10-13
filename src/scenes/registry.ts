import { dosimetryScript } from '../content/scenes/dosimetry'
import { emWaveScript } from '../content/scenes/em-wave'
import { DosimetryReadout } from './dosimetry/readout'
import { DosimetryScene } from './dosimetry/scene'
import { EmWaveReadout } from './em-wave/readout'
import { EmWaveScene } from './em-wave/scene'
import { defineScene, type SceneDefinition } from './types'

export const scenes: SceneDefinition[] = [
  defineScene({ script: emWaveScript, Component: EmWaveScene, Readout: EmWaveReadout }),
  defineScene({ script: dosimetryScript, Component: DosimetryScene, Readout: DosimetryReadout }),
]

export function findScene(id: string | undefined): SceneDefinition | undefined {
  return scenes.find((s) => s.script.id === id)
}
