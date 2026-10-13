import { useMemo, useRef } from 'react'

import { Color, DoubleSide, SRGBColorSpace, type Group, type Mesh, type MeshBasicMaterial, type MeshStandardMaterial } from 'three'

import { useClockFrame } from '../../clock/use-simulation-clock'
import { doseLane, spotRadius, type DoseTiming } from '../../model/dosimetry'
import { wavelengthToRgb } from '../../model/spectrum'
import { formatNumber } from '../../ui/format-number'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import { SceneLabel } from '../scene-label'

/** Escala real: 1 unidade = 1 cm. Só a altura da barra de fluência é fora de escala. */
export const PROBE_HEIGHT = 1.6
export const BAR_Z = -1.3
export const LABEL_Z = 1.25
export const BAR_PER_JCM2 = 0.32
/** Acima disso a barra para de crescer e o rótulo avisa. */
export const BAR_MAX_HEIGHT = 3.2

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

export interface FluenceMark {
  fluenceJcm2: number
  label?: string
  /** Destaque (token `warning`) para marcas que pedem atenção. */
  warn?: boolean
  /** Marca de referência secundária (mais discreta). */
  muted?: boolean
}

export interface DoseLaneProps {
  x: number
  wavelengthNm: number
  timing: DoseTiming
  spotCm2: number
  name: string
  spec: string
  start: number
  /** Ênfase visual (1 = normal). */
  emphasis?: number
  marks?: FluenceMark[]
}

/**
 * Um ponto de irradiação: spot em escala real, feixe na cor do λ (física),
 * sonda, barra da fluência acumulada (I × t) e anéis de referência.
 */
export function DoseLane({ x, wavelengthNm, timing, spotCm2, name, spec, start, emphasis = 1, marks = [] }: DoseLaneProps) {
  const tokens = useThemeTokens()
  const radius = spotRadius(spotCm2)
  const beamColor = useMemo(() => {
    const { color } = wavelengthToRgb(wavelengthNm)
    return new Color().setRGB(color.r, color.g, color.b, SRGBColorSpace)
  }, [wavelengthNm])
  const lane = useMemo(() => ({ start, focus: -1 }), [start])

  const spot = useRef<Mesh>(null)
  const beam = useRef<Mesh>(null)
  const bar = useRef<Mesh>(null)
  const fluenceAnchor = useRef<Group>(null)
  const probe = useRef<Mesh>(null)
  const fluenceLabel = useRef<HTMLDivElement>(null)
  const timerLabel = useRef<HTMLDivElement>(null)
  const nameLabel = useRef<HTMLDivElement>(null)
  const specLabel = useRef<HTMLDivElement>(null)
  const marksGroup = useRef<HTMLDivElement[]>([])

  useClockFrame((t) => {
    const s = doseLane(t, timing, 0, lane)
    const e = emphasis

    if (beam.current) beam.current.visible = s.emitting
    setOpacity(beam.current, beamOpacity(timing.irradianceMwCm2) * e)
    setOpacity(spot.current, (s.emitting ? 0.95 : s.done ? 0.45 : 0.15) * e)
    setOpacity(probe.current, e)

    const fullHeight = s.fluenceJcm2 * BAR_PER_JCM2
    const b = bar.current
    if (b) {
      const h = Math.max(Math.min(fullHeight, BAR_MAX_HEIGHT), 0.001)
      b.visible = s.fluenceJcm2 > 0
      b.scale.y = h
      b.position.y = h / 2
      setOpacity(b, e)
      // O valor acompanha o topo da barra.
      if (fluenceAnchor.current) fluenceAnchor.current.position.y = h + 0.3
    }

    for (const el of [nameLabel.current, specLabel.current, timerLabel.current, ...marksGroup.current]) {
      setLabelOpacity(el, e)
    }
    const f = fluenceLabel.current
    if (f) {
      f.textContent = `${formatNumber(s.fluenceJcm2, 2)} J/cm²${fullHeight > BAR_MAX_HEIGHT ? ' ↑ fora da escala' : ''}`
      setLabelOpacity(f, s.elapsedS > 0 ? e : 0)
    }
    if (timerLabel.current) {
      timerLabel.current.textContent = `${formatNumber(s.elapsedS, 1)} / ${formatNumber(timing.timePerPointS, 0)} s`
    }
  })

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

      {/* barra de fluência acumulada e anéis de referência */}
      <group position={[0, 0, BAR_Z]}>
        <mesh ref={bar}>
          <cylinderGeometry args={[0.16, 0.16, 1, 32]} />
          <meshStandardMaterial color={tokens.primary} transparent roughness={0.4} />
        </mesh>
        {marks.map((m, i) => {
          const y = Math.min(m.fluenceJcm2 * BAR_PER_JCM2, BAR_MAX_HEIGHT)
          const color = m.warn ? tokens.warning : m.muted ? tokens.mutedForeground : tokens.foreground
          return (
            <group key={i} position={[0, y, 0]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={m.muted ? [0.2, 0.23, 40] : [0.2, 0.28, 40]} />
                <meshBasicMaterial color={color} side={DoubleSide} transparent opacity={emphasis} />
              </mesh>
              {m.label && (
                <SceneLabel
                  ref={(el) => {
                    if (el) marksGroup.current[i] = el
                  }}
                  position={[0.32, 0, 0]}
                  anchor="left"
                  text={m.label}
                  className={`text-[10px] ${m.warn ? 'text-warning' : 'text-muted-foreground'}`}
                />
              )}
            </group>
          )
        })}
        <group ref={fluenceAnchor}>
          <SceneLabel ref={fluenceLabel} position={[0, 0, 0]} text="" className="tabular-nums" />
        </group>
      </group>

      <SceneLabel ref={nameLabel} position={[0, 0, LABEL_Z]} text={name} />
      <SceneLabel ref={specLabel} position={[0, 0, LABEL_Z + 0.45]} text={spec} className="text-muted-foreground" />
      <SceneLabel ref={timerLabel} position={[0, 0, LABEL_Z + 0.9]} text="" className="text-muted-foreground tabular-nums" />
    </group>
  )
}
