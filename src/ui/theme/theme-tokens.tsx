import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

import { flatten, parseCssColor, toHex, type Rgba } from './css-color'

/**
 * Tokens do design system lidos das CSS variables em runtime, já convertidos
 * para hex opaco (compostos sobre `--background`) para uso no Three.js.
 * Exceção de projeto: a cor do feixe é física (λ → RGB) e não vem daqui.
 */
export interface ThemeTokens {
  background: string
  foreground: string
  mutedForeground: string
  border: string
  primary: string
  warning: string
  positive: string
  destructive: string
  isDark: boolean
}

const TOKEN_VARS = {
  background: '--background',
  foreground: '--foreground',
  mutedForeground: '--muted-foreground',
  border: '--border',
  primary: '--primary',
  warning: '--warning',
  positive: '--positive',
  destructive: '--destructive',
} as const

const WHITE: Rgba = { r: 1, g: 1, b: 1, a: 1 }

export function readThemeTokens(root: HTMLElement = document.documentElement): ThemeTokens {
  const style = getComputedStyle(root)
  const read = (name: string) => parseCssColor(style.getPropertyValue(name)) ?? WHITE
  const background = flatten(read(TOKEN_VARS.background), WHITE)

  const out = { isDark: root.classList.contains('dark') } as ThemeTokens
  for (const [key, name] of Object.entries(TOKEN_VARS)) {
    ;(out as unknown as Record<string, string>)[key] = toHex(flatten(read(name), background))
  }
  return out
}

const ThemeTokensContext = createContext<ThemeTokens | null>(null)

/** Lê os tokens e os relê quando o tema ou a superfície mudam no `<html>`. */
export function ThemeTokensProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokens] = useState<ThemeTokens>(() => readThemeTokens())

  useEffect(() => {
    const root = document.documentElement
    const update = () => setTokens(readThemeTokens(root))
    // O ThemeProvider (pai) aplica a classe depois deste efeito: o observer pega.
    const observer = new MutationObserver(update)
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'data-surface', 'data-blur'] })
    update()
    return () => observer.disconnect()
  }, [])

  return <ThemeTokensContext.Provider value={tokens}>{children}</ThemeTokensContext.Provider>
}

export function useThemeTokens(): ThemeTokens {
  const tokens = useContext(ThemeTokensContext)
  if (!tokens) throw new Error('useThemeTokens precisa de um ThemeTokensProvider')
  return tokens
}
