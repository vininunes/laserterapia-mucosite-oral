import { frequencyHz, photonEnergyEv, photonEnergyJ } from '../../model/photon'
import { spectralRegion, wavelengthToRgb } from '../../model/spectrum'
import type { EmWaveParams } from '../../model/em-wave'
import { cn } from '../../ui/lib/cn'
import { formatNumber, formatScientific } from '../../ui/format-number'
import type { SceneProps } from '../types'

function Swatch({ nm }: { nm: number }) {
  const { color, visible } = wavelengthToRgb(nm)
  const rgb = `rgb(${Math.round(color.r * 255)} ${Math.round(color.g * 255)} ${Math.round(color.b * 255)})`
  return (
    <span
      className={cn('inline-block size-3 shrink-0 rounded-sm', !visible && 'outline-1 outline-offset-1 outline-dashed outline-muted-foreground')}
      style={{ background: rgb }}
      title={visible ? 'Cor aproximada' : 'Radiação invisível: cor só de representação'}
    />
  )
}

/** Grandezas calculadas a partir de λ. Não dependem do tempo. */
export function EmWaveReadout({ params }: SceneProps<EmWaveParams>) {
  const lasers = [
    { name: 'Laser A', nm: params.wavelengthA },
    ...(params.compare ? [{ name: 'Laser B', nm: params.wavelengthB }] : []),
  ]

  return (
    <div className="flex flex-col gap-3 text-xs">
      <table className="w-full tabular-nums">
        <thead>
          <tr className="text-[10px] text-muted-foreground">
            <th className="pb-1 text-left font-normal" />
            {lasers.map((l) => (
              <th key={l.name} className="pb-1 text-right font-normal">
                <span className="inline-flex items-center gap-1.5">
                  <Swatch nm={l.nm} />
                  {l.name}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_td]:py-0.5">
          <Row label="λ" values={lasers.map((l) => `${l.nm} nm`)} />
          <Row label="Região" values={lasers.map((l) => spectralRegion(l.nm))} />
          <Row label="f = c/λ" values={lasers.map((l) => `${formatNumber(frequencyHz(l.nm) / 1e12, 0)} THz`)} />
          <Row label="E = hc/λ" values={lasers.map((l) => `${formatNumber(photonEnergyEv(l.nm), 3)} eV`)} />
          <Row label="" values={lasers.map((l) => `${formatScientific(photonEnergyJ(l.nm))} J`)} muted />
        </tbody>
      </table>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        h, c e e: valores exatos do SI (BIPM, 2019). Cor do feixe: aproximação de Bruton (1996); fora de 380–780 nm a
        cor é apenas representação. Escala ilustrativa: na tela a onda anda devagar e a frequência não é a real; só a
        proporção entre os comprimentos de onda é mantida.
      </p>
    </div>
  )
}

function Row({ label, values, muted }: { label: string; values: string[]; muted?: boolean }) {
  return (
    <tr className={cn(muted && 'text-muted-foreground')}>
      <td className="pr-2 text-muted-foreground">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="text-right whitespace-nowrap">
          {v}
        </td>
      ))}
    </tr>
  )
}
