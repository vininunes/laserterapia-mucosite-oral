import { useSyncExternalStore } from 'react'

import type { SceneScale } from '../content/types'
import type { ScaleStore } from '../scenes/scale-store'
import { cn } from '../ui/lib/cn'
import { FloatCard } from '../ui/primitives/float-card'
import { formatLength, niceScale } from '../ui/scale'

interface ScaleBarProps {
  scale?: SceneScale
  store: ScaleStore
  className?: string
}

/**
 * Barra de escala da cena, como num mapa: um comprimento redondo e o traço
 * com o tamanho correspondente na tela, desenhados direto sobre a cena.
 * Acompanha o zoom da câmera e vale para o plano que ela enquadra (em
 * perspectiva, o que está mais perto parece maior). A ressalva da escala fica
 * no texto de ajuda. Em cena sem escala, um card com o aviso no lugar.
 */
export function ScaleBar({ scale, store, className }: ScaleBarProps) {
  const pxPerUnit = useSyncExternalStore(store.subscribe, store.get)
  if (!scale) return null

  if ('outOfScale' in scale) {
    return (
      <FloatCard className={cn('max-w-56 px-2.5 py-1.5 text-[10px] leading-snug text-muted-foreground', className)}>
        {scale.note}
      </FloatCard>
    )
  }

  const nice = niceScale(pxPerUnit / scale.metersPerUnit)
  if (!nice) return null

  const label = formatLength(nice.meters)
  return (
    <div
      // Sem card: o contorno na cor do fundo mantém traço e texto legíveis sobre a cena.
      className={cn(
        'pointer-events-auto flex items-end gap-2 px-1 text-foreground drop-shadow-[0_0_2px_var(--background)]',
        className
      )}
      title={`Escala: ${label} no plano enquadrado pela câmera.${scale.note ? ` ${scale.note}.` : ''}`}
    >
      {/* Traço em "U" deitado, como nas barras de escala de mapas. */}
      <div className="h-1.5 border-x-2 border-b-2 border-current" style={{ width: nice.px }} aria-hidden />
      <span className="text-[11px] leading-none font-medium tabular-nums">{label}</span>
    </div>
  )
}
