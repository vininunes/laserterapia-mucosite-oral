import { useMemo, useRef } from 'react'

import { Grid } from '@react-three/drei'
import { Color, DoubleSide, SRGBColorSpace, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'

import { useClockFrame } from '../../clock/use-simulation-clock'
import { protocols, type PbmProtocol } from '../../content/protocols'
import { dosimetryInput, protocolName, type DosimetryParams } from '../../content/scenes/dosimetry'
import { deriveDose, doseLane, spotRadius, type DosimetryInput } from '../../model/dosimetry'
import { wavelengthToRgb } from '../../model/spectrum'
import { formatCompact, formatNumber } from '../../ui/format-number'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import { SceneLabel } from '../scene-label'
import type { SceneProps } from '../types'

/** Escala real: 1 unidade = 1 cm. Só a altura da barra de fluência é fora de escala. */
const LANE_SPACING = 2.6
const PROBE_HEIGHT = 1.6
const BAR_Z = -1.3
const LABEL_Z = 1.25
const BAR_PER_JCM2 = 0.32
const SLAB_DEPTH = 4.6
/** Cor ilustrativa da mucosa: conteúdo da cena, não UI. */
const MUCOSA_COLOR = '#d9a0a0'

/** Brilho do feixe em escala log da irradiância (≈20–1000 mW/cm²). Só indicação visual. */
function beamOpacity(irradiance: number) {
  const k = (Math.log10(irradiance) - Math.log10(20)) / (Math.log10(1000) - Math.log10(20))
  return 0.1 + 0.45 * Math.min(Math.max(k, 0), 1)
}

function setOpacity(mesh: Mesh | null, opacity: number) {
  if (mesh) (mesh.material as MeshBasicMaterial | MeshStandardMaterial).opacity = opacity
}

function setLabelOpacity(el: HTMLDivElement | null, opacity: number) {
  if (el) el.style.opacity = String(opacity)
}

function DoseLane({ protocol, index, input }: { protocol: PbmProtocol; index: number; input: DosimetryInput }) {
  const tokens = useThemeTokens()
  const derived = useMemo(() => deriveDose(protocol), [protocol])
  const radius = spotRadius(protocol.spotCm2)
  // Cor do feixe: física (λ → RGB), não token.
  const beamColor = useMemo(() => {
    const { color } = wavelengthToRgb(protocol.wavelengthNm)
    return new Color().setRGB(color.r, color.g, color.b, SRGBColorSpace)
  }, [protocol.wavelengthNm])
  const x = (index - (protocols.length - 1) / 2) * LANE_SPACING

  const spot = useRef<Mesh>(null)
  const beam = useRef<Mesh>(null)
  const bar = useRef<Mesh>(null)
  const probe = useRef<Mesh>(null)
  const target = useRef<Mesh>(null)
  const fluenceLabel = useRef<HTMLDivElement>(null)
  const timerLabel = useRef<HTMLDivElement>(null)
  const nameLabel = useRef<HTMLDivElement>(null)
  const specLabel = useRef<HTMLDivElement>(null)
  const targetLabel = useRef<HTMLDivElement>(null)

  useClockFrame((t) => {
    const s = doseLane(t, protocol, index, input)
    const e = s.emphasis

    if (beam.current) beam.current.visible = s.emitting
    setOpacity(beam.current, beamOpacity(protocol.irradianceMwCm2) * e)
    setOpacity(spot.current, (s.emitting ? 0.95 : s.done ? 0.45 : 0.15) * e)
    setOpacity(probe.current, e)
    setOpacity(target.current, e)

    const b = bar.current
    if (b) {
      const h = Math.max(s.fluenceJcm2 * BAR_PER_JCM2, 0.001)
      b.visible = s.fluenceJcm2 > 0
      b.scale.y = h
      b.position.y = h / 2
      setOpacity(b, e)
    }

    setLabelOpacity(nameLabel.current, e)
    setLabelOpacity(specLabel.current, e)
    setLabelOpacity(targetLabel.current, e)
    setLabelOpacity(timerLabel.current, e)
    setLabelOpacity(fluenceLabel.current, s.elapsedS > 0 ? e : 0)
    if (fluenceLabel.current) fluenceLabel.current.textContent = `${formatNumber(s.fluenceJcm2, 2)} J/cm²`
    if (timerLabel.current) {
      timerLabel.current.textContent = `${formatNumber(s.elapsedS, 1)} / ${protocol.timePerPointS} s`
    }
  })

  const targetY = protocol.reportedFluenceJcm2 * BAR_PER_JCM2

  return (
    <group position={[x, 0, 0]}>
      {/* spot em escala real */}
      <mesh ref={spot} position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 48]} />
        <meshBasicMaterial color={beamColor} transparent depthWrite={false} />
      </mesh>

      {/* feixe: cone da ponta da fibra até o spot */}
      <mesh ref={beam} position={[0, PROBE_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.04, radius, PROBE_HEIGHT, 48, 1, true]} />
        <meshBasicMaterial color={beamColor} transparent depthWrite={false} side={DoubleSide} />
      </mesh>

      {/* sonda */}
      <mesh ref={probe} position={[0, PROBE_HEIGHT + 0.45, 0]}>
        <cylinderGeometry args={[0.1, 0.06, 0.9, 24]} />
        <meshStandardMaterial color={tokens.mutedForeground} transparent roughness={0.5} />
      </mesh>

      {/* barra de fluência acumulada e anel da fluência publicada */}
      <group position={[0, 0, BAR_Z]}>
        <mesh ref={bar}>
          <cylinderGeometry args={[0.16, 0.16, 1, 32]} />
          <meshStandardMaterial color={tokens.primary} transparent roughness={0.4} />
        </mesh>
        <mesh ref={target} position={[0, targetY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.28, 40]} />
          <meshBasicMaterial
            color={derived.fluenceMismatch ? tokens.warning : tokens.foreground}
            side={DoubleSide}
            transparent
          />
        </mesh>
        <SceneLabel ref={fluenceLabel} position={[0, 2.4, 0]} text="" className="tabular-nums" />
        {derived.fluenceMismatch && (
          <SceneLabel
            ref={targetLabel}
            position={[0.95, targetY, 0]}
            text={`⚠ publicado ${formatNumber(protocol.reportedFluenceJcm2, 1)}`}
            className="text-warning"
          />
        )}
      </group>

      <SceneLabel ref={nameLabel} position={[0, 0, LABEL_Z]} text={protocolName(protocol)} />
      <SceneLabel
        ref={specLabel}
        position={[0, 0, LABEL_Z + 0.45]}
        text={`${formatCompact(protocol.irradianceMwCm2)} mW/cm² · ${formatCompact(protocol.spotCm2)} cm²`}
        className="text-muted-foreground"
      />
      <SceneLabel
        ref={timerLabel}
        position={[0, 0, LABEL_Z + 0.9]}
        text=""
        className="text-muted-foreground tabular-nums"
      />
    </group>
  )
}

export function DosimetryScene({ params }: SceneProps<DosimetryParams>) {
  const tokens = useThemeTokens()
  const input = useMemo(() => dosimetryInput(params), [params])
  const width = protocols.length * LANE_SPACING + 1

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 8, 5]} intensity={1.4} />

      {/* mucosa: placa ilustrativa com topo em y = 0 */}
      <mesh position={[0, -0.12, 0]}>
        <boxGeometry args={[width, 0.24, SLAB_DEPTH]} />
        <meshStandardMaterial color={MUCOSA_COLOR} roughness={0.85} />
      </mesh>
      <Grid
        position={[0, 0.002, 0]}
        args={[width, SLAB_DEPTH]}
        cellSize={1}
        sectionSize={5}
        cellColor={tokens.border}
        sectionColor={tokens.mutedForeground}
        cellThickness={0.6}
        fadeDistance={60}
      />

      {protocols.map((p, i) => (
        <DoseLane key={p.id} protocol={p} index={i} input={input} />
      ))}
    </>
  )
}
