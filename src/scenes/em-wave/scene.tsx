import { useEffect, useMemo, useRef } from 'react'

import { Line } from '@react-three/drei'
import { SRGBColorSpace, type Group, type Mesh, type MeshBasicMaterial } from 'three'
import type { Line2 } from 'three/examples/jsm/lines/Line2.js'

import { useClockFrame } from '../../clock/use-simulation-clock'
import { emWaveTiming } from '../../content/scenes/em-wave'
import { EM_SPAN, EM_VISUAL, emWaveModel, sampleField, visualWavelength, type EmWaveParams } from '../../model/em-wave'
import { photonEnergyEv } from '../../model/photon'
import { wavelengthToRgb } from '../../model/spectrum'
import { formatNumber } from '../../ui/format-number'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import type { SceneProps } from '../types'
import { SceneLabel } from '../scene-label'
import { createFieldCurve, setDashed, writeFieldCurve, type FieldCurve } from './wave-lines'

const SAMPLES = 241
const HAIR_EVERY = 6
const AMP = EM_VISUAL.amplitude
const { xMin, xMax } = EM_VISUAL

function useFieldCurves(): [FieldCurve, FieldCurve] {
  const curves = useMemo(
    () => [createFieldCurve(SAMPLES, HAIR_EVERY), createFieldCurve(SAMPLES, HAIR_EVERY)] as [FieldCurve, FieldCurve],
    []
  )
  // <primitive> não é descartado pelo R3F: libera geometrias e materiais aqui.
  useEffect(() => () => curves.forEach((c) => c.dispose()), [curves])
  return curves
}

function sourceLabel(nm: number) {
  return wavelengthToRgb(nm).visible ? `${nm} nm` : `${nm} nm · ${nm > 780 ? 'infravermelho' : 'ultravioleta'} (invisível)`
}

interface LaneRefs {
  group: React.RefObject<Group | null>
  aperture: React.RefObject<Mesh | null>
  eLabel: React.RefObject<HTMLDivElement | null>
  bLabel: React.RefObject<HTMLDivElement | null>
  sourceLabel: React.RefObject<HTMLDivElement | null>
}

function useLaneRefs(): LaneRefs {
  return {
    group: useRef<Group>(null),
    aperture: useRef<Mesh>(null),
    eLabel: useRef<HTMLDivElement>(null),
    bLabel: useRef<HTMLDivElement>(null),
    sourceLabel: useRef<HTMLDivElement>(null),
  }
}

export function EmWaveScene({ params }: SceneProps<EmWaveParams>) {
  const tokens = useThemeTokens()
  const input = useMemo(() => ({ ...params, timing: emWaveTiming }), [params])
  const xs = useMemo(() => Float32Array.from({ length: SAMPLES }, (_, i) => xMin + (EM_SPAN * i) / (SAMPLES - 1)), [])
  const values = useMemo(() => new Float32Array(SAMPLES), [])
  const curves = [useFieldCurves(), useFieldCurves()] as const
  const lanes = [useLaneRefs(), useLaneRefs()] as const
  const ruler = useRef<Group>(null)
  const rulerLine = useRef<Line2>(null)
  const rulerLabel = useRef<HTMLDivElement>(null)
  const photon = useRef<Group>(null)
  const photonLabel = useRef<HTMLDivElement>(null)

  const lambdaA = visualWavelength(params.wavelengthA)

  useClockFrame((t) => {
    const s = emWaveModel(t, input)

    s.waves.forEach((w, i) => {
      const lane = lanes[i]
      const [e, b] = curves[i]
      const g = lane.group.current
      if (!g) return
      g.position.y = w.laneY
      g.visible = w.opacity > 0.001

      sampleField(w, t, values)
      const until = Math.floor(((w.front - xMin) / EM_SPAN) * (SAMPLES - 1))
      writeFieldCurve(e, xs, values, AMP, 1, until, HAIR_EVERY)
      writeFieldCurve(b, xs, values, AMP, 2, until, HAIR_EVERY)
      setDashed(e, !w.visible)

      // Cor do feixe: física (λ → RGB), não token.
      e.line.material.color.setRGB(w.color.r, w.color.g, w.color.b, SRGBColorSpace)
      e.line.material.opacity = w.opacity
      e.hairs.material.color.setRGB(w.color.r, w.color.g, w.color.b, SRGBColorSpace)
      e.hairs.material.opacity = w.opacity * 0.45
      const bAlpha = w.opacity * w.bOpacity
      b.line.visible = b.hairs.visible = bAlpha > 0.001
      b.line.material.color.set(tokens.mutedForeground)
      b.line.material.opacity = bAlpha
      b.hairs.material.color.set(tokens.mutedForeground)
      b.hairs.material.opacity = bAlpha * 0.35

      const aperture = lane.aperture.current
      if (aperture) (aperture.material as MeshBasicMaterial).color.setRGB(w.color.r, w.color.g, w.color.b, SRGBColorSpace)
      if (lane.eLabel.current) lane.eLabel.current.style.opacity = String(w.front > xMax - 0.5 ? w.opacity : 0)
      if (lane.bLabel.current) lane.bLabel.current.style.opacity = String(w.front > xMax - 0.5 ? bAlpha : 0)
      if (lane.sourceLabel.current) lane.sourceLabel.current.style.opacity = String(w.opacity)
    })

    if (ruler.current) ruler.current.visible = s.rulerOpacity > 0.001
    if (rulerLine.current) rulerLine.current.material.opacity = s.rulerOpacity
    if (rulerLabel.current) rulerLabel.current.style.opacity = String(s.rulerOpacity)

    const p = photon.current
    if (p) {
      p.position.x = s.photon.x
      p.visible = s.photon.opacity > 0.001
      p.children.forEach((c, i) => {
        const m = (c as Mesh).material as MeshBasicMaterial | undefined
        if (m) {
          const w = s.waves[0]
          m.color.setRGB(w.color.r, w.color.g, w.color.b, SRGBColorSpace)
          m.opacity = s.photon.opacity * (i === 0 ? 1 : 0.25)
        }
      })
    }
    if (photonLabel.current) photonLabel.current.style.opacity = String(s.photon.opacity)
  })

  const wavelengths = [params.wavelengthA, params.wavelengthB]

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} />

      {lanes.map((lane, i) => (
        <group key={i} ref={lane.group}>
          {/* eixo de propagação */}
          <Line points={[[xMin - 0.2, 0, 0], [xMax + 0.35, 0, 0]]} color={tokens.border} lineWidth={1} />
          <mesh position={[xMax + 0.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.08, 0.3, 16]} />
            <meshBasicMaterial color={tokens.mutedForeground} />
          </mesh>

          {/* fonte: corpo neutro (token) + abertura na cor do feixe */}
          <mesh position={[xMin - 0.5, 0, 0]}>
            <boxGeometry args={[0.6, 0.38, 0.38]} />
            <meshStandardMaterial color={tokens.mutedForeground} roughness={0.6} />
          </mesh>
          <mesh ref={lane.aperture} position={[xMin - 0.18, 0, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshBasicMaterial />
          </mesh>

          <primitive object={curves[i][0].line} />
          <primitive object={curves[i][0].hairs} />
          <primitive object={curves[i][1].line} />
          <primitive object={curves[i][1].hairs} />

          <SceneLabel ref={lane.sourceLabel} position={[xMin - 0.5, -0.45, 0]} className="text-muted-foreground" text={sourceLabel(wavelengths[i])} />
          <SceneLabel ref={lane.eLabel} position={[xMax + 0.1, AMP + 0.3, 0]} text="E" />
          <SceneLabel ref={lane.bLabel} position={[xMax + 0.1, 0, AMP + 0.3]} text="B" />
          {i === 0 && (
            <SceneLabel position={[xMax + 0.55, -0.3, 0]} className="text-muted-foreground" text="propagação" />
          )}

          {i === 0 && (
            <group ref={ruler} position={[0, AMP + 0.45, 0]}>
              <Line
                ref={rulerLine}
                points={[
                  [-lambdaA / 2, -0.12, 0],
                  [-lambdaA / 2, 0, 0],
                  [lambdaA / 2, 0, 0],
                  [lambdaA / 2, -0.12, 0],
                ]}
                color={tokens.foreground}
                lineWidth={1.5}
                transparent
              />
              <SceneLabel ref={rulerLabel} position={[0, 0.25, 0]} text={`λ = ${params.wavelengthA} nm`} />
            </group>
          )}

          {i === 0 && (
            <group ref={photon}>
              <mesh>
                <sphereGeometry args={[0.12, 20, 20]} />
                <meshBasicMaterial transparent depthWrite={false} />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.3, 20, 20]} />
                <meshBasicMaterial transparent depthWrite={false} />
              </mesh>
              <SceneLabel ref={photonLabel} position={[0, 0.5, 0]} text={`fóton · ${formatNumber(photonEnergyEv(params.wavelengthA), 2)} eV`} />
            </group>
          )}
        </group>
      ))}
    </>
  )
}
