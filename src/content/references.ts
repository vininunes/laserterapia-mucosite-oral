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
    doi: '10.1016/S1011-1344(98)00219-X',
    usage: 'Citocromo c oxidase como fotoaceptor; mecanismos primários e secundários.',
  },
  'hamblin-2017': {
    id: 'hamblin-2017',
    citation:
      'Hamblin MR. Mechanisms and applications of the anti-inflammatory effects of photobiomodulation. AIMS Biophys. 2017;4(3):337–361.',
    doi: '10.3934/biophy.2017.3.337',
    usage: 'NO, ATP, sinalização por ROS e redução de mediadores inflamatórios.',
  },
  'sonis-2004': {
    id: 'sonis-2004',
    citation: 'Sonis ST. The pathobiology of mucositis. Nat Rev Cancer. 2004;4(4):277–284.',
    doi: '10.1038/nrc1318',
    usage:
      'Modelo biológico da mucosite oral em 5 fases (iniciação, resposta ao dano, sinalização e amplificação, ulceração, cicatrização). Texto integral não lido; fases confirmadas por fontes secundárias.',
  },
  'jacques-2013': {
    id: 'jacques-2013',
    citation: 'Jacques SL. Optical properties of biological tissues: a review. Phys Med Biol. 2013;58(11):R37–R61.',
    doi: '10.1088/0031-9155/58/11/R37',
    url: 'https://omlc.org/news/dec14/Jacques_PMB2013/',
    usage:
      "Ajustes μs' = a(λ/500 nm)^−b (Tabela 1: epiderme e derme de Salomatina 2006; tecido mucoso de Bashkatov); fração de água da derme (Tabela 3); fórmula de μa do sangue.",
  },
  'salomatina-2006': {
    id: 'salomatina-2006',
    citation:
      'Salomatina E, Jiang B, Novak J, Yaroslavsky AN. Optical properties of normal and cancerous human skin in the visible and near-infrared spectral range. J Biomed Opt. 2006;11(6):064026.',
    doi: '10.1117/1.2398928',
    usage: "Origem dos ajustes de μs' de epiderme e derme (via Jacques 2013), usados como proxy de epitélio e lâmina própria.",
  },
  'bashkatov-2005': {
    id: 'bashkatov-2005',
    citation:
      'Bashkatov AN, Genina EA, Kochubey VI, Tuchin VV. Optical properties of human skin, subcutaneous and mucous tissues in the wavelength range from 400 to 2000 nm. J Phys D Appl Phys. 2005;38(15):2543–2555.',
    doi: '10.1088/0022-3727/38/15/004',
    usage: "Origem do ajuste de μs' de tecido mucoso humano (via Jacques 2013), usado na submucosa.",
  },
  'greening-2016': {
    id: 'greening-2016',
    citation:
      'Greening GJ, James HM, Dierks MK, Vongkittiargorn N, Osterholm SM, Rajaram N, Muldoon TJ. Towards monitoring dysplastic progression in the oral cavity using a hybrid fiber-bundle imaging and spectroscopy probe. Sci Rep. 2016;6:26734.',
    doi: '10.1038/srep26734',
    usage: 'Hemoglobina total e saturação na mucosa do lábio interno, in vivo (Tabela 2).',
  },
  'prahl-hemoglobin': {
    id: 'prahl-hemoglobin',
    citation:
      'Prahl S. Tabulated molar extinction coefficient for hemoglobin in water. Oregon Medical Laser Center. Dados de Gratzer WB e Kollias N.',
    url: 'https://omlc.org/spectra/hemoglobin/summary.html',
    usage: 'Coeficiente de extinção molar de HbO₂ e Hb; fórmula μa = 2,303·ε·C/64500.',
  },
  'hale-querry-1973': {
    id: 'hale-querry-1973',
    citation:
      'Hale GM, Querry MR. Optical constants of water in the 200-nm to 200-µm wavelength region. Appl Opt. 1973;12(3):555–563.',
    doi: '10.1364/AO.12.000555',
    url: 'https://omlc.org/spectra/water/',
    usage: 'Absorção da água (dados via OMLC).',
  },
  'yaroslavsky-2023': {
    id: 'yaroslavsky-2023',
    citation:
      'Yaroslavsky AN, Iorizzo TW, Juliano AF, Adnan A, Carroll JD, Sonis ST, Duncan CN, London WB, Treister NS. Monte Carlo based dosimetry of extraoral photobiomodulation for prevention of oral mucositis. Sci Rep. 2023;13:20425.',
    doi: '10.1038/s41598-023-47529-3',
    usage: 'Anisotropia g = 0,9 adotada em Monte Carlo de PBM para mucosite (Tabela 1).',
  },
  'di-stasio-2019': {
    id: 'di-stasio-2019',
    citation:
      'Di Stasio D, Lauritano D, Iquebal H, Romano A, Gentile E, Lucchese A. Measurement of oral epithelial thickness by optical coherence tomography. Diagnostics. 2019;9(3):90.',
    doi: '10.3390/diagnostics9030090',
    usage: 'Espessura do epitélio da mucosa jugal por OCT in vivo (Tabela 1).',
  },
  'kurtzman-2021': {
    id: 'kurtzman-2021',
    citation:
      'Kurtzman JT, Sukumar S, Pan SM, et al. The impact of preoperative oral health on buccal mucosa graft histology. J Urol. 2021;206(3):655–661.',
    doi: '10.1097/JU.0000000000001829',
    usage: 'Espessura mediana da lâmina própria em enxerto de mucosa jugal (não mucosa em repouso).',
  },
  'anderson-parrish-1981': {
    id: 'anderson-parrish-1981',
    citation: 'Anderson RR, Parrish JA. The optics of human skin. J Invest Dermatol. 1981;77(1):13–19.',
    doi: '10.1111/1523-1747.ep12479191',
    usage: 'Janela óptica (~600–1300 nm): absorção dominada pela hemoglobina no visível.',
  },
  'chung-2012': {
    id: 'chung-2012',
    citation:
      'Chung H, Dai T, Sharma SK, Huang YY, Carroll JD, Hamblin MR. The nuts and bolts of low-level laser (light) therapy. Ann Biomed Eng. 2012;40(2):516–533.',
    doi: '10.1007/s10439-011-0454-7',
    usage: 'Janela óptica da PBM (600–1070 nm); 600–700 nm para alvos superficiais, 780–950 nm para mais profundos.',
  },
  'zecha-2016a': {
    id: 'zecha-2016a',
    citation:
      'Zecha JAEM, Raber-Durlacher JE, Nair RG, et al. Low level laser therapy/photobiomodulation in the management of side effects of chemoradiation therapy in head and neck cancer: part 1: mechanisms of action, dosimetric, and safety considerations. Support Care Cancer. 2016;24(6):2781–2792.',
    doi: '10.1007/s00520-016-3152-z',
    usage: 'Mecanismos, dosimetria e segurança da PBM em câncer de cabeça e pescoço, incluindo mucosite oral.',
  },
}
