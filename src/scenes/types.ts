import type { ComponentType } from 'react'

import type { SceneScript } from '../content/types'
import type { NumericParams } from '../state/hash-state'

export interface SceneProps<P extends NumericParams = NumericParams> {
  params: P
}

/** Junta roteiro (dados) e renderização. O modelo é usado pelos componentes. */
export interface SceneDefinition<P extends NumericParams = NumericParams> {
  script: SceneScript<P>
  /** Componente R3F, montado dentro do Canvas. */
  Component: ComponentType<SceneProps<P>>
  /** Grandezas derivadas dos parâmetros, em HTML, no painel "Grandezas". */
  Readout?: ComponentType<SceneProps<P>>
}

/** Apaga o tipo dos parâmetros para guardar cenas diferentes na mesma lista. */
export function defineScene<P extends NumericParams>(def: SceneDefinition<P>): SceneDefinition {
  return def as unknown as SceneDefinition
}
