/** Bibliografia centralizada; as cenas referenciam por id. */
export interface Reference {
  id: string
  /** Citação completa (formato a definir pela pesquisa: ABNT ou Vancouver). */
  citation: string
  url?: string
  doi?: string
  /** Para que a referência é usada no projeto. */
  usage: string
}

export const references: Record<string, Reference> = {
  'bipm-si-2019': {
    id: 'bipm-si-2019',
    citation:
      'BUREAU INTERNATIONAL DES POIDS ET MESURES. The International System of Units (SI). 9. ed. Sèvres: BIPM, 2019.',
    url: 'https://www.bipm.org/en/publications/si-brochure',
    usage: 'Valores exatos de h, c e e (constantes definidoras do SI desde 2019).',
  },
  'bruton-1996': {
    id: 'bruton-1996',
    citation: 'BRUTON, D. Approximate RGB values for visible wavelengths. Stephen F. Austin State University, 1996.',
    url: 'http://www.physics.sfasu.edu/astro/color/spectra.html',
    usage: 'Aproximação λ → RGB usada para colorir o feixe. Convenção de visualização, não colorimetria.',
  },
}
