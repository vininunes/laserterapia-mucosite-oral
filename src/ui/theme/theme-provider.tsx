import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react'

/**
 * Tema do design system — três eixos ortogonais, todos aplicados no `<html>`:
 *
 * 1) COLOR SCHEME  claro ↔ escuro         → classe `.dark` (variant `dark:`).
 * 2) SURFACE       translúcido ↔ sólido   → atributo `data-surface="glass|solid"`
 *    (variant `solid:`). Sem atributo = glass (superfícies
 *    semitransparentes para ficarem SOBRE um mapa). `solid` = opaco, para
 *    páginas sem mapa. Pode ser aplicado num subtree via `<Surface>`; com
 *    `global` também espelha no `<html>` para que conteúdo portalado (popover,
 *    select, dialog) siga a mesma superfície.
 * 3) BLUR          com ↔ sem backdrop-blur → atributo `data-blur="off"`
 *    (variant `no-blur:`). Desligado em máquinas sem GPU dedicada: os cards
 *    translúcidos usam a cor sólida `--background-flat` no lugar do blur.
 *
 * O provider é a única fonte de escrita no DOM. Modo controlado (`colorScheme`
 * + `onColorSchemeChange`) para apps cujas preferências vivem noutro lugar;
 * modo não controlado persiste em `localStorage` (`storageKey`, `null` desliga).
 */

export type ColorScheme = 'light' | 'dark' | 'system'
export type ResolvedColorScheme = 'light' | 'dark'
export type Surface = 'glass' | 'solid'

export const COLOR_SCHEME_STORAGE_KEY = 'ds-color-scheme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

function getSystemColorScheme(): ResolvedColorScheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function resolveColorScheme(scheme: ColorScheme): ResolvedColorScheme {
  return scheme === 'system' ? getSystemColorScheme() : scheme
}

function isColorScheme(value: unknown): value is ColorScheme {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readStoredColorScheme(storageKey: string | null): ColorScheme | undefined {
  if (!storageKey || typeof window === 'undefined') return undefined
  try {
    const stored = window.localStorage.getItem(storageKey)
    return isColorScheme(stored) ? stored : undefined
  } catch {
    return undefined
  }
}

function writeStoredColorScheme(storageKey: string | null, scheme: ColorScheme) {
  if (!storageKey || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, scheme)
  } catch {
    // storage indisponível (modo privado, quota) — o tema ainda é aplicado
  }
}

// ── Escrita no DOM ──────────────────────────────────────────────────────────

export function applyColorScheme(
  scheme: ColorScheme,
  root: HTMLElement = document.documentElement
): ResolvedColorScheme {
  const resolved = resolveColorScheme(scheme)
  // `light` é legado do provider antigo — só `.dark` tem efeito no CSS.
  root.classList.remove('light')
  root.classList.toggle('dark', resolved === 'dark')
  return resolved
}

export function applySurface(
  surface: Surface | undefined,
  root: HTMLElement = document.documentElement
) {
  if (surface === undefined) delete root.dataset.surface
  else root.dataset.surface = surface
}

export function applyBlur(enabled: boolean, root: HTMLElement = document.documentElement) {
  if (enabled) delete root.dataset.blur
  else root.dataset.blur = 'off'
}

// ── Provider ────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colorScheme: ColorScheme
  resolvedColorScheme: ResolvedColorScheme
  blur: boolean
  setColorScheme: (scheme: ColorScheme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export interface ThemeProviderProps {
  children: ReactNode
  /** Modo controlado: o esquema vem de fora (ex.: settings do usuário). */
  colorScheme?: ColorScheme
  onColorSchemeChange?: (scheme: ColorScheme) => void
  /** Modo não controlado: valor inicial quando não há nada persistido. */
  defaultColorScheme?: ColorScheme
  /** Chave do `localStorage` no modo não controlado. `null` desliga a persistência. */
  storageKey?: string | null
  /** Superfície padrão aplicada no `<html>`. Omitido = não toca no atributo (glass). */
  surface?: Surface
  /** `false` desliga o backdrop-blur (modo flat). */
  blur?: boolean
}

export function ThemeProvider({
  children,
  colorScheme: controlledColorScheme,
  onColorSchemeChange,
  defaultColorScheme = 'system',
  storageKey = COLOR_SCHEME_STORAGE_KEY,
  surface,
  blur = true,
}: ThemeProviderProps) {
  const isControlled = controlledColorScheme !== undefined

  const [uncontrolledColorScheme, setUncontrolledColorScheme] = useState<ColorScheme>(
    () => readStoredColorScheme(storageKey) ?? defaultColorScheme
  )
  const colorScheme = isControlled ? controlledColorScheme : uncontrolledColorScheme

  const [resolvedColorScheme, setResolvedColorScheme] = useState<ResolvedColorScheme>(() =>
    resolveColorScheme(colorScheme)
  )

  useEffect(() => {
    setResolvedColorScheme(applyColorScheme(colorScheme))
    if (colorScheme !== 'system' || typeof window === 'undefined' || !window.matchMedia) return

    // `system`: acompanha a preferência do SO em runtime.
    const media = window.matchMedia(DARK_QUERY)
    const onChange = () => setResolvedColorScheme(applyColorScheme('system'))
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [colorScheme])

  useEffect(() => {
    // Só escreve quando o app declara uma superfície padrão — um `<Surface global>`
    // montado num módulo continua sendo a autoridade enquanto estiver montado.
    if (surface === undefined) return
    applySurface(surface)
    return () => applySurface(undefined)
  }, [surface])

  useEffect(() => {
    applyBlur(blur)
  }, [blur])

  const setColorScheme = useCallback(
    (scheme: ColorScheme) => {
      if (!isControlled) {
        setUncontrolledColorScheme(scheme)
        writeStoredColorScheme(storageKey, scheme)
      }
      onColorSchemeChange?.(scheme)
    },
    [isControlled, onColorSchemeChange, storageKey]
  )

  const value = useMemo<ThemeContextValue>(
    () => ({ colorScheme, resolvedColorScheme, blur, setColorScheme }),
    [colorScheme, resolvedColorScheme, blur, setColorScheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

const FALLBACK_THEME: ThemeContextValue = {
  colorScheme: 'system',
  resolvedColorScheme: 'light',
  blur: true,
  setColorScheme: () => undefined,
}

/** Fora de um `ThemeProvider` devolve um fallback inerte (system/claro, sem escrita). */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? FALLBACK_THEME
}

// ── Surface ─────────────────────────────────────────────────────────────────

export interface SurfaceProps extends ComponentProps<'div'> {
  variant: Surface
  /**
   * Além do subtree, espelha a superfície no `<html>` enquanto montado (e
   * restaura o valor anterior ao desmontar). Necessário para que conteúdo
   * renderizado em portal (popover, select, dialog, tooltip) siga a página.
   */
  global?: boolean
}

export function Surface({ variant, global = false, ...props }: SurfaceProps) {
  useEffect(() => {
    if (!global) return
    const root = document.documentElement
    const previous = root.dataset.surface as Surface | undefined
    applySurface(variant)
    return () => applySurface(previous)
  }, [variant, global])

  return <div data-surface={variant} {...props} />
}
