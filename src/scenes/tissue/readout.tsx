import { parameters, type ScientificParameter } from '../../content/parameters'
import { references } from '../../content/references'
import type { TissueParams } from '../../content/scenes/tissue'
import { depthReachedBy, type McResult } from '../../model/monte-carlo'
import { isTissueWavelength, layerCaveats, mucosaLayers, type TissueWavelength } from '../../model/tissue-optics'
import { formatCompact, formatNumber } from '../../ui/format-number'
import type { SceneProps } from '../types'
import { tissueConfigFor } from './config'
import { useMcRun, type McRun } from './mc-store'

const pct = (v: number) => `${formatNumber(v * 100, 1)}%`

function useRun(nm: TissueWavelength, params: TissueParams) {
  return useMcRun(tissueConfigFor(nm, params))
}

function Cell({ run, pick }: { run: McRun | null; pick: (r: McResult) => string }) {
  if (!run?.result) return <td className="text-right text-muted-foreground">…</td>
  return <td className="text-right">{pick(run.result)}</td>
}

export function TissueReadout({ params }: SceneProps<TissueParams>) {
  const a: TissueWavelength = isTissueWavelength(params.wavelengthA) ? params.wavelengthA : 660
  const b: TissueWavelength = isTissueWavelength(params.wavelengthB) ? params.wavelengthB : 808
  const runs = [useRun(a, params), useRun(b, params)]
  const nms = [a, b]
  const layers = nms.map((nm) => mucosaLayers(nm))
  const caveats = layerCaveats([...layers[0], ...layers[1]])
  const computing = runs.some((r) => r?.computing)
  const elapsed = runs.map((r) => r?.elapsedMs).filter((v): v is number => v !== null && v !== undefined)

  const optics: [string, (nm: number) => string][] = [
    ['μa lâmina própria', (i) => `${formatNumber(layers[i][1].muaPerCm, 3)} cm⁻¹`],
    ["μs' lâmina própria", (i) => `${formatNumber(layers[i][1].musPrimePerCm, 1)} cm⁻¹`],
  ]
  const results: [string, (r: McResult) => string][] = [
    ['Volta à superfície', (r) => pct(r.remitted)],
    ['Absorvido no epitélio', (r) => pct(r.absorbedByLayer[0])],
    ['Absorvido na lâmina própria', (r) => pct(r.absorbedByLayer[1])],
    ['Absorvido na submucosa', (r) => pct(r.absorbedByLayer[2])],
    ['Metade dos fótons chega a', (r) => `${formatNumber(depthReachedBy(r, 0.5) * 10, 1)} mm`],
    ['10% dos fótons chegam a', (r) => `${formatNumber(depthReachedBy(r, 0.1) * 10, 1)} mm`],
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <table className="w-full text-[11px] tabular-nums">
        <thead>
          <tr className="text-[10px] text-muted-foreground">
            <th className="pb-1 text-left font-normal" />
            {nms.map((nm, i) => (
              <th key={i} className="pb-1 text-right font-normal">
                {formatCompact(nm)} nm
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:py-0.5">
          {optics.map(([label, f]) => (
            <tr key={label}>
              <td className="pr-2 text-muted-foreground">{label}</td>
              {nms.map((_, i) => (
                <td key={i} className="text-right">
                  {f(i)}
                </td>
              ))}
            </tr>
          ))}
          {results.map(([label, f]) => (
            <tr key={label}>
              <td className="pr-2 text-muted-foreground">{label}</td>
              {runs.map((run, i) => (
                <Cell key={i} run={run} pick={f} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-[10px] text-muted-foreground">
        {computing
          ? 'Calculando no Web Worker…'
          : `${formatNumber(params.photons, 0)} fótons por λ, semente ${params.seed}${elapsed.length ? `, ${elapsed.map((ms) => formatNumber(ms, 0)).join(' + ')} ms` : ''}. Mesma semente, mesmo resultado.`}
      </p>

      {caveats.pending.map((id) => {
        const p: ScientificParameter = parameters[id]
        return (
          <p key={id} className="text-[10px] leading-relaxed text-warning">
            ⚠ Pendente: {p.label}. {p.note}
          </p>
        )
      })}

      <details className="text-[10px] leading-relaxed text-muted-foreground">
        <summary className="cursor-pointer text-foreground">
          {caveats.proxies.length} valores vêm de outros tecidos (proxy)
        </summary>
        <ul className="mt-1 flex list-disc flex-col gap-1 pl-4">
          {caveats.proxies.map((id) => {
            const p: ScientificParameter = parameters[id]
            return (
              <li key={id}>
                {p.label}: {p.proxyFor} ({references[p.source]?.citation.split('.')[0]}).
              </li>
            )
          })}
        </ul>
      </details>

      <div className="flex flex-col gap-1 border-t pt-2 text-[10px] leading-relaxed text-muted-foreground">
        <p>
          Monte Carlo simplificado: camadas planas, sem diferença de índice de refração na superfície, feixe
          perpendicular. Absorção calculada da hemoglobina e da saturação medidas na mucosa oral in vivo (Greening et
          al., 2016) e do espectro da hemoglobina (Prahl); espalhamento por ajustes publicados (Jacques, 2013).
        </p>
        <p className="font-medium text-foreground">
          Os valores ilustram tendências e aguardam validação do especialista; não são dosimetria clínica.
        </p>
      </div>
    </div>
  )
}
