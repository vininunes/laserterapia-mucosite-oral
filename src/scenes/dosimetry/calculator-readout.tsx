import { guidelineNotes } from '../../content/protocols'
import type { CalculatorParams } from '../../content/scenes/calculator'
import { protocolName } from '../../content/scenes/dosimetry'
import { deriveDose, deviceDose } from '../../model/dosimetry'
import { spectralRegion } from '../../model/spectrum'
import { formatCompact, formatNumber } from '../../ui/format-number'
import type { SceneProps } from '../types'
import { matchingProtocol } from './calculator'

function Formula({ label, expr, value }: { label: string; expr: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">{value}</span>
      </div>
      <span className="text-[10px] text-muted-foreground tabular-nums">{expr}</span>
    </div>
  )
}

export function CalculatorReadout({ params }: SceneProps<CalculatorParams>) {
  const { powerMw, timeS, areaCm2, wavelengthNm } = params
  const d = deviceDose({ powerMw, timeS, areaCm2 })
  const match = matchingProtocol(params)

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Formula
        label="Irradiância"
        expr={`${formatCompact(powerMw)} mW ÷ ${formatCompact(areaCm2)} cm²`}
        value={`${formatNumber(d.irradianceMwCm2, 1)} mW/cm²`}
      />
      <Formula
        label="Fluência (densidade de energia)"
        expr={`${formatNumber(d.irradianceMwCm2, 1)} mW/cm² × ${formatCompact(timeS)} s ÷ 1000`}
        value={`${formatNumber(d.fluenceJcm2, 2)} J/cm²`}
      />
      <Formula
        label="Energia no ponto"
        expr={`${formatCompact(powerMw)} mW × ${formatCompact(timeS)} s ÷ 1000`}
        value={`${formatNumber(d.energyJ, 2)} J`}
      />

      {match ? (
        <p className="rounded-md bg-muted px-2 py-1.5 text-[11px]">
          Estes ajustes reproduzem o protocolo <span className="font-medium">{protocolName(match)}</span> (spot{' '}
          {formatCompact(match.spotCm2)} cm²).
          {deriveDose(match).fluenceMismatch && (
            <span className="text-warning">
              {' '}
              ⚠ A fluência publicada é {formatNumber(match.reportedFluenceJcm2, 1)} J/cm²; o cálculo dá{' '}
              {formatNumber(d.fluenceJcm2, 2)}. Conferir no artigo.
            </span>
          )}
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Ajustes livres: não correspondem a nenhum protocolo recomendado.
        </p>
      )}

      {spectralRegion(wavelengthNm) === 'infravermelho' && (
        <p className="text-[11px] text-muted-foreground">
          808 nm não está entre os protocolos recomendados para prevenção listados aqui; aparece só para comparação.
        </p>
      )}

      <div className="flex flex-col gap-1 border-t pt-2 text-[10px] leading-relaxed text-muted-foreground">
        <p>
          Os anéis da barra marcam a fluência publicada de cada protocolo (Zadik et al., 2019). {guidelineNotes.followWholeProtocol}
        </p>
        <p className="font-medium text-foreground">
          Conteúdo didático: não substitui a diretriz nem a orientação clínica.
        </p>
      </div>
    </div>
  )
}
