import { protocols } from '../../content/protocols'
import { CALC_START, type CalculatorParams } from '../../content/scenes/calculator'
import { protocolName } from '../../content/scenes/dosimetry'
import { deriveDose, deviceDose } from '../../model/dosimetry'
import { formatCompact, formatNumber } from '../../ui/format-number'
import type { SceneProps } from '../types'
import { DoseLane } from './dose-lane'
import { MucosaSlab } from './scene'

const settingsOf = (p: CalculatorParams) => ({ powerMw: p.powerMw, timeS: p.timeS, areaCm2: p.areaCm2 })

/** Protocolo recomendado com os mesmos ajustes, se houver (tolerância de arredondamento). */
export function matchingProtocol(params: CalculatorParams) {
  return protocols.find(
    (p) =>
      p.wavelengthNm === params.wavelengthNm &&
      p.timePerPointS === params.timeS &&
      Math.abs(p.spotCm2 - params.areaCm2) < 1e-6 &&
      Math.abs(p.irradianceMwCm2 * p.spotCm2 - params.powerMw) < 0.01
  )
}

export function CalculatorScene({ params }: SceneProps<CalculatorParams>) {
  const dose = deviceDose(settingsOf(params))

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 8, 5]} intensity={1.4} />
      <MucosaSlab width={5} />
      <DoseLane
        x={0}
        wavelengthNm={params.wavelengthNm}
        timing={{ irradianceMwCm2: dose.irradianceMwCm2, timePerPointS: params.timeS }}
        spotCm2={params.areaCm2}
        name={`${formatCompact(params.powerMw)} mW · ${formatCompact(params.timeS)} s · ${formatCompact(params.areaCm2)} cm²`}
        spec={`${formatNumber(dose.irradianceMwCm2, 0)} mW/cm² → ${formatNumber(dose.fluenceJcm2, 2)} J/cm²`}
        start={CALC_START}
        marks={protocols.map((p) => ({
          fluenceJcm2: p.reportedFluenceJcm2,
          muted: true,
          label: `${protocolName(p)} · ${formatNumber(p.reportedFluenceJcm2, 1)}${deriveDose(p).fluenceMismatch ? ' ⚠' : ''}`,
        }))}
      />
    </>
  )
}
