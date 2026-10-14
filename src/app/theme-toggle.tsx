import { Moon, Sun } from 'lucide-react'

import { cn } from '../ui/lib/cn'
import { Button } from '../ui/primitives/button'
import Tooltip from '../ui/primitives/tooltip'
import { useTheme } from '../ui/theme/theme-provider'

/**
 * Alterna entre claro e escuro. O ícone mostra o tema atual (sol ou lua) e
 * gira ao trocar. Começa seguindo o sistema; o primeiro clique fixa a escolha.
 */
export function ThemeToggle() {
  const { resolvedColorScheme, setColorScheme } = useTheme()
  const dark = resolvedColorScheme === 'dark'
  const label = dark ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'

  return (
    <Tooltip text={label}>
      <Button
        variant="outline"
        size="icon"
        className="relative size-8 shrink-0"
        onClick={() => setColorScheme(dark ? 'light' : 'dark')}
        aria-label={label}
      >
        <Sun
          className={cn(
            'absolute transition-all duration-300',
            dark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
          )}
        />
        <Moon
          className={cn(
            'absolute transition-all duration-300',
            dark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'
          )}
        />
      </Button>
    </Tooltip>
  )
}
