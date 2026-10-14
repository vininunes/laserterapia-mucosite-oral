import type { CameraPose } from '../model/timeline'
import type { NumericParams } from '../state/hash-state'

/** Uma etapa do roteiro: vira marcador no player e legenda na tela. */
export interface ScriptStep {
  /** Início da etapa na timeline, em segundos. */
  t: number
  title: string
  caption: string
  /** Keyframe de câmera; a câmera interpola entre os keyframes vizinhos. */
  camera?: CameraPose
  /** Keyframe para canvas estreito (celular), quando o `camera` não serve. */
  cameraCompact?: CameraPose
}

/** Controles do painel. Todo parâmetro é numérico (toggles usam 0/1) para caber na URL. */
export type ControlDef =
  | {
      kind: 'slider'
      key: string
      label: string
      min: number
      max: number
      step: number
      unit?: string
      /** Id em `parameters.ts` quando o valor tem fonte científica. */
      parameterId?: string
    }
  | { kind: 'select'; key: string; label: string; options: { value: number; label: string }[] }
  | { kind: 'toggle'; key: string; label: string }
  /** Ação, não parâmetro: aplica vários valores de uma vez. Não vai para a URL. */
  | { kind: 'presets'; label: string; placeholder: string; options: { label: string; values: NumericParams }[] }

/** Controles que têm um parâmetro próprio (todos menos `presets`). */
export type KeyedControlDef = Exclude<ControlDef, { kind: 'presets' }>

export function isKeyed(c: ControlDef): c is KeyedControlDef {
  return c.kind !== 'presets'
}

export interface SceneScript<P extends NumericParams = NumericParams> {
  id: string
  title: string
  /** Rótulo curto para as abas. */
  shortTitle: string
  /** Duração total da timeline, em segundos. */
  duration: number
  defaults: P
  controls: ControlDef[]
  /** Ordenadas por `t`. */
  steps: ScriptStep[]
  /** Ids de `references.ts`. */
  references: string[]
  /** Conteúdo esquemático: a UI avisa que é ilustrativo. */
  illustrative?: boolean
}
