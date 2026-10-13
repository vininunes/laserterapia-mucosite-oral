import { HTMLMotionProps, motion } from 'framer-motion'

import { cn } from '../lib/cn'

/**
 * Card flutuante translúcido (widgets sobre o mapa, page actions, headers).
 *
 * Reage ao eixo BLUR do tema (`data-blur="off"` no `<html>`, ver
 * theme-provider): sem blur usa a cor sólida `--background-flat` no lugar do
 * `backdrop-blur`. A cor é resolvida numa custom property NO PRÓPRIO elemento
 * (`--float-card-bg`) e aplicada por `bg-(--float-card-bg)` — assim ela
 * acompanha a superfície (glass/solid) do subtree e um `bg-*` passado em
 * `className` continua sobrescrevendo em qualquer modo (mesmo grupo no
 * tailwind-merge), o que uma variante `no-blur:bg-…` não permitiria.
 */
export function FloatCard({ className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      data-float-card
      className={cn(
        // `relative`: o backdrop-filter (modo com blur) torna o card um
        // containing block para descendentes `absolute`; sem ele (modo flat)
        // o `relative` cumpre esse papel — sem isso, labels/indicadores
        // posicionados em absolute vazariam para fora do card.
        'relative outline outline-offset outline-foreground/20 shadow rounded-xl pointer-events-auto',
        '[--float-card-bg:var(--background)] no-blur:[--float-card-bg:var(--background-flat)]',
        'bg-(--float-card-bg) backdrop-blur-md no-blur:backdrop-blur-none',
        className
      )}
      {...props}
    />
  )
}
