import { useMemo, useRef } from 'react'

import { Line } from '@react-three/drei'
import { Color, DoubleSide, Object3D, SRGBColorSpace, type InstancedMesh } from 'three'

import { useClockFrame } from '../../clock/use-simulation-clock'
import { TISSUE_TIMING, type TissueParams } from '../../content/scenes/tissue'
import { depthReachedBy, Fate, pathDuration, pathEnd, pathPosition, type McResult } from '../../model/monte-carlo'
import { wavelengthToRgb } from '../../model/spectrum'
import { isTissueWavelength, mucosaLayers, type TissueWavelength } from '../../model/tissue-optics'
import { formatCompact, formatNumber } from '../../ui/format-number'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import { SceneLabel } from '../scene-label'
import type { SceneProps } from '../types'
import { RECORD_PATHS, tissueConfigFor } from './config'
import { useMcRun } from './mc-store'

/** Escala: 1 unidade = 1 mm. O Monte Carlo trabalha em cm. */
const MM = 10
const BLOCK_HALF_WIDTH = 5
const BLOCK_HALF_DEPTH = 3
/** Profundidade desenhada; a submucosa continua além (semi-infinita no modelo). */
const VIEW_DEPTH_MM = 10
const BLOCK_OFFSET = 9
/** Largura do gráfico "fração que chega à profundidade" ao lado do bloco. */
const CURVE_WIDTH = 3.2

/** Cores ilustrativas das camadas: conteúdo da cena, não UI. */
const LAYER_COLORS: Record<string, string> = {
  epitelio: '#f1c6c6',
  'lamina-propria': '#d7868d',
  submucosa: '#ecd5b8',
}

const dummy = new Object3D()
const tmp: [number, number, number] = [0, 0, 0]

function insideView(x: number, y: number, z: number) {
  return Math.abs(x) <= BLOCK_HALF_WIDTH && Math.abs(z) <= BLOCK_HALF_DEPTH && y <= 0.02 && y >= -VIEW_DEPTH_MM
}

function Layers({ nm }: { nm: TissueWavelength }) {
  const layers = mucosaLayers(nm)
  let top = 0
  return (
    <>
      {layers.map((l) => {
        const thickness = l.semiInfinite ? VIEW_DEPTH_MM + top : l.thicknessCm * MM
        const y = top - thickness / 2
        top -= thickness
        return (
          <mesh key={l.id} position={[0, y, 0]}>
            <boxGeometry args={[BLOCK_HALF_WIDTH * 2, thickness, BLOCK_HALF_DEPTH * 2]} />
            <meshStandardMaterial
              color={LAYER_COLORS[l.id]}
              transparent
              opacity={0.22}
              depthWrite={false}
              side={DoubleSide}
            />
          </mesh>
        )
      })}
    </>
  )
}

function LayerLabels({ nm }: { nm: TissueWavelength }) {
  const [epi, lp] = mucosaLayers(nm)
  const epiMm = epi.thicknessCm * MM
  const lpMm = lp.thicknessCm * MM
  return (
    <>
      <SceneLabel
        position={[-BLOCK_HALF_WIDTH - 0.2, -epiMm / 2, BLOCK_HALF_DEPTH]}
        anchor="right"
        text={`epitélio ${formatNumber(epiMm, 2)} mm`}
        className="text-muted-foreground"
      />
      <SceneLabel
        position={[-BLOCK_HALF_WIDTH - 0.2, -epiMm - lpMm / 2 - 0.35, BLOCK_HALF_DEPTH]}
        anchor="right"
        text={`lâmina própria ${formatNumber(lpMm, 2)} mm`}
        className="text-muted-foreground"
      />
      <SceneLabel
        position={[-BLOCK_HALF_WIDTH - 0.2, -4, BLOCK_HALF_DEPTH]}
        anchor="right"
        text="submucosa (espessura não encontrada)"
        className="text-muted-foreground"
      />
    </>
  )
}

/** Fração de fótons que chega a cada profundidade, desenhada ao lado do bloco. */
function DepthCurve({ result, color }: { result: McResult; color: string }) {
  const tokens = useThemeTokens()
  const x0 = BLOCK_HALF_WIDTH + 0.6
  const points = useMemo(() => {
    const pts: [number, number, number][] = [[x0, 0, 0]]
    result.reachedDepth.forEach((f, k) => {
      const depth = (k + 1) * result.binCm * MM
      if (depth <= VIEW_DEPTH_MM) pts.push([x0 + f * CURVE_WIDTH, -depth, 0])
    })
    return pts
  }, [result, x0])
  const d10 = depthReachedBy(result, 0.1) * MM

  return (
    <>
      <Line points={[[x0, 0, 0], [x0, -VIEW_DEPTH_MM, 0]]} color={tokens.border} lineWidth={1} />
      <Line points={[[x0, 0.15, 0], [x0 + CURVE_WIDTH, 0.15, 0]]} color={tokens.border} lineWidth={1} />
      <Line points={points} color={color} lineWidth={2} />
      {d10 <= VIEW_DEPTH_MM && (
        <>
          <Line
            points={[[-BLOCK_HALF_WIDTH, -d10, 0], [x0 + CURVE_WIDTH, -d10, 0]]}
            color={tokens.foreground}
            lineWidth={1}
            dashed
            dashSize={0.25}
            gapSize={0.18}
          />
          <SceneLabel
            position={[x0 + CURVE_WIDTH * 0.1 + 0.15, -d10 - 0.45, 0]}
            anchor="left"
            text={`10% dos fótons chegam a ${formatNumber(d10, 1)} mm`}
          />
        </>
      )}
      <SceneLabel position={[x0, 0.6, 0]} anchor="left" text="fótons que chegam (0–100%)" className="text-muted-foreground" />
    </>
  )
}

function TissueBlock({
  nm,
  offsetX,
  params,
  layerLabels,
}: {
  nm: TissueWavelength
  offsetX: number
  params: TissueParams
  /** Só o bloco da esquerda nomeia as camadas (as do outro seriam iguais e colidiriam com o gráfico). */
  layerLabels: boolean
}) {
  const tokens = useThemeTokens()
  const run = useMcRun(tissueConfigFor(nm, params))
  const result = run?.result ?? null
  const { color: rgb, visible } = wavelengthToRgb(nm)
  const beamColor = useMemo(() => new Color().setRGB(rgb.r, rgb.g, rgb.b, SRGBColorSpace), [rgb.r, rgb.g, rgb.b])
  const css = `#${beamColor.getHexString(SRGBColorSpace)}`

  const heads = useRef<InstancedMesh>(null)
  const marks = useRef<InstancedMesh>(null)

  useClockFrame((t) => {
    const h = heads.current
    const m = marks.current
    if (!h || !m) return
    const count = result ? Math.min(RECORD_PATHS, result.pathLengths.length) : 0
    for (let i = 0; i < RECORD_PATHS; i++) {
      let showHead = false
      let showMark = false
      if (i < count && result) {
        const launch = TISSUE_TIMING.launchStart + (i / RECORD_PATHS) * TISSUE_TIMING.launchWindow
        const local = t - launch
        if (pathPosition(result, i, local, TISSUE_TIMING.verticesPerSecond, tmp)) {
          const [x, y, z] = [tmp[0] * MM, -tmp[2] * MM, tmp[1] * MM]
          if (insideView(x, y, z)) {
            dummy.position.set(x, y, z)
            showHead = true
          }
        }
        const complete = result.pathLengths[i] < (result.pathStride / 3)
        if (
          !showHead &&
          result.fates[i] === Fate.Absorbed &&
          complete &&
          local >= pathDuration(result, i, TISSUE_TIMING.verticesPerSecond)
        ) {
          pathEnd(result, i, tmp)
          const [x, y, z] = [tmp[0] * MM, -tmp[2] * MM, tmp[1] * MM]
          if (insideView(x, y, z)) {
            dummy.position.set(x, y, z)
            showMark = true
          }
        }
      }
      dummy.scale.setScalar(showHead ? 1 : 0.0001)
      dummy.updateMatrix()
      h.setMatrixAt(i, dummy.matrix)
      dummy.scale.setScalar(showMark ? 1 : 0.0001)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    h.instanceMatrix.needsUpdate = true
    m.instanceMatrix.needsUpdate = true
  })

  const title = `${formatCompact(nm)} nm${visible ? '' : ' · infravermelho'}`

  return (
    <group position={[offsetX, 0, 0]}>
      <Layers nm={nm} />

      {/* feixe incidente: spot de 1 mm de diâmetro */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 4, 32, 1, true]} />
        <meshBasicMaterial color={beamColor} transparent opacity={0.18} depthWrite={false} side={DoubleSide} />
      </mesh>

      <instancedMesh ref={heads} args={[undefined, undefined, RECORD_PATHS]} frustumCulled={false}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshBasicMaterial color={beamColor} />
      </instancedMesh>
      <instancedMesh ref={marks} args={[undefined, undefined, RECORD_PATHS]} frustumCulled={false}>
        <sphereGeometry args={[0.045, 5, 5]} />
        <meshBasicMaterial color={tokens.foreground} transparent opacity={0.55} />
      </instancedMesh>

      {result && <DepthCurve result={result} color={css} />}

      <SceneLabel position={[0, 4.6, 0]} text={title} className="text-sm" />
      {run?.computing && (
        <SceneLabel position={[0, -VIEW_DEPTH_MM / 2, 0]} text="calculando no Web Worker…" className="text-muted-foreground" />
      )}
      {layerLabels && <LayerLabels nm={nm} />}
    </group>
  )
}

export function TissueScene({ params }: SceneProps<TissueParams>) {
  const a = isTissueWavelength(params.wavelengthA) ? params.wavelengthA : 660
  const b = isTissueWavelength(params.wavelengthB) ? params.wavelengthB : 808

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 8, 6]} intensity={1.1} />
      <TissueBlock key={`a-${a}`} nm={a} offsetX={-BLOCK_OFFSET} params={params} layerLabels />
      <TissueBlock key={`b-${b}`} nm={b} offsetX={BLOCK_OFFSET} params={params} layerLabels={false} />
    </>
  )
}
