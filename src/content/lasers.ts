/**
 * Meio ativo típico de cada λ usado na simulação, nos três tipos de laser de
 * baixa potência que o TCC apresenta para a Odontologia (seção 3.3; Karu,
 * 1998): He-Ne (632,8 nm, a linha do gás), diodo InGaAlP (vermelho) e diodo
 * GaAlAs (infravermelho próximo). Sem correspondência, `undefined`.
 */
export function laserMedium(nm: number): string | undefined {
  if (nm === 632.8) return 'He-Ne'
  if (nm >= 630 && nm <= 690) return 'InGaAlP'
  if (nm >= 750 && nm <= 900) return 'GaAlAs'
  return undefined
}

/** Rótulo de opção: "660 nm (vermelho, InGaAlP)". */
export function wavelengthOptionLabel(nm: number): string {
  const region = nm > 780 ? 'infravermelho' : 'vermelho'
  const medium = laserMedium(nm)
  return `${nm.toLocaleString('pt-BR')} nm (${region}${medium ? `, ${medium}` : ''})`
}
