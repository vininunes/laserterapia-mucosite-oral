/**
 * Cor de exibição de um comprimento de onda. A cor do feixe é física e não
 * usa token do tema (exceção prevista no plano).
 *
 * Faixa visível: aproximação de Bruton (1996), 380–780 nm, gama 0,8. Fora
 * dela não há cor real; o renderizador usa uma cor de REPRESENTAÇÃO fixa e a
 * UI avisa que a radiação é invisível.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export type SpectralRegion = 'ultravioleta' | 'visível' | 'infravermelho'

export const VISIBLE_MIN_NM = 380
export const VISIBLE_MAX_NM = 780

/** Cores de representação para radiação invisível (convenção do projeto). */
export const INFRARED_DISPLAY: Rgb = { r: 0.55, g: 0.12, b: 0.16 }
export const ULTRAVIOLET_DISPLAY: Rgb = { r: 0.45, g: 0.25, b: 0.75 }

export function spectralRegion(nm: number): SpectralRegion {
  if (nm < VISIBLE_MIN_NM) return 'ultravioleta'
  if (nm > VISIBLE_MAX_NM) return 'infravermelho'
  return 'visível'
}

const GAMMA = 0.8

export function wavelengthToRgb(nm: number): { color: Rgb; visible: boolean } {
  const region = spectralRegion(nm)
  if (region === 'infravermelho') return { color: INFRARED_DISPLAY, visible: false }
  if (region === 'ultravioleta') return { color: ULTRAVIOLET_DISPLAY, visible: false }

  let r = 0
  let g = 0
  let b = 0
  if (nm < 440) {
    r = -(nm - 440) / (440 - 380)
    b = 1
  } else if (nm < 490) {
    g = (nm - 440) / (490 - 440)
    b = 1
  } else if (nm < 510) {
    g = 1
    b = -(nm - 510) / (510 - 490)
  } else if (nm < 580) {
    r = (nm - 510) / (580 - 510)
    g = 1
  } else if (nm < 645) {
    r = 1
    g = -(nm - 645) / (645 - 580)
  } else {
    r = 1
  }

  // Intensidade cai nas bordas da visão.
  let factor = 1
  if (nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / (420 - 380)
  else if (nm > 700) factor = 0.3 + (0.7 * (780 - nm)) / (780 - 700)

  const adjust = (c: number) => (c === 0 ? 0 : Math.pow(c * factor, GAMMA))
  return { color: { r: adjust(r), g: adjust(g), b: adjust(b) }, visible: true }
}
