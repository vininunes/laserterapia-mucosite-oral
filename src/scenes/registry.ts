import { calculatorScript } from '../content/scenes/calculator'
import { cellScript } from '../content/scenes/cell'
import { dosimetryScript } from '../content/scenes/dosimetry'
import { emWaveScript } from '../content/scenes/em-wave'
import { CellReadout } from './cell/readout'
import { CellScene } from './cell/scene'
import { CalculatorScene } from './dosimetry/calculator'
import { CalculatorReadout } from './dosimetry/calculator-readout'
import { DosimetryReadout } from './dosimetry/readout'
import { DosimetryScene } from './dosimetry/scene'
import { EmWaveReadout } from './em-wave/readout'
import { EmWaveScene } from './em-wave/scene'
import { defineScene, type SceneDefinition } from './types'

/** Ordem das abas: da física da luz ao tratamento. */
export const scenes: SceneDefinition[] = [
  defineScene({ script: emWaveScript, Component: EmWaveScene, Readout: EmWaveReadout }),
  defineScene({ script: cellScript, Component: CellScene, Readout: CellReadout }),
  defineScene({ script: dosimetryScript, Component: DosimetryScene, Readout: DosimetryReadout }),
  defineScene({ script: calculatorScript, Component: CalculatorScene, Readout: CalculatorReadout }),
]

export function findScene(id: string | undefined): SceneDefinition | undefined {
  return scenes.find((s) => s.script.id === id)
}
