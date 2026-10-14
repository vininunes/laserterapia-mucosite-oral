import { AnimatePresence, motion } from 'framer-motion'

import type { ScriptStep } from '../content/types'
import { useClockValue } from '../clock/use-simulation-clock'
import { activeStepIndex } from '../model/timeline'
import { cn } from '../ui/lib/cn'
import { FloatCard } from '../ui/primitives/float-card'

interface CaptionProps {
  steps: ScriptStep[]
  illustrative?: boolean
  className?: string
}

/** Legenda da etapa atual. Só re-renderiza quando a etapa muda. */
export function Caption({ className, ...props }: CaptionProps) {
  return (
    <FloatCard className={cn('w-full max-w-md px-3 py-2.5', className)} aria-live="polite">
      <CaptionContent {...props} />
    </FloatCard>
  )
}

/** O texto da etapa sem o card (a gaveta do layout de celular o usa direto). */
export function CaptionContent({ steps, illustrative }: Omit<CaptionProps, 'className'>) {
  const index = useClockValue((s) => activeStepIndex(steps, s.t))
  const step = steps[index]
  if (!step) return null

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.15 }}
      >
        <p className="text-[10px] text-muted-foreground tabular-nums">
          Etapa {index + 1} de {steps.length}
          {illustrative && ' · esquema ilustrativo'}
        </p>
        <p className="mt-0.5 text-sm font-medium">{step.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.caption}</p>
      </motion.div>
    </AnimatePresence>
  )
}
