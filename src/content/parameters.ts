/**
 * Parâmetros científicos usados pelas cenas. Regra do projeto: nenhum valor
 * sem fonte. Sem fonte confirmada, `value: null` e `source: 'TODO'` — a UI
 * mostra o parâmetro como pendente.
 */
export interface ScientificParameter {
  id: string
  label: string
  value: number | null
  unit: string
  /** Id de `references.ts`, ou 'TODO' enquanto não houver fonte confirmada. */
  source: string
  note?: string
  /**
   * `proxy`: medido em outro tecido e usado no lugar da mucosa oral
   * (`proxyFor` diz o quê). Ausente = medido no próprio tecido ou constante.
   */
  basis?: 'proxy'
  proxyFor?: string
  /** λ em que o valor foi tabulado, quando difere do λ em que é usado. */
  tabulatedAtNm?: number
}

export const parameters = {
  planck: {
    id: 'planck',
    label: 'Constante de Planck (h)',
    value: 6.62607015e-34,
    unit: 'J·s',
    source: 'bipm-si-2019',
    note: 'Valor exato por definição do SI.',
  },
  'speed-of-light': {
    id: 'speed-of-light',
    label: 'Velocidade da luz no vácuo (c)',
    value: 299_792_458,
    unit: 'm/s',
    source: 'bipm-si-2019',
    note: 'Valor exato por definição do SI.',
  },
  'elementary-charge': {
    id: 'elementary-charge',
    label: 'Carga elementar (e)',
    value: 1.602176634e-19,
    unit: 'C',
    source: 'bipm-si-2019',
    note: 'Valor exato por definição do SI. Usada para converter J em eV.',
  },

  // ── Sangue e água (absorção) ────────────────────────────────────────────
  'hb-mucosa': {
    id: 'hb-mucosa',
    label: 'Hemoglobina total na mucosa oral',
    value: 2.39,
    unit: 'mg/mL',
    source: 'greening-2016',
    note: 'Mucosa do lábio interno, in vivo, 13 voluntários (SDS 374 µm). Média do volume medido, não por camada; aqui atribuída à lâmina própria e à submucosa porque o epitélio é avascular.',
  },
  'sat-mucosa': {
    id: 'sat-mucosa',
    label: 'Saturação de oxigênio da hemoglobina na mucosa',
    value: 0.941,
    unit: 'fração',
    source: 'greening-2016',
    note: 'SaO₂ 94,1 ± 10,0 %, mucosa do lábio interno in vivo.',
  },
  'hb-molar-mass': {
    id: 'hb-molar-mass',
    label: 'Massa molar da hemoglobina (fórmula de Prahl)',
    value: 64_500,
    unit: 'g/mol',
    source: 'prahl-hemoglobin',
  },
  'eps-hbo2-632.8': { id: 'eps-hbo2-632.8', label: 'ε HbO₂', value: 561.2, unit: 'cm⁻¹/M', source: 'prahl-hemoglobin', tabulatedAtNm: 632 },
  'eps-hb-632.8': { id: 'eps-hb-632.8', label: 'ε Hb', value: 4930.8, unit: 'cm⁻¹/M', source: 'prahl-hemoglobin', tabulatedAtNm: 632 },
  'eps-hbo2-660': { id: 'eps-hbo2-660', label: 'ε HbO₂', value: 319.6, unit: 'cm⁻¹/M', source: 'prahl-hemoglobin' },
  'eps-hb-660': { id: 'eps-hb-660', label: 'ε Hb', value: 3226.56, unit: 'cm⁻¹/M', source: 'prahl-hemoglobin' },
  'eps-hbo2-808': { id: 'eps-hbo2-808', label: 'ε HbO₂', value: 856, unit: 'cm⁻¹/M', source: 'prahl-hemoglobin' },
  'eps-hb-808': { id: 'eps-hb-808', label: 'ε Hb', value: 723.52, unit: 'cm⁻¹/M', source: 'prahl-hemoglobin' },
  'mua-water-632.8': {
    id: 'mua-water-632.8',
    label: 'μa da água',
    value: 0.0028,
    unit: 'cm⁻¹',
    source: 'hale-querry-1973',
    tabulatedAtNm: 625,
  },
  'mua-water-660': {
    id: 'mua-water-660',
    label: 'μa da água',
    value: 0.0032,
    unit: 'cm⁻¹',
    source: 'hale-querry-1973',
    tabulatedAtNm: 650,
  },
  'mua-water-808': {
    id: 'mua-water-808',
    label: 'μa da água',
    value: 0.019858,
    unit: 'cm⁻¹',
    source: 'hale-querry-1973',
    tabulatedAtNm: 810,
  },
  'water-fraction': {
    id: 'water-fraction',
    label: 'Fração de água do tecido',
    value: 0.65,
    unit: 'fração',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: 'derme in vivo (Choudhury 2010, Tabela 3 de Jacques 2013) no lugar da mucosa',
  },

  // ── Espalhamento: μs' = a·(λ/500 nm)^−b ─────────────────────────────────
  'musp-epidermis-a': {
    id: 'musp-epidermis-a',
    label: "μs' do epitélio — a",
    value: 68.7,
    unit: 'cm⁻¹',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: 'epiderme humana ex vivo (Salomatina 2006) no lugar do epitélio oral não queratinizado',
  },
  'musp-epidermis-b': {
    id: 'musp-epidermis-b',
    label: "μs' do epitélio — b",
    value: 1.161,
    unit: '—',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: 'epiderme humana ex vivo (Salomatina 2006)',
  },
  'musp-dermis-a': {
    id: 'musp-dermis-a',
    label: "μs' da lâmina própria — a",
    value: 45.3,
    unit: 'cm⁻¹',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: 'derme humana ex vivo (Salomatina 2006) no lugar da lâmina própria',
  },
  'musp-dermis-b': {
    id: 'musp-dermis-b',
    label: "μs' da lâmina própria — b",
    value: 1.292,
    unit: '—',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: 'derme humana ex vivo (Salomatina 2006)',
  },
  'musp-mucous-a': {
    id: 'musp-mucous-a',
    label: "μs' da submucosa — a",
    value: 18.8,
    unit: 'cm⁻¹',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: "\"tecido mucoso\" humano ex vivo (Bashkatov), tecido inteiro, sítio não confirmado",
  },
  'musp-mucous-b': {
    id: 'musp-mucous-b',
    label: "μs' da submucosa — b",
    value: 1.62,
    unit: '—',
    source: 'jacques-2013',
    basis: 'proxy',
    proxyFor: '"tecido mucoso" humano ex vivo (Bashkatov)',
  },
  'anisotropy-g': {
    id: 'anisotropy-g',
    label: 'Anisotropia do espalhamento (g)',
    value: 0.9,
    unit: '—',
    source: 'yaroslavsky-2023',
    basis: 'proxy',
    proxyFor: 'valor adotado para pele, gordura e músculo em Monte Carlo de PBM para mucosite; g da mucosa oral não encontrado',
  },

  // ── Espessuras ──────────────────────────────────────────────────────────
  'thickness-epithelium': {
    id: 'thickness-epithelium',
    label: 'Espessura do epitélio (mucosa jugal)',
    value: 545.4,
    unit: 'µm',
    source: 'di-stasio-2019',
    note: 'OCT in vivo, n = 28, média 545,40 ± 62,45 µm. Outras fontes: 294 µm (Prestin 2012, OCT), 580 ± 90 µm (histologia).',
  },
  'thickness-lamina-propria': {
    id: 'thickness-lamina-propria',
    label: 'Espessura da lâmina própria (mucosa jugal)',
    value: 150,
    unit: 'µm',
    source: 'kurtzman-2021',
    basis: 'proxy',
    proxyFor: 'mediana em enxerto de mucosa jugal para uretroplastia, não mucosa em repouso',
  },
  'thickness-submucosa': {
    id: 'thickness-submucosa',
    label: 'Espessura da submucosa (mucosa jugal)',
    value: null,
    unit: 'µm',
    source: 'TODO',
    note: 'Não encontrada para mucosa jugal humana saudável. O modelo trata a submucosa como semi-infinita.',
  },
} satisfies Record<string, ScientificParameter>

export type ParameterId = keyof typeof parameters

export function isPending(p: ScientificParameter): boolean {
  return p.value === null || p.source === 'TODO'
}

/**
 * Valor de um parâmetro que o modelo não pode calcular sem. Lança erro se
 * estiver pendente — o modelo nunca inventa um valor substituto.
 */
export function requireParameter(id: ParameterId): number {
  const p: ScientificParameter = parameters[id]
  if (!p) throw new Error(`Parâmetro inexistente: ${id}`)
  if (isPending(p) || p.value === null) throw new Error(`Parâmetro pendente: ${id}`)
  return p.value
}
