const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
}

/** Número em pt-BR com casas decimais fixas. */
export function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
}

/** Notação científica legível: `3,01 × 10⁻¹⁹`. */
export function formatScientific(value: number, digits = 2): string {
  if (value === 0) return formatNumber(0, digits)
  const exponent = Math.floor(Math.log10(Math.abs(value)))
  const mantissa = value / 10 ** exponent
  // Arredondamento pode levar 9,995 a 10,00: normaliza.
  const rounded = Number(mantissa.toFixed(digits))
  const [m, e] = Math.abs(rounded) >= 10 ? [rounded / 10, exponent + 1] : [rounded, exponent]
  const sup = String(e).split('').map((c) => SUPERSCRIPT[c]).join('')
  return `${formatNumber(m, digits)} × 10${sup}`
}
