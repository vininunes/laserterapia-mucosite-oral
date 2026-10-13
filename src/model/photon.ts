import { requireParameter } from '../content/parameters'

const NM = 1e-9

/** Frequência, em Hz: f = c / λ. */
export function frequencyHz(wavelengthNm: number): number {
  return requireParameter('speed-of-light') / (wavelengthNm * NM)
}

/** Energia do fóton, em J: E = h·c / λ. */
export function photonEnergyJ(wavelengthNm: number): number {
  return (requireParameter('planck') * requireParameter('speed-of-light')) / (wavelengthNm * NM)
}

/** Energia do fóton, em eV. */
export function photonEnergyEv(wavelengthNm: number): number {
  return photonEnergyJ(wavelengthNm) / requireParameter('elementary-charge')
}
