/** Bibliografia centralizada; as cenas referenciam por id. */
export interface Reference {
  id: string
  /** Citação completa (formato a definir pela pesquisa: ABNT ou Vancouver). */
  citation: string
  url?: string
  doi?: string
  /** Para que a referência é usada no projeto. */
  usage: string
  /** Citação ainda não conferida na fonte (autores, ano, volume, DOI). A UI avisa. */
  unverified?: boolean
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
  'zadik-2019': {
    id: 'zadik-2019',
    citation:
      'Zadik Y, Arany PR, Fregnani ER, Bossi P, Antunes HS, Bensadoun RJ, Gueiros LA, Majorana A, Nair RG, Ranna V, Tissing WJE, Vaddi A, Lubart R, Migliorati CA, Lalla RV, Cheng KKF, Elad S. Systematic review of photobiomodulation for the management of oral mucositis in cancer patients and clinical practice guidelines. Support Care Cancer. 2019;27(10):3969–3983.',
    doi: '10.1007/s00520-019-04890-2',
    usage: 'Protocolos de PBM recomendados para prevenção de mucosite oral (parâmetros da cena de dosimetria).',
  },
  'mascc-isoo-2020-pbm': {
    id: 'mascc-isoo-2020-pbm',
    citation:
      'MASCC/ISOO. 2019/2020 Clinical Practice Guidelines for the Management of Mucositis — Short Summary #3: Photobiomodulation. Mucositis Study Group.',
    usage: 'Resumo da diretriz: protocolos recomendados, níveis de evidência e notas de segurança.',
  },
  'elad-2020': {
    id: 'elad-2020',
    citation:
      'Elad S, Cheng KKF, Lalla RV, et al. MASCC/ISOO clinical practice guidelines for the management of mucositis secondary to cancer therapy. Cancer. 2020;126:4423–4431.',
    doi: '10.1002/cncr.33100',
    usage: 'Diretriz MASCC/ISOO completa (contexto e níveis de evidência).',
  },
  'karu-1999': {
    id: 'karu-1999',
    citation:
      'Karu T. Primary and secondary mechanisms of action of visible to near-IR radiation on cells. J Photochem Photobiol B. 1999;49(1):1–17.',
    usage: 'Citocromo c oxidase como fotoaceptor; mecanismos primários e secundários.',
    unverified: true,
  },
  'hamblin-2017': {
    id: 'hamblin-2017',
    citation:
      'Hamblin MR. Mechanisms and applications of the anti-inflammatory effects of photobiomodulation. AIMS Biophys. 2017;4(3):337–361.',
    usage: 'NO, ATP, sinalização por ROS e redução de mediadores inflamatórios.',
    unverified: true,
  },
  'sonis-2004': {
    id: 'sonis-2004',
    citation: 'Sonis ST. The pathobiology of mucositis. Nat Rev Cancer. 2004;4(4):277–284.',
    usage: 'Modelo biológico da mucosite oral (estresse oxidativo, cascata inflamatória, ulceração).',
    unverified: true,
  },
}
