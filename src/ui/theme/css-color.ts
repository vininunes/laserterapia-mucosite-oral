/** Cor normalizada em 0–1. */
export interface Rgba {
  r: number
  g: number
  b: number
  a: number
}

const TRANSPARENT: Rgba = { r: 0, g: 0, b: 0, a: 0 }

/**
 * Converte o texto de uma CSS variable em cor. `getComputedStyle` devolve o
 * valor declarado sem normalizar, então aceita os formatos usados nos tokens:
 * `rgba(r, g, b, a)`, `rgb(r g b / a)`, `#rgb`, `#rrggbb`, `#rrggbbaa` e
 * `transparent`. Formato desconhecido devolve `null`.
 */
export function parseCssColor(input: string): Rgba | null {
  const s = input.trim().toLowerCase()
  if (s === 'transparent') return TRANSPARENT

  if (s.startsWith('#')) {
    const hex = s.slice(1)
    const expand = hex.length === 3 || hex.length === 4 ? [...hex].map((c) => c + c).join('') : hex
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(expand)) return null
    const n = (i: number) => parseInt(expand.slice(i, i + 2), 16) / 255
    return { r: n(0), g: n(2), b: n(4), a: expand.length === 8 ? n(6) : 1 }
  }

  const m = s.match(/^rgba?\((.*)\)$/)
  if (!m) return null
  const parts = m[1].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3) return null
  const channel = (v: string) => (v.endsWith('%') ? (parseFloat(v) / 100) * 255 : parseFloat(v))
  const [r, g, b] = parts.slice(0, 3).map(channel)
  const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
  if ([r, g, b, a].some((v) => Number.isNaN(v))) return null
  return { r: r / 255, g: g / 255, b: b / 255, a }
}

/** Compõe uma cor translúcida sobre um fundo opaco (para usos sem alpha no 3D). */
export function flatten(color: Rgba, over: Rgba): Rgba {
  const k = color.a
  return {
    r: color.r * k + over.r * (1 - k),
    g: color.g * k + over.g * (1 - k),
    b: color.b * k + over.b * (1 - k),
    a: 1,
  }
}

export function toHex(c: Rgba): string {
  const h = (v: number) => Math.round(Math.min(Math.max(v, 0), 1) * 255).toString(16).padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}
