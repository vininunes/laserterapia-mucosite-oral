import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/**
 * `twMerge` ciente dos tokens do design system: as cores customizadas
 * (`neutral`, `positive`, `warning`, `gray`, `background-flat`) e as animações
 * (`accordion-*`) entram nos grupos de conflito, então `cn('bg-positive',
 * 'bg-primary')` resolve para `bg-primary` como qualquer cor do tema.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ['neutral', 'positive', 'warning', 'gray', 'background-flat'],
      animate: ['accordion-down', 'accordion-up'],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
