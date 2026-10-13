import { Grid } from '@react-three/drei'

import { protocols } from '../../content/protocols'
import { protocolName, DOSE_START, type DosimetryParams } from '../../content/scenes/dosimetry'
import { deriveDose, DIMMED_EMPHASIS } from '../../model/dosimetry'
import { formatCompact, formatNumber } from '../../ui/format-number'
import { useThemeTokens } from '../../ui/theme/theme-tokens'
import type { SceneProps } from '../types'
import { DoseLane } from './dose-lane'

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

export function DosimetryScene({ params }: SceneProps<DosimetryParams>) {
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
            marks={[
              {
                fluenceJcm2: p.reportedFluenceJcm2,
                warn: d.fluenceMismatch,
                label: d.fluenceMismatch ? `⚠ publicado ${formatNumber(p.reportedFluenceJcm2, 1)}` : undefined,
              },
            ]}
          />
        )
      })}
    </>
  )
}
