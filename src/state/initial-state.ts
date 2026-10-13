import type { SceneDefinition } from '../scenes/types'
import { decodeHashState, sanitizeParams, type NumericParams } from './hash-state'

export interface ResolvedState {
  scene: SceneDefinition
  params: NumericParams
  t: number
  speed?: number
}

/** Bounds de validação a partir dos controles da cena. */
export function paramBounds(scene: SceneDefinition) {
  return scene.script.controls.map((c) =>
    c.kind === 'slider'
      ? { key: c.key, min: c.min, max: c.max }
      : c.kind === 'select'
        ? { key: c.key, options: c.options.map((o) => o.value) }
        : { key: c.key, options: [0, 1] }
  )
}

/** Resolve o estado lido do hash contra as cenas existentes. */
export function resolveHashState(
  decoded: ReturnType<typeof decodeHashState>,
  scenes: readonly SceneDefinition[],
  fallback: SceneDefinition = scenes[0]
): ResolvedState {
  const scene = scenes.find((s) => s.script.id === decoded.scene) ?? fallback
  // Hash de outra cena (ou cena inexistente): parâmetros e tempo não se aplicam.
  const sameScene = decoded.scene === scene.script.id
  return {
    scene,
    params: sameScene
      ? sanitizeParams(scene.script.defaults, paramBounds(scene), decoded.params)
      : { ...scene.script.defaults },
    t: sameScene ? Math.min(Math.max(decoded.t ?? 0, 0), scene.script.duration) : 0,
    speed: decoded.speed,
  }
}
