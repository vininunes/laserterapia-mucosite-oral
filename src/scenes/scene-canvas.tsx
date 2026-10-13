import { useEffect, useRef } from 'react'

import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { Vector3 } from 'three'

import type { ScriptStep } from '../content/types'
import { useClock } from '../clock/use-simulation-clock'
import { cameraAt } from '../model/timeline'
import type { NumericParams } from '../state/hash-state'
import { useThemeTokens } from '../ui/theme/theme-tokens'
import type { SceneDefinition } from './types'

/**
 * `frameloop="demand"`: nada é desenhado sem motivo. Cada mudança do relógio
 * (tick durante o play, seek pausado) e de parâmetros pede um frame.
 */
function Invalidator({ params }: { params: NumericParams }) {
  const clock = useClock()
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => clock.subscribe(() => invalidate()), [clock, invalidate])
  useEffect(() => invalidate(), [params, invalidate])
  return null
}

/** O que o rig usa dos `OrbitControls` (`makeDefault` os publica em `state.controls`). */
interface OrbitLike {
  target: Vector3
  update(): void
}

/**
 * Aplica os keyframes de câmera do roteiro sempre que `t` muda. Pausado, o
 * usuário pode orbitar livremente; o próximo play ou seek devolve a câmera
 * ao roteiro — assim o mesmo `t` sempre tem o mesmo enquadramento.
 */
function CameraRig({ steps }: { steps: ScriptStep[] }) {
  const clock = useClock()
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null
  const applied = useRef<{ t: number; steps: ScriptStep[] | null }>({ t: Number.NaN, steps: null })

  useFrame(() => {
    const t = clock.getSnapshot().t
    if (applied.current.t === t && applied.current.steps === steps) return
    applied.current = { t, steps }
    const pose = cameraAt(steps, t)
    if (!pose) return
    camera.position.set(...pose.position)
    if (controls) {
      controls.target.set(...pose.target)
      controls.update()
    } else {
      camera.lookAt(...pose.target)
    }
  })

  return null
}

interface SceneCanvasProps {
  scene: SceneDefinition
  params: NumericParams
  className?: string
}

export function SceneCanvas({ scene, params, className }: SceneCanvasProps) {
  const tokens = useThemeTokens()
  const { Component, script } = scene

  return (
    <Canvas
      className={className}
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [3, 2.5, 4], fov: 45, near: 0.05, far: 200 }}
    >
      <color attach="background" args={[tokens.background]} />
      <Invalidator params={params} />
      <OrbitControls makeDefault enableDamping={false} />
      <CameraRig steps={script.steps} />
      {/* `key`: trocar de cena desmonta a anterior; o R3F faz dispose de geometrias e materiais. */}
      <Component key={script.id} params={params} />
    </Canvas>
  )
}
