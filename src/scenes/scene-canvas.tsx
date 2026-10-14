import { useEffect, useRef } from 'react'

import { OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MathUtils, PerspectiveCamera, Vector3 } from 'three'

import type { ScriptStep } from '../content/types'
import { useClock } from '../clock/use-simulation-clock'
import { cameraAt } from '../model/timeline'
import type { NumericParams } from '../state/hash-state'
import { useThemeTokens } from '../ui/theme/theme-tokens'
import type { ScaleStore } from './scale-store'
import type { SceneDefinition } from './types'
import { useCompactCanvas } from './use-compact-canvas'

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

/** Os enquadramentos do roteiro foram feitos para tela larga (~16:9). */
const DESIGN_ASPECT = 1.8
const MAX_PORTRAIT_FACTOR = 2.4

/** Quanto afastar a câmera para manter a largura enquadrada numa tela mais estreita. */
function portraitDistanceFactor(aspect: number) {
  if (!(aspect > 0)) return 1
  return Math.min(Math.max(1, DESIGN_ASPECT / aspect), MAX_PORTRAIT_FACTOR)
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
  const aspect = useThree((s) => s.size.width / s.size.height)
  const compact = useCompactCanvas()
  const applied = useRef<{ t: number; steps: ScriptStep[] | null; aspect: number; compact: boolean }>({
    t: Number.NaN,
    steps: null,
    aspect: Number.NaN,
    compact: false,
  })

  useFrame(() => {
    const t = clock.getSnapshot().t
    const a = applied.current
    if (a.t === t && a.steps === steps && a.aspect === aspect && a.compact === compact) return
    applied.current = { t, steps, aspect, compact }
    const pose = cameraAt(steps, t, compact)
    if (!pose) return
    // O `fov` é vertical: em tela retrato (celular) a largura visível encolhe
    // e a cena sai pelas laterais. Afasta a câmera do alvo na mesma direção.
    const k = portraitDistanceFactor(aspect)
    const [tx, ty, tz] = pose.target
    const [px, py, pz] = pose.position
    camera.position.set(tx + (px - tx) * k, ty + (py - ty) * k, tz + (pz - tz) * k)
    if (controls) {
      controls.target.set(...pose.target)
      controls.update()
    } else {
      camera.lookAt(...pose.target)
    }
  })

  return null
}

const ORIGIN = new Vector3()

/**
 * Mede quantos pixels vale uma unidade 3D na distância do alvo da câmera (o
 * ponto que ela enquadra) e publica no `ScaleStore` da barra de escala. Vem
 * depois do `CameraRig` para medir a pose já aplicada no frame.
 */
function ScaleProbe({ store }: { store: ScaleStore }) {
  const controls = useThree((s) => s.controls) as unknown as OrbitLike | null
  useFrame(({ camera, size }) => {
    if (!(camera instanceof PerspectiveCamera)) return
    const distance = camera.position.distanceTo(controls?.target ?? ORIGIN)
    store.set(size.height / (2 * distance * Math.tan(MathUtils.degToRad(camera.fov) / 2)))
  })
  return null
}

interface SceneCanvasProps {
  scene: SceneDefinition
  params: NumericParams
  scaleStore?: ScaleStore
  className?: string
}

export function SceneCanvas({ scene, params, scaleStore, className }: SceneCanvasProps) {
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
      {scaleStore && <ScaleProbe store={scaleStore} />}
      {/* `key`: trocar de cena desmonta a anterior; o R3F faz dispose de geometrias e materiais. */}
      <Component key={script.id} params={params} />
    </Canvas>
  )
}
