import { useLayoutEffect, useMemo, useRef } from 'react'

import { Line } from '@react-three/drei'
import {
  Color,
  DoubleSide,
  Object3D,
  SRGBColorSpace,
  type InstancedMesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from 'three'

import { useClockFrame } from '../../clock/use-simulation-clock'
import { TISSUE_FOCUS_CELL, TISSUE_TIMING, type TissueParams } from '../../content/scenes/tissue'
import { depthReachedBy, Fate, pathDuration, pathEnd, pathPosition, type McResult } from '../../model/monte-carlo'
import { wavelengthToRgb } from '../../model/spectrum'
import { isTissueWavelength, mucosaLayers, type TissueWavelength } from '../../model/tissue-optics'
import type { Vec3 } from '../../model/types'
import { formatCompact, formatNumber } from '../../ui/format-number'
import { cn } from '../../ui/lib/cn'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import { MEMBRANE, NUCLEUS } from '../cell/colors'
import { LeaderLabels } from '../leader-labels'
import { SceneLabel } from '../scene-label'
import type { SceneProps } from '../types'
import { useCompactCanvas } from '../use-compact-canvas'
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

/**
 * Células do epitélio, as células-alvo que a cena 3 mostra por dentro. Fora de
 * escala: uma célula real mede poucas dezenas de µm e sumiria num bloco em mm.
 * Três fileiras na face da frente, como num corte: basais altas embaixo,
 * intermediárias poligonais e superficiais achatadas no topo.
 */
function EpitheliumCells({ nm, focus }: { nm: TissueWavelength; focus?: Vec3 }) {
  const thickness = mucosaLayers(nm)[0].thicknessCm * MM
  const cells = useRef<InstancedMesh>(null)
  const nuclei = useRef<InstancedMesh>(null)

  const layout = useMemo(() => {
    const gap = 0.05 * thickness
    // De baixo para cima: [largura, altura] de cada fileira, em frações da espessura.
    const rows: [number, number][] = [
      [0.32, 0.36],
      [0.46, 0.3],
      [0.66, 0.14],
    ]
    const out: { x: number; y: number; w: number; h: number }[] = []
    let bottom = -thickness + gap
    rows.forEach(([wk, hk], r) => {
      const w = wk * thickness
      const h = hk * thickness
      const n = Math.floor((BLOCK_HALF_WIDTH * 2 - gap) / (w + gap))
      const span = n * (w + gap) - gap
      // Fileiras alternadas deslocadas meia célula, como num epitélio
      // estratificado. A do meio fica centrada: tem uma célula em x = 0, a
      // célula-alvo que a câmera enquadra no fim da cena.
      const shifted = r !== 1
      const shift = shifted ? (w + gap) / 2 : 0
      for (let k = 0; k < n - (shifted ? 1 : 0); k++) {
        out.push({ x: -span / 2 + w / 2 + k * (w + gap) + shift, y: bottom + h / 2, w, h })
      }
      bottom += h + gap
    })
    return out
  }, [thickness])

  const focused = useMemo(() => {
    if (!focus) return null
    const z = BLOCK_HALF_DEPTH - 0.08
    // Primeiro a fileira (a altura mais próxima), depois a célula nela.
    let best = layout[0]
    for (const c of layout) {
      const dy = Math.abs(c.y - focus[1]) - Math.abs(best.y - focus[1])
      if (dy < -1e-6 || (Math.abs(dy) <= 1e-6 && Math.abs(c.x - focus[0]) < Math.abs(best.x - focus[0]))) best = c
    }
    return { ...best, z }
  }, [layout, focus])

  useLayoutEffect(() => {
    const c = cells.current
    const n = nuclei.current
    if (!c || !n) return
    const z = BLOCK_HALF_DEPTH - 0.08
    layout.forEach(({ x, y, w, h }, i) => {
      dummy.position.set(x, y, z)
      dummy.scale.set(w / 2, h / 2, 0.06)
      dummy.updateMatrix()
      c.setMatrixAt(i, dummy.matrix)
      const k = Math.min(w, h) * 0.32
      dummy.position.set(x, y, z + 0.02)
      dummy.scale.set(k, k, 0.04)
      dummy.updateMatrix()
      n.setMatrixAt(i, dummy.matrix)
    })
    c.instanceMatrix.needsUpdate = true
    n.instanceMatrix.needsUpdate = true
  }, [layout])

  return (
    <>
      <instancedMesh key={`c-${layout.length}`} ref={cells} args={[undefined, undefined, layout.length]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color={MEMBRANE} transparent opacity={0.6} roughness={0.4} depthWrite={false} />
      </instancedMesh>
      <instancedMesh key={`n-${layout.length}`} ref={nuclei} args={[undefined, undefined, layout.length]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={NUCLEUS} transparent opacity={0.85} roughness={0.6} />
      </instancedMesh>
      {focused && <FocusedCell {...focused} />}
    </>
  )
}

/** Quanto antes da etapa o destaque começa a acender (a câmera já está a caminho). */
const FOCUS_FADE_S = 2

/**
 * Destaque da célula-alvo na última etapa: a célula acesa por cima da
 * original e um anel em volta, com o rótulo que liga à cena 3.
 */
function FocusedCell({ x, y, z, w, h }: { x: number; y: number; z: number; w: number; h: number }) {
  const tokens = useThemeTokens()
  const glow = useRef<MeshStandardMaterial>(null)
  const ring = useRef<MeshBasicMaterial>(null)
  const label = useRef<HTMLDivElement>(null)

  useClockFrame((t) => {
    const k = Math.min(Math.max((t - (TISSUE_TIMING.focusCell - FOCUS_FADE_S)) / FOCUS_FADE_S, 0), 1)
    if (glow.current) glow.current.opacity = 0.9 * k
    if (ring.current) ring.current.opacity = k
    if (label.current) label.current.style.opacity = String(k)
  })

  return (
    <group position={[x, y, z]}>
      {/* Um pouco atrás do núcleo (que vai até z + 0,06), para ele aparecer na frente do brilho. */}
      <mesh position={[0, 0, -0.01]} scale={[(w / 2) * 1.06, (h / 2) * 1.06, 0.06]}>
        <sphereGeometry args={[1, 24, 14]} />
        <meshStandardMaterial
          ref={glow}
          color={MEMBRANE}
          emissive={MEMBRANE}
          emissiveIntensity={0.6}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.08]} scale={[w / 2, h / 2, 1]}>
        <ringGeometry args={[1.25, 1.4, 48]} />
        <meshBasicMaterial ref={ring} color={tokens.foreground} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* Logo acima do anel (raio 1,4 × meia altura): mais alto, cairia na fileira de cima. */}
      <SceneLabel ref={label} position={[0, (h / 2) * 1.4 + 0.035, 0.08]} text="célula-alvo · cena 3" className="text-xs" />
    </group>
  )
}

function LayerLabels({ nm, compact }: { nm: TissueWavelength; compact: boolean }) {
  const [epi, lp] = mucosaLayers(nm)
  const epiMm = epi.thicknessCm * MM
  const lpMm = lp.thicknessCm * MM
  const at = (y: number): Vec3 => [-BLOCK_HALF_WIDTH, y, BLOCK_HALF_DEPTH]
  const epiText = formatNumber(epiMm, 2)
  const lpText = formatNumber(lpMm, 2)
  const items = compact
    ? [
        { y: -epiMm / 2, text: `epitélio\n${epiText} mm\ncélulas-alvo\n(cena 3)` },
        { y: -epiMm - lpMm / 2, text: `lâmina própria\n${lpText} mm` },
        { y: -4, text: 'submucosa' },
      ]
    : [
        { y: -epiMm / 2, text: `epitélio ${epiText} mm\ncélulas-alvo · fora de escala (cena 3)` },
        { y: -epiMm - lpMm / 2, text: `lâmina própria ${lpText} mm` },
        { y: -4, text: 'submucosa (espessura não encontrada)' },
      ]

  // As duas camadas finas (0,55 e 0,15 mm) teriam os rótulos encavalados:
  // coluna à esquerda do bloco, fora do tecido, com linha-guia até cada
  // camada. Em tela estreita os textos quebram em linhas e a câmera do
  // roteiro (`cameraCompact`) abre espaço à esquerda.
  return (
    <LeaderLabels
      side="left"
      stack="down"
      offsetPx={compact ? 12 : 16}
      items={items.map(({ y, text }) => ({
        position: at(y),
        text,
        className: cn('leading-tight whitespace-pre text-right text-muted-foreground', compact && 'text-[10px]'),
      }))}
    />
  )
}

/** Fração de fótons que chega a cada profundidade, desenhada ao lado do bloco. */
function DepthCurve({ result, color, compact }: { result: McResult; color: string; compact: boolean }) {
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
          {/* Em tela estreita os rótulos do gráfico do bloco da direita sairiam da
              tela: este vai para dentro do bloco e o do eixo termina no fim dele. */}
          <SceneLabel
            position={compact ? [-BLOCK_HALF_WIDTH + 0.2, -d10 - 0.45, 0] : [x0 + CURVE_WIDTH * 0.1 + 0.15, -d10 - 0.45, 0]}
            anchor="left"
            text={compact ? `10% → ${formatNumber(d10, 1)} mm` : `10% dos fótons chegam a ${formatNumber(d10, 1)} mm`}
            className={compact ? 'text-[10px]' : ''}
          />
        </>
      )}
      <SceneLabel
        position={compact ? [x0 + CURVE_WIDTH, 0.6, 0] : [x0, 0.6, 0]}
        anchor={compact ? 'right' : 'left'}
        text={compact ? '% que chega' : 'fótons que chegam (0–100%)'}
        className={compact ? 'text-[10px] text-muted-foreground' : 'text-muted-foreground'}
      />
    </>
  )
}

function TissueBlock({
  nm,
  offsetX,
  params,
  layerLabels,
  focusCell,
}: {
  nm: TissueWavelength
  offsetX: number
  params: TissueParams
  /** Só o bloco da esquerda nomeia as camadas (as do outro seriam iguais e colidiriam com o gráfico). */
  layerLabels: boolean
  /** Ponto (coordenadas do bloco) da célula-alvo destacada no fim da cena. */
  focusCell?: Vec3
}) {
  const tokens = useThemeTokens()
  const compact = useCompactCanvas()
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
      <EpitheliumCells nm={nm} focus={focusCell} />

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

      {result && <DepthCurve result={result} color={css} compact={compact} />}

      <SceneLabel position={[0, 4.6, 0]} text={title} className="text-sm" />
      {run?.computing && (
        <SceneLabel
          position={[0, -VIEW_DEPTH_MM / 2, 0]}
          text={compact ? 'calculando…' : 'calculando no Web Worker…'}
          className="text-muted-foreground"
        />
      )}
      {layerLabels && <LayerLabels nm={nm} compact={compact} />}
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
      <TissueBlock
        key={`a-${a}`}
        nm={a}
        offsetX={-BLOCK_OFFSET}
        params={params}
        layerLabels
        focusCell={[TISSUE_FOCUS_CELL[0] + BLOCK_OFFSET, TISSUE_FOCUS_CELL[1], TISSUE_FOCUS_CELL[2]]}
      />
      <TissueBlock key={`b-${b}`} nm={b} offsetX={BLOCK_OFFSET} params={params} layerLabels={false} />
    </>
  )
}
