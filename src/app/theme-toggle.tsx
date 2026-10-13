import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '../ui/primitives/button'
import Tooltip from '../ui/primitives/tooltip'
import { useTheme, type ColorScheme } from '../ui/theme/theme-provider'

const NEXT: Record<ColorScheme, ColorScheme> = { system: 'light', light: 'dark', dark: 'system' }
const LABEL: Record<ColorScheme, string> = {
  system: 'Tema do sistema',
  light: 'Tema claro',
  dark: 'Tema escuro',
}

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useTheme()
  const Icon = colorScheme === 'light' ? Sun : colorScheme === 'dark' ? Moon : Monitor

  return (
    <Tooltip text={`${LABEL[colorScheme]} — clique para trocar`}>
      <Button
        variant="outline"
        size="icon"
        className="size-7"
        onClick={() => setColorScheme(NEXT[colorScheme])}
        aria-label={LABEL[colorScheme]}
      >
        <Icon />
      </Button>
    </Tooltip>
  )
}
