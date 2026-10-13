import { useMemo, useRef } from 'react'

import { Color, Object3D, SRGBColorSpace, type InstancedMesh, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'

import { useClockFrame } from '../../clock/use-simulation-clock'
import { cellTiming } from '../../content/scenes/cell'
import {
  atpParticle,
  CELL_LAYOUT,
  cellModel,
  hash01,
  mediatorParticle,
  noParticle,
  particleDirection,
  type CellParams,
} from '../../model/cell'
import type { Vec3 } from '../../model/types'
import { wavelengthToRgb } from '../../model/spectrum'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import { SceneLabel } from '../scene-label'
import type { SceneProps } from '../types'

/** Cores ilustrativas das estruturas: conteúdo da cena, não UI. */
const MEMBRANE = '#7cc4c0'
const NUCLEUS = '#9b8fd6'
const MITOCHONDRION = '#e9a25f'

const ATP_COUNT = CELL_LAYOUT.atpBase + CELL_LAYOUT.atpExtra
const dummy = new Object3D()

/** Mitocôndrias de fundo (a de foco fica em CELL_LAYOUT.mitochondrion). */
const OTHER_MITOS: { position: Vec3; rotation: Vec3 }[] = [
  { position: [-0.8, 1.9, -1.2], rotation: [0.4, 0.2, 1.1] },
  { position: [0.6, -2.2, -1.4], rotation: [1.2, 0.3, 0.2] },
  { position: [2.3, 1.4, -0.8], rotation: [0.1, 0.9, -0.6] },
  { position: [-2.4, -1.6, 1.2], rotation: [0.8, -0.4, 0.5] },
]

/** Pontos da citocromo c oxidase na membrana interna da mitocôndria em foco (esquemático). */
const CCO_SITES: Vec3[] = [
  CELL_LAYOUT.cco,
  [0.75, -0.25, 0.75],
  [1.65, -0.45, 0.85],
  [1.05, -0.85, 0.75],
  [1.5, 0.05, 0.6],
]

function Mitochondrion({ position, rotation, scale = 1 }: { position: Vec3; rotation: Vec3; scale?: number }) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <capsuleGeometry args={[0.32, 0.9, 8, 16]} />
      <meshStandardMaterial color={MITOCHONDRION} roughness={0.55} transparent opacity={0.9} />
    </mesh>
  )
}

export function CellScene({ params }: SceneProps<CellParams>) {
  const tokens = useThemeTokens()
  const input = useMemo(() => ({ ...params, timing: cellTiming }), [params])
  const photonColor = useMemo(() => {
    const { color } = wavelengthToRgb(params.wavelengthNm)
    return new Color().setRGB(color.r, color.g, color.b, SRGBColorSpace)
  }, [params.wavelengthNm])

  const photon = useRef<Mesh>(null)
  const photonHalo = useRef<Mesh>(null)
  const ccoMeshes = useRef<(Mesh | null)[]>([])
  const atp = useRef<InstancedMesh>(null)
  const no = useRef<InstancedMesh>(null)
  const mediators = useRef<InstancedMesh>(null)
  const signal = useRef<Mesh>(null)
  const neighbors = useRef<InstancedMesh>(null)
  const labels = {
    cco: useRef<HTMLDivElement>(null),
    atp: useRef<HTMLDivElement>(null),
    no: useRef<HTMLDivElement>(null),
    mediators: useRef<HTMLDivElement>(null),
    photon: useRef<HTMLDivElement>(null),
  }

  useClockFrame((t) => {
    const s = cellModel(t, input)

    for (const m of [photon.current, photonHalo.current]) {
      if (!m) continue
      m.position.set(...s.photon.position)
      m.visible = s.photon.opacity > 0
    }

    const glowColor = new Color(tokens.warning)
    const idleColor = new Color(tokens.mutedForeground)
    ccoMeshes.current.forEach((m, i) => {
      if (!m) return
      // Só o sítio atingido acende.
      const g = i === 0 ? s.ccoGlow : 0
      const mat = m.material as MeshBasicMaterial
      mat.color.copy(idleColor).lerp(glowColor, g)
      m.scale.setScalar(1 + g * 0.8)
    })

    const a = atp.current
    if (a) {
      for (let i = 0; i < ATP_COUNT; i++) {
        const p = atpParticle(i, t, s.atpBoost)
        dummy.position.set(...p.position)
        dummy.scale.setScalar(Math.max(p.opacity, 0.0001))
        dummy.updateMatrix()
        a.setMatrixAt(i, dummy.matrix)
      }
      a.instanceMatrix.needsUpdate = true
    }

    const n = no.current
    if (n) {
      for (let i = 0; i < CELL_LAYOUT.noCount; i++) {
        const p = noParticle(i, t, cellTiming.absorb)
        dummy.position.set(...p.position)
        dummy.scale.setScalar(Math.max(p.opacity, 0.0001))
        dummy.updateMatrix()
        n.setMatrixAt(i, dummy.matrix)
      }
      n.instanceMatrix.needsUpdate = true
    }

    const md = mediators.current
    if (md) {
      for (let i = 0; i < CELL_LAYOUT.mediatorCount; i++) {
        dummy.position.set(...mediatorParticle(i, t))
        // A redução aparece como pontos que encolhem e somem, até o piso.
        const keep = hash01(i + 333) < s.mediators
        dummy.scale.setScalar(keep ? 1 : 0.0001)
        dummy.updateMatrix()
        md.setMatrixAt(i, dummy.matrix)
      }
      md.instanceMatrix.needsUpdate = true
    }

    if (signal.current) {
      signal.current.visible = s.signals > 0.01
      signal.current.scale.setScalar(1 + s.signals * 0.6)
      ;(signal.current.material as MeshBasicMaterial).opacity = s.signals * 0.35
    }

    const nb = neighbors.current
    if (nb) {
      nb.visible = s.tissue > 0.01
      ;(nb.material as MeshStandardMaterial).opacity = s.tissue * 0.18
    }

    const show = (el: HTMLDivElement | null, v: number) => {
      if (el) el.style.opacity = String(v)
    }
    show(labels.photon.current, s.photon.opacity)
    show(labels.cco.current, t >= cellTiming.photon ? 1 : 0)
    show(labels.no.current, t >= cellTiming.absorb && t < cellTiming.absorb + 6 ? 1 : 0)
    show(labels.atp.current, s.atpBoost)
    show(labels.mediators.current, 1)
  })

  const neighborMatrices = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = particleDirection(i, 909)
      const o = new Object3D()
      o.position.set(d[0] * 8.5, d[1] * 3, d[2] * 8.5 - 2)
      o.updateMatrix()
      return o.matrix.clone()
    })
  }, [])

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 6]} intensity={1.3} />

      {/* membrana e núcleo */}
      <mesh>
        <sphereGeometry args={[CELL_LAYOUT.cellRadius, 48, 32]} />
        <meshStandardMaterial color={MEMBRANE} transparent opacity={0.13} depthWrite={false} roughness={0.3} />
      </mesh>
      <mesh position={[-1.4, 0.2, -0.3]}>
        <sphereGeometry args={[1.25, 32, 24]} />
        <meshStandardMaterial color={NUCLEUS} transparent opacity={0.55} roughness={0.6} />
      </mesh>

      {/* mitocôndrias */}
      <Mitochondrion position={CELL_LAYOUT.mitochondrion} rotation={[0.2, 0.3, 0.25]} scale={1.45} />
      {OTHER_MITOS.map((m, i) => (
        <Mitochondrion key={i} position={m.position} rotation={m.rotation} />
      ))}

      {/* citocromo c oxidase */}
      {CCO_SITES.map((p, i) => (
        <mesh key={i} ref={(m) => void (ccoMeshes.current[i] = m)} position={p}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={tokens.mutedForeground} />
        </mesh>
      ))}

      {/* fóton na cor do λ (física) */}
      <mesh ref={photon}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color={photonColor} />
      </mesh>
      <mesh ref={photonHalo}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshBasicMaterial color={photonColor} transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {/* sinalização: pulso em volta da mitocôndria e do núcleo */}
      <mesh ref={signal} position={[0, -0.1, 0.1]}>
        <sphereGeometry args={[2.2, 32, 24]} />
        <meshBasicMaterial color={tokens.warning} transparent depthWrite={false} />
      </mesh>

      <instancedMesh ref={atp} args={[undefined, undefined, ATP_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={tokens.positive} />
      </instancedMesh>
      <instancedMesh ref={no} args={[undefined, undefined, CELL_LAYOUT.noCount]} frustumCulled={false}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={tokens.foreground} />
      </instancedMesh>
      <instancedMesh ref={mediators} args={[undefined, undefined, CELL_LAYOUT.mediatorCount]} frustumCulled={false}>
        <icosahedronGeometry args={[0.11, 0]} />
        <meshBasicMaterial color={tokens.destructive} />
      </instancedMesh>

      {/* células vizinhas: volta ao tecido */}
      <instancedMesh
        ref={neighbors}
        args={[undefined, undefined, neighborMatrices.length]}
        onUpdate={(m) => {
          neighborMatrices.forEach((mat, i) => m.setMatrixAt(i, mat))
          m.instanceMatrix.needsUpdate = true
        }}
      >
        <sphereGeometry args={[CELL_LAYOUT.cellRadius * 0.85, 32, 24]} />
        <meshStandardMaterial color={MEMBRANE} transparent depthWrite={false} />
      </instancedMesh>

      <SceneLabel position={[-1.4, 1.75, -0.3]} text="núcleo" className="text-muted-foreground" />
      <SceneLabel position={[-0.8, 2.55, -1.2]} text="mitocôndria" className="text-muted-foreground" />
      <SceneLabel position={[0, CELL_LAYOUT.cellRadius + 0.3, 0]} text="membrana" className="text-muted-foreground" />
      <SceneLabel ref={labels.cco} position={[1.3, 0.45, 1.15]} text="citocromo c oxidase" />
      <SceneLabel ref={labels.photon} position={[3.4, 6.9, 3.5]} text="fóton" />
      <SceneLabel ref={labels.no} position={[2.1, -0.7, 1.5]} text="NO liberado" />
      <SceneLabel ref={labels.atp} position={[2.9, -1.6, 1.2]} text="ATP" className="text-positive" />
      <SceneLabel ref={labels.mediators} position={[5.6, 2.6, 0]} text="mediadores inflamatórios" className="text-destructive" />
    </>
  )
}
