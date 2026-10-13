import { useState, type ReactNode } from 'react'

import { ChevronDown } from 'lucide-react'

import { cn } from './lib/cn'
import { Button } from './primitives/button'
import { FloatCard } from './primitives/float-card'

interface PanelProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}

/**
 * Painel fixo com cabeçalho e corpo rolável. Substitui a `Window` do T2S, que
 * depende do gerenciador global de janelas (jotai, drag, minimização).
 */
export function Panel({ title, children, defaultOpen = true, className }: PanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <FloatCard className={cn('flex max-h-full min-h-0 flex-col overflow-hidden', className)}>
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 pr-1.5 pl-3">
        <p className="truncate text-xs font-medium">{title}</p>
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Recolher painel' : 'Expandir painel'}
          aria-expanded={open}
        >
          <ChevronDown className={cn('transition-transform', !open && '-rotate-90')} />
        </Button>
      </div>
      {open && <div className="min-h-0 overflow-y-auto border-t px-3 py-3">{children}</div>}
    </FloatCard>
  )
}
