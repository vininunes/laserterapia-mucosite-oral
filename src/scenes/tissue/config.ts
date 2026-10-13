import type { TissueParams } from '../../content/scenes/tissue'
import type { McConfig } from '../../model/monte-carlo'
import { tissueMcConfig, type TissueWavelength } from '../../model/tissue-optics'

/** Trajetórias desenhadas por bloco (a estatística usa `params.photons`). */
export const RECORD_PATHS = 700
/** Spot de 1 mm de diâmetro: só a forma do feixe na cena, sem papel na dose. */
export const TISSUE_SPOT_RADIUS_CM = 0.05

/** Mesma entrada → mesma configuração → mesmo resultado em cache. */
export function tissueConfigFor(nm: TissueWavelength, params: TissueParams): McConfig {
  return tissueMcConfig(nm, {
    photons: params.photons,
    seed: params.seed,
    recordPaths: RECORD_PATHS,
    spotRadiusCm: TISSUE_SPOT_RADIUS_CM,
  })
}
