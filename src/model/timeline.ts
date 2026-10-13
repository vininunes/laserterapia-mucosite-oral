import type { Vec3 } from './types'

export interface CameraPose {
  position: Vec3
  target: Vec3
}

export interface TimedStep {
  t: number
  camera?: CameraPose
}

/**
 * Índice da etapa ativa em `t`: a última cujo início é ≤ t. Antes da primeira
 * etapa devolve 0. `steps` deve estar ordenado por `t`.
 */
export function activeStepIndex(steps: readonly TimedStep[], t: number): number {
  let index = 0
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].t <= t) index = i
    else break
  }
  return index
}

function smoothstep(x: number): number {
  const c = Math.min(Math.max(x, 0), 1)
  return c * c * (3 - 2 * c)
}

function lerpVec(a: Vec3, b: Vec3, k: number): Vec3 {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

/**
 * Pose da câmera em `t`, interpolada (smoothstep) entre os keyframes das
 * etapas que têm `camera`. Fora do intervalo, segura o keyframe da ponta.
 * Sem keyframes, devolve `undefined` (a cena decide a câmera).
 */
export function cameraAt(steps: readonly TimedStep[], t: number): CameraPose | undefined {
  const keys = steps.filter((s): s is TimedStep & { camera: CameraPose } => !!s.camera)
  if (keys.length === 0) return undefined
  if (t <= keys[0].t) return keys[0].camera
  const last = keys[keys.length - 1]
  if (t >= last.t) return last.camera

  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i]
    const b = keys[i + 1]
    if (t >= a.t && t <= b.t) {
      const k = smoothstep((t - a.t) / (b.t - a.t))
      return {
        position: lerpVec(a.camera.position, b.camera.position, k),
        target: lerpVec(a.camera.target, b.camera.target, k),
      }
    }
  }
  return last.camera
}
