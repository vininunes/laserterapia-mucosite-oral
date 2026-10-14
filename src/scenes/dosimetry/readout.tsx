import { contextInfo, guidelineNotes, protocols, type PbmProtocol } from '../../content/protocols'
import { references } from '../../content/references'
import { protocolName, type DosimetryParams } from '../../content/scenes/dosimetry'
import { deriveDose } from '../../model/dosimetry'
import { formatCompact, formatDuration, formatNumber, formatRange } from '../../ui/format-number'
import type { SceneProps } from '../types'

function Warning({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] leading-relaxed text-warning">⚠ {children}</p>
}

/** Fluência calculada, com alerta quando difere da publicada. */
function Fluence({ p }: { p: PbmProtocol }) {
  const d = deriveDose(p)
  return (
    <span className={d.fluenceMismatch ? 'text-warning' : undefined}>
      {formatNumber(d.computedFluenceJcm2, 2)}
      {d.fluenceMismatch && ' ⚠'}
    </span>
  )
}

function Comparison() {
  const mismatched = protocols.filter((p) => deriveDose(p).fluenceMismatch)
  return (
    <div className="flex flex-col gap-2">
      <table className="w-full text-[11px] tabular-nums">
        <thead>
          <tr className="text-[10px] text-muted-foreground">
            <th className="pb-1 text-left font-normal">Protocolo</th>
            <th className="pb-1 text-right font-normal">mW/cm²</th>
            <th className="pb-1 text-right font-normal">s</th>
            <th className="pb-1 text-right font-normal">J/cm²</th>
            <th className="pb-1 text-right font-normal">mW</th>
          </tr>
        </thead>
        <tbody className="[&_td]:py-0.5">
          {protocols.map((p) => (
            <tr key={p.id}>
              <td className="pr-1 whitespace-nowrap">{protocolName(p)}</td>
              <td className="text-right">{formatCompact(p.irradianceMwCm2)}</td>
              <td className="text-right">{p.timePerPointS}</td>
              <td className="text-right">
                <Fluence p={p} />
              </td>
              <td className="text-right">{formatNumber(deriveDose(p).powerMw, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-muted-foreground">
        J/cm² calculado (irradiância × tempo). mW = potência no spot (irradiância × área).
      </p>
      {mismatched.map((p) => (
        <Warning key={p.id}>
          {protocolName(p)}: o resumo publica {formatNumber(p.reportedFluenceJcm2, 1)} J/cm², mas{' '}
          {formatCompact(p.irradianceMwCm2)} × {p.timePerPointS} s = {formatNumber(deriveDose(p).computedFluenceJcm2, 2)}{' '}
          J/cm². Conferir no artigo original antes de usar.
        </Warning>
      ))}
    </div>
  )
}

function Detail({ p }: { p: PbmProtocol }) {
  const d = deriveDose(p)
  const ctx = contextInfo[p.context]
  const rows: [string, React.ReactNode][] = [
    ['λ', `${formatCompact(p.wavelengthNm)} nm`],
    ['Irradiância', `${formatCompact(p.irradianceMwCm2)} mW/cm²`],
    ['Tempo por ponto', `${p.timePerPointS} s`],
    ['Densidade de energia publicada', `${formatNumber(p.reportedFluenceJcm2, 1)} J/cm²`],
    ['Densidade de energia calculada', <><Fluence p={p} /> J/cm²</>],
    ['Spot', `${formatCompact(p.spotCm2)} cm²`],
    ['Potência no spot', `${formatNumber(d.powerMw, 1)} mW`],
    ['Energia por ponto', `${formatNumber(d.energyPerPointJ, 2)} J`],
    ['Pontos por sessão', formatRange(p.points, String)],
    ['Irradiação por sessão', formatRange(d.sessionTimeS, formatDuration)],
    ['Energia por sessão', formatRange(d.sessionEnergyJ, (v) => `${formatNumber(v, 1)} J`)],
    ['Nível de evidência', ctx.evidenceLevel],
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] leading-relaxed text-muted-foreground">{ctx.label}.</p>
      <table className="w-full text-[11px] tabular-nums">
        <tbody className="[&_td]:py-0.5">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="pr-2 text-muted-foreground">{label}</td>
              <td className="text-right">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px]">
        <span className="text-muted-foreground">Duração: </span>
        {p.schedule}
      </p>
      {d.fluenceMismatch && (
        <Warning>
          Irradiância × tempo dá {formatNumber(d.computedFluenceJcm2, 2)} J/cm², não{' '}
          {formatNumber(p.reportedFluenceJcm2, 1)}. Conferir no artigo original.
        </Warning>
      )}
      {p.flags.map((f) => (
        <Warning key={f}>{f}</Warning>
      ))}
      <p className="text-[10px] leading-relaxed text-muted-foreground">{guidelineNotes.safety}</p>
    </div>
  )
}

export function DosimetryReadout({ params }: SceneProps<DosimetryParams>) {
  const focused = protocols[params.focus]
  const zadik = references['zadik-2019']

  return (
    <div className="flex flex-col gap-3 text-xs">
      {focused ? <Detail p={focused} /> : <Comparison />}

      <div className="flex flex-col gap-1 border-t pt-2 text-[10px] leading-relaxed text-muted-foreground">
        <p>
          Fonte: Zadik et al., 2019 (MASCC/ISOO), doi:{zadik.doi}. Valores transcritos do resumo da diretriz;
          conferência com o artigo pendente.
        </p>
        <p>
          {guidelineNotes.followWholeProtocol} {guidelineNotes.oralCancer} {guidelineNotes.noGuidelineChemoOnly}
        </p>
        <p className="font-medium text-foreground">
          Conteúdo didático: não substitui a diretriz nem a orientação clínica.
        </p>
      </div>
    </div>
  )
}
