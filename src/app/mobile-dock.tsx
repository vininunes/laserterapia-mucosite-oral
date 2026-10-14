import { useState } from 'react'

import { ChevronDown } from 'lucide-react'

import type { SceneDefinition } from '../scenes/types'
import type { NumericParams } from '../state/hash-state'
import { cn } from '../ui/lib/cn'
import { Button } from '../ui/primitives/button'
import { FloatCard } from '../ui/primitives/float-card'
import { CaptionContent } from './caption'
import { ParameterControls } from './parameter-panel'

type Section = 'caption' | 'params' | 'readout'

interface MobileDockProps {
  scene: SceneDefinition
  params: NumericParams
  onChange(key: string, value: number): void
  onApply(values: NumericParams): void
}

/**
 * Layout de celular: em vez de empilhar legenda e painéis sobre a cena (que
 * a cobririam inteira), uma gaveta inferior mostra uma seção por vez e pode
 * ser recolhida para deixar só a cena e o player.
 */
export function MobileDock({ scene, params, onChange, onApply }: MobileDockProps) {
  const [section, setSection] = useState<Section>('caption')
  // Celular deitado: a gaveta aberta deixaria pouca altura para a cena.
  const [open, setOpen] = useState(() => !window.matchMedia('(max-height: 500px)').matches)

  const sections: { id: Section; label: string }[] = [
    { id: 'caption', label: 'Etapa' },
    { id: 'params', label: 'Parâmetros' },
    ...(scene.Readout ? [{ id: 'readout' as const, label: 'Grandezas' }] : []),
  ]
  // A cena nova pode não ter Grandezas: cai de volta na legenda.
  const active = sections.some((s) => s.id === section) ? section : 'caption'

  // Tocar na seção já aberta recolhe a gaveta; em outra, troca e abre.
  const toggle = (id: Section) => {
    if (open && active === id) return setOpen(false)
    setSection(id)
    setOpen(true)
  }

  return (
    <FloatCard className="flex min-h-0 flex-col overflow-hidden">
      <div className="flex h-10 shrink-0 items-center gap-1 px-1.5">
        <div role="tablist" className="flex min-w-0 flex-1 gap-1">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={open && active === s.id}
              onClick={() => toggle(s.id)}
              className={cn(
                'h-7 flex-1 truncate rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors',
                open && active === s.id && 'bg-muted text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Recolher painel' : 'Expandir painel'}
          aria-expanded={open}
        >
          <ChevronDown className={cn('transition-transform', !open && 'rotate-180')} />
        </Button>
      </div>
      {/* Altura fixa: o texto de cada etapa tem um tamanho, e uma gaveta que acompanhasse
          o conteúdo mudaria a altura da cena (acima) a cada etapa, deslocando a
          simulação. Texto mais longo rola aqui dentro. */}
      {open && (
        <div className="h-[36dvh] min-h-0 overflow-y-auto overscroll-contain border-t px-3 py-3" aria-live="polite">
          {active === 'caption' && <CaptionContent steps={scene.script.steps} illustrative={scene.script.illustrative} />}
          {active === 'params' && (
            <ParameterControls controls={scene.script.controls} params={params} onChange={onChange} onApply={onApply} />
          )}
          {active === 'readout' && scene.Readout && <scene.Readout params={params} />}
        </div>
      )}
    </FloatCard>
  )
}
