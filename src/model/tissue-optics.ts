import { isPending, parameters, requireParameter, type ParameterId, type ScientificParameter } from '../content/parameters'
import type { McConfig, OpticalLayer } from './monte-carlo'

/**
 * Propriedades ópticas das camadas da mucosa jugal, CALCULADAS a partir de
 * dados primários com fonte (`content/parameters.ts`). Nenhum coeficiente
 * de camada é digitado à mão:
 *
 *   μa(sangue) = 2,303 · C_Hb · [S·ε_HbO₂ + (1−S)·ε_Hb]       (Prahl)
 *   μa(camada) = μa(sangue) [se vascularizada] + W · μa(água)
 *   μs'        = a · (λ / 500 nm)^−b                          (Jacques 2013)
 *   μs         = μs' / (1 − g)
 */

export const TISSUE_WAVELENGTHS = [632.8, 660, 808] as const
export type TissueWavelength = (typeof TISSUE_WAVELENGTHS)[number]

export function isTissueWavelength(nm: number): nm is TissueWavelength {
  return (TISSUE_WAVELENGTHS as readonly number[]).includes(nm)
}

/**
 * Profundidade em que o modelo corta a submucosa (cm). NÃO é espessura
 * anatômica: a espessura não foi encontrada e a camada é tratada como
 * semi-infinita. Funda o bastante para quase nenhum fóton chegar ao fundo.
 */
export const SUBMUCOSA_MODEL_DEPTH_CM = 3

export interface LayerOptics extends OpticalLayer {
  id: 'epitelio' | 'lamina-propria' | 'submucosa'
  musPrimePerCm: number
  vascular: boolean
  /** Espessura anatômica desconhecida: camada tratada como semi-infinita. */
  semiInfinite: boolean
  /** Parâmetros usados no cálculo desta camada. */
  sources: ParameterId[]
}

const key = <T extends string>(prefix: T, nm: TissueWavelength) => `${prefix}-${nm}` as ParameterId

/** Absorção do sangue da mucosa (cm⁻¹) com a hemoglobina e a saturação medidas in vivo. */
export function muaBloodMucosa(nm: TissueWavelength): number {
  // mg/mL = g/L; ÷ g/mol = mol/L
  const molar = requireParameter('hb-mucosa') / requireParameter('hb-molar-mass')
  const s = requireParameter('sat-mucosa')
  const eps = s * requireParameter(key('eps-hbo2', nm)) + (1 - s) * requireParameter(key('eps-hb', nm))
  return 2.303 * molar * eps
}

export function muaWaterInTissue(nm: TissueWavelength): number {
  return requireParameter('water-fraction') * requireParameter(key('mua-water', nm))
}

export function musPrime(a: ParameterId, b: ParameterId, nm: number): number {
  return requireParameter(a) * Math.pow(nm / 500, -requireParameter(b))
}

export function mucosaLayers(nm: TissueWavelength): LayerOptics[] {
  const g = requireParameter('anisotropy-g')
  const blood = muaBloodMucosa(nm)
  const water = muaWaterInTissue(nm)
  const absorptionSources: ParameterId[] = [
    'hb-mucosa',
    'sat-mucosa',
    'hb-molar-mass',
    key('eps-hbo2', nm),
    key('eps-hb', nm),
    'water-fraction',
    key('mua-water', nm),
  ]
  const submucosaThickness: ScientificParameter = parameters['thickness-submucosa']

  const layer = (
    id: LayerOptics['id'],
    name: string,
    thicknessCm: number,
    vascular: boolean,
    fit: [ParameterId, ParameterId],
    thicknessSource: ParameterId,
    semiInfinite = false
  ): LayerOptics => {
    const musPrimePerCm = musPrime(fit[0], fit[1], nm)
    return {
      id,
      name,
      thicknessCm,
      muaPerCm: (vascular ? blood : 0) + water,
      musPerCm: musPrimePerCm / (1 - g),
      musPrimePerCm,
      g,
      vascular,
      semiInfinite,
      sources: [
        ...(vascular ? absorptionSources : (['water-fraction', key('mua-water', nm)] as ParameterId[])),
        fit[0],
        fit[1],
        'anisotropy-g',
        thicknessSource,
      ],
    }
  }

  return [
    layer(
      'epitelio',
      'Epitélio',
      requireParameter('thickness-epithelium') / 1e4,
      false,
      ['musp-epidermis-a', 'musp-epidermis-b'],
      'thickness-epithelium'
    ),
    layer(
      'lamina-propria',
      'Lâmina própria',
      requireParameter('thickness-lamina-propria') / 1e4,
      true,
      ['musp-dermis-a', 'musp-dermis-b'],
      'thickness-lamina-propria'
    ),
    layer(
      'submucosa',
      'Submucosa',
      isPending(submucosaThickness) ? SUBMUCOSA_MODEL_DEPTH_CM : Number(submucosaThickness.value) / 1e4,
      true,
      ['musp-mucous-a', 'musp-mucous-b'],
      'thickness-submucosa',
      isPending(submucosaThickness)
    ),
  ]
}

/** Parâmetros pendentes ou proxy usados no cálculo, para a UI exibir. */
export function layerCaveats(layers: LayerOptics[]) {
  const ids = [...new Set(layers.flatMap((l) => l.sources))]
  return {
    pending: ids.filter((id) => isPending(parameters[id])),
    proxies: ids.filter((id) => (parameters[id] as ScientificParameter).basis === 'proxy'),
  }
}

export interface TissueRunOptions {
  photons: number
  seed: number
  recordPaths: number
  spotRadiusCm: number
}

/** Configuração completa do Monte Carlo para um λ. */
export function tissueMcConfig(nm: TissueWavelength, o: TissueRunOptions): McConfig {
  return {
    layers: mucosaLayers(nm).map(({ name, thicknessCm, muaPerCm, musPerCm, g }) => ({
      name,
      thicknessCm,
      muaPerCm,
      musPerCm,
      g,
    })),
    photons: o.photons,
    seed: o.seed,
    recordPaths: o.recordPaths,
    // Fótons que difundem fundo fazem milhares de interações.
    maxSteps: 100_000,
    recordEvery: 8,
    maxRecorded: 360,
    spotRadiusCm: o.spotRadiusCm,
    binCm: 0.01,
  }
}
