import { Grid } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'

import { protocols } from '../../content/protocols'
import { protocolName, DOSE_START, type DosimetryParams } from '../../content/scenes/dosimetry'
import { deriveDose, DIMMED_EMPHASIS } from '../../model/dosimetry'
import { formatCompact, formatNumber } from '../../ui/format-number'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import type { SceneProps } from '../types'
import { useCompactCanvas } from '../use-compact-canvas'
import { COMPACT_LABEL_CLASS, DoseLane } from './dose-lane'

/** Escala real: 1 unidade = 1 cm. */
export const LANE_SPACING = 2.6
const SLAB_DEPTH = 4.6
/** Cor ilustrativa da mucosa: conteúdo da cena, não UI. */
export const MUCOSA_COLOR = '#d9a0a0'

/** Placa de mucosa com grade de 1 cm, topo em y = 0. */
export function MucosaSlab({ width }: { width: number }) {
  const tokens = useThemeTokens()
  return (
    <>
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
    </>
  )
}

/** Folga (px) mínima entre rótulos compactos. */
const DECLUTTER_GAP = 3

/**
 * Em tela estreita as pistas ficam mais próximas que a largura dos rótulos,
 * e na vista oblíqua eles ainda se aproximam na diagonal. Depois que cada
 * `SceneLabel` se posiciona no frame, desce os que encostam num rótulo já
 * colocado (da esquerda para a direita) até ficarem livres. Precisa vir
 * depois das pistas na árvore: o `useFrame` roda na ordem de montagem.
 */
function LabelDeclutter() {
  const gl = useThree((s) => s.gl)

  useFrame(() => {
    const container = gl.domElement.parentElement
    if (!container) return
    const items = [...container.querySelectorAll<HTMLElement>(`.${COMPACT_LABEL_CLASS}`)]
      .filter((el) => el.style.display !== 'none')
      .map((el) => ({ el, rect: el.getBoundingClientRect() }))
      .sort((a, b) => a.rect.left - b.rect.left)

    const placed: { left: number; right: number; top: number; bottom: number }[] = []
    for (const { el, rect } of items) {
      let top = rect.top
      let moved = true
      while (moved) {
        moved = false
        for (const p of placed) {
          const overlapsX = rect.left < p.right + DECLUTTER_GAP && rect.right + DECLUTTER_GAP > p.left
          if (overlapsX && top < p.bottom + DECLUTTER_GAP && top + rect.height > p.top) {
            top = p.bottom + DECLUTTER_GAP
            moved = true
          }
        }
      }
      if (top !== rect.top) el.style.transform += ` translateY(${top - rect.top}px)`
      placed.push({ left: rect.left, right: rect.right, top, bottom: top + rect.height })
    }
  })

  return null
}

export function DosimetryScene({ params }: SceneProps<DosimetryParams>) {
  const compact = useCompactCanvas()
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 8, 5]} intensity={1.4} />
      <MucosaSlab width={protocols.length * LANE_SPACING + 1} />

      {protocols.map((p, i) => {
        const d = deriveDose(p)
        return (
          <DoseLane
            key={p.id}
            x={(i - (protocols.length - 1) / 2) * LANE_SPACING}
            wavelengthNm={p.wavelengthNm}
            timing={p}
            spotCm2={p.spotCm2}
            name={protocolName(p)}
            spec={`${formatCompact(p.irradianceMwCm2)} mW/cm² · ${formatCompact(p.spotCm2)} cm²`}
            start={DOSE_START}
            emphasis={params.focus < 0 || params.focus === i ? 1 : DIMMED_EMPHASIS}
            labels={compact ? 'narrow' : 'rows'}
            marks={[
              {
                fluenceJcm2: p.reportedFluenceJcm2,
                warn: d.fluenceMismatch,
                label: d.fluenceMismatch
                  ? `⚠ ${compact ? '' : 'publicado '}${formatNumber(p.reportedFluenceJcm2, 1)}`
                  : undefined,
              },
            ]}
          />
        )
      })}
      {/* Monta no mesmo commit que os rótulos compactos, então roda depois deles. */}
      {compact && <LabelDeclutter />}
    </>
  )
}
