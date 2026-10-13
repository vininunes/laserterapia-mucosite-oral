import type { CellParams } from '../../model/cell'
import { references } from '../../content/references'
import { cellScript } from '../../content/scenes/cell'
import { spectralRegion } from '../../model/spectrum'
import type { SceneProps } from '../types'

/** Legenda das cores e fontes da cena celular. */
export function CellReadout({ params }: SceneProps<CellParams>) {
  const legend: [string, string][] = [
    ['bg-warning', 'Citocromo c oxidase ativada; pulso amarelo = sinalização'],
    ['bg-positive', 'ATP'],
    ['bg-foreground', 'Óxido nítrico (NO) liberado'],
    ['bg-destructive', 'Mediadores inflamatórios'],
  ]
  const refs = cellScript.references.map((id) => references[id]).filter(Boolean)

  return (
    <div className="flex flex-col gap-3 text-xs">
      <p className="rounded-md bg-muted px-2 py-1.5 text-[11px]">
        Esquema ilustrativo: posições, quantidades e tempos não são medidos. A sequência segue o mecanismo descrito
        na literatura de PBM.
      </p>
      <ul className="flex flex-col gap-1.5 text-[11px]">
        {legend.map(([cls, text]) => (
          <li key={text} className="flex items-center gap-2">
            <span className={`size-2.5 shrink-0 rounded-full ${cls}`} />
            {text}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Fóton de {params.wavelengthNm.toLocaleString('pt-BR')} nm ({spectralRegion(params.wavelengthNm)}). A
        citocromo c oxidase absorve tanto no vermelho quanto no infravermelho próximo.
      </p>
      <div className="flex flex-col gap-1 border-t pt-2 text-[10px] leading-relaxed text-muted-foreground">
        {refs.map((r) => (
          <p key={r.id}>
            {r.citation}
            {r.unverified && <span className="text-warning"> (citação a conferir)</span>}
          </p>
        ))}
      </div>
    </div>
  )
}
