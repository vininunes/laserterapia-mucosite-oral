/**
 * Monte Carlo simplificado de fótons em camadas (random walk de absorção e
 * espalhamento). Determinístico: mesma configuração + mesma seed = mesmo
 * resultado. Sem React nem Three.js; roda no Web Worker.
 *
 * Simplificações (documentadas em docs/cenas/04-tecido.md):
 * - Monte Carlo "analógico": em cada interação o fóton é absorvido com
 *   probabilidade μa/μt, senão espalha (Henyey-Greenstein, anisotropia g).
 * - Sem diferença de índice de refração: o fóton que volta à superfície sai.
 * - Camadas planas e infinitas na lateral; z cresce para dentro do tecido.
 * - Feixe colimado, perpendicular, uniforme no spot.
 */

export interface OpticalLayer {
  name: string
  thicknessCm: number
  /** Coeficiente de absorção, cm⁻¹. */
  muaPerCm: number
  /** Coeficiente de espalhamento, cm⁻¹. */
  musPerCm: number
  /** Anisotropia do espalhamento (−1…1). */
  g: number
}

export interface McConfig {
  layers: OpticalLayer[]
  photons: number
  seed: number
  /** Fótons cujas trajetórias são guardadas para desenhar (os primeiros). */
  recordPaths: number
  /** Interações máximas por fóton; acima disso ele é contado como "perdido". */
  maxSteps: number
  /** Grava um vértice a cada `recordEvery` interações (o cálculo usa todas). */
  recordEvery: number
  /** Teto de vértices gravados por trajetória; o resto da trajetória não é desenhado. */
  maxRecorded: number
  spotRadiusCm: number
  /** Resolução do histograma de profundidade, cm. */
  binCm: number
}

export const enum Fate {
  Absorbed = 0,
  Remitted = 1,
  Transmitted = 2,
  Lost = 3,
}

export interface McResult {
  /** xyz (cm) dos vértices gravados: recordPaths × maxRecorded × 3. */
  paths: Float32Array
  /** Floats por trajetória em `paths` (maxRecorded × 3). */
  pathStride: number
  /** Vértices válidos de cada trajetória guardada. */
  pathLengths: Uint16Array
  fates: Uint8Array
  /** Frações sobre todos os fótons. */
  absorbedByLayer: Float64Array
  remitted: number
  transmitted: number
  lost: number
  /** Fração de fótons absorvidos em cada faixa de profundidade de `binCm`. */
  absorbedByDepth: Float64Array
  /** Fração de fótons que chegou pelo menos até cada faixa de profundidade. */
  reachedDepth: Float64Array
  binCm: number
  totalThicknessCm: number
}

/** Gerador mulberry32: rápido, 32 bits, reproduzível. Devolve [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Cosseno do ângulo de espalhamento pela função de fase de Henyey-Greenstein. */
export function sampleHgCos(g: number, xi: number): number {
  if (Math.abs(g) < 1e-6) return 2 * xi - 1
  const f = (1 - g * g) / (1 - g + 2 * g * xi)
  return Math.min(Math.max((1 + g * g - f * f) / (2 * g), -1), 1)
}

/** Gira a direção (ux, uy, uz) por θ (cosθ dado) e azimute φ. Fórmulas de Wang & Jacques (MCML). */
function scatter(dir: [number, number, number], cosT: number, phi: number) {
  const [ux, uy, uz] = dir
  const sinT = Math.sqrt(Math.max(0, 1 - cosT * cosT))
  const cosP = Math.cos(phi)
  const sinP = Math.sin(phi)
  if (Math.abs(uz) > 0.99999) {
    dir[0] = sinT * cosP
    dir[1] = sinT * sinP
    dir[2] = cosT * Math.sign(uz)
    return
  }
  const tmp = Math.sqrt(1 - uz * uz)
  dir[0] = (sinT * (ux * uz * cosP - uy * sinP)) / tmp + ux * cosT
  dir[1] = (sinT * (uy * uz * cosP + ux * sinP)) / tmp + uy * cosT
  dir[2] = -sinT * cosP * tmp + uz * cosT
}

export function runMonteCarlo(config: McConfig): McResult {
  const { layers, photons, recordPaths, maxSteps, spotRadiusCm, binCm, recordEvery, maxRecorded } = config
  const rand = mulberry32(config.seed)

  const bounds: number[] = [0]
  for (const l of layers) bounds.push(bounds[bounds.length - 1] + l.thicknessCm)
  const total = bounds[bounds.length - 1]

  const stride = maxRecorded * 3
  const paths = new Float32Array(recordPaths * stride)
  const pathLengths = new Uint16Array(recordPaths)
  const fates = new Uint8Array(recordPaths)
  const absorbedByLayer = new Float64Array(layers.length)
  const bins = Math.ceil(total / binCm)
  const absorbedByDepth = new Float64Array(bins)
  const maxDepthCount = new Float64Array(bins)
  let remitted = 0
  let transmitted = 0
  let lost = 0

  for (let p = 0; p < photons; p++) {
    // Ponto uniforme no disco do spot.
    const r = spotRadiusCm * Math.sqrt(rand())
    const a = 2 * Math.PI * rand()
    let x = r * Math.cos(a)
    let y = r * Math.sin(a)
    let z = 0
    const dir: [number, number, number] = [0, 0, 1]
    let layer = 0
    let maxZ = 0
    let fate = Fate.Lost
    const record = p < recordPaths
    let vertices = 0
    const push = () => {
      if (!record || vertices >= maxRecorded) return
      const o = p * stride + vertices * 3
      paths[o] = x
      paths[o + 1] = y
      paths[o + 2] = z
      vertices++
    }
    push()

    for (let step = 0; step < maxSteps; step++) {
      // Caminho livre em unidades de profundidade óptica, consumido camada a camada.
      let tau = -Math.log(1 - rand())
      let escaped = false
      for (;;) {
        const l = layers[layer]
        const mut = l.muaPerCm + l.musPerCm
        const s = tau / mut
        // Distância até a fronteira da camada na direção do movimento.
        let toBoundary = Infinity
        if (dir[2] > 0) toBoundary = (bounds[layer + 1] - z) / dir[2]
        else if (dir[2] < 0) toBoundary = (bounds[layer] - z) / dir[2]
        if (s <= toBoundary) {
          x += dir[0] * s
          y += dir[1] * s
          z += dir[2] * s
          break
        }
        x += dir[0] * toBoundary
        y += dir[1] * toBoundary
        z += dir[2] * toBoundary
        tau -= toBoundary * mut
        if (dir[2] > 0) {
          if (layer === layers.length - 1) {
            fate = Fate.Transmitted
            escaped = true
            break
          }
          layer++
        } else {
          if (layer === 0) {
            fate = Fate.Remitted
            escaped = true
            break
          }
          layer--
        }
      }
      if (z > maxZ) maxZ = z
      // Grava a cada `recordEvery` interações e sempre no último ponto (fuga).
      if (escaped || (step + 1) % recordEvery === 0) push()
      if (escaped) break

      const l = layers[layer]
      if (rand() < l.muaPerCm / (l.muaPerCm + l.musPerCm)) {
        fate = Fate.Absorbed
        // O ponto de absorção é sempre gravado (pode não cair num múltiplo de recordEvery).
        if ((step + 1) % recordEvery !== 0) push()
        absorbedByLayer[layer]++
        absorbedByDepth[Math.min(Math.floor(z / binCm), bins - 1)]++
        break
      }
      scatter(dir, sampleHgCos(l.g, rand()), 2 * Math.PI * rand())
    }

    if (fate === Fate.Remitted) remitted++
    else if (fate === Fate.Transmitted) transmitted++
    else if (fate === Fate.Lost) lost++
    maxDepthCount[Math.min(Math.floor(maxZ / binCm), bins - 1)]++
    if (record) {
      pathLengths[p] = vertices
      fates[p] = fate
    }
  }

  // "Chegou até a faixa k" = profundidade máxima na faixa k ou além.
  const reachedDepth = new Float64Array(bins)
  let acc = 0
  for (let k = bins - 1; k >= 0; k--) {
    acc += maxDepthCount[k]
    reachedDepth[k] = acc / photons
  }
  for (let i = 0; i < layers.length; i++) absorbedByLayer[i] /= photons
  for (let k = 0; k < bins; k++) absorbedByDepth[k] /= photons

  return {
    paths,
    pathStride: stride,
    pathLengths,
    fates,
    absorbedByLayer,
    remitted: remitted / photons,
    transmitted: transmitted / photons,
    lost: lost / photons,
    absorbedByDepth,
    reachedDepth,
    binCm,
    totalThicknessCm: total,
  }
}

/** Profundidade (cm) que pelo menos `fraction` dos fótons alcançou. */
export function depthReachedBy(result: McResult, fraction: number): number {
  let depth = 0
  for (let k = 0; k < result.reachedDepth.length; k++) {
    if (result.reachedDepth[k] >= fraction) depth = (k + 1) * result.binCm
  }
  return Math.min(depth, result.totalThicknessCm)
}

/**
 * Posição na trajetória gravada `i` em `t` (s desde o lançamento), andando
 * `verticesPerSecond` vértices gravados por segundo, com interpolação linear.
 * Devolve `false` antes do lançamento ou depois do fim da trajetória.
 */
export function pathPosition(
  result: McResult,
  i: number,
  t: number,
  verticesPerSecond: number,
  out: [number, number, number]
): boolean {
  if (t < 0) return false
  const n = result.pathLengths[i]
  const f = t * verticesPerSecond
  if (f >= n - 1) return false
  const k = Math.floor(f)
  const u = f - k
  const o = i * result.pathStride + k * 3
  const p = result.paths
  out[0] = p[o] + (p[o + 3] - p[o]) * u
  out[1] = p[o + 1] + (p[o + 4] - p[o + 1]) * u
  out[2] = p[o + 2] + (p[o + 5] - p[o + 2]) * u
  return true
}

/** Último vértice gravado da trajetória `i` (ponto de absorção ou de fuga). */
export function pathEnd(result: McResult, i: number, out: [number, number, number]) {
  const o = i * result.pathStride + (result.pathLengths[i] - 1) * 3
  out[0] = result.paths[o]
  out[1] = result.paths[o + 1]
  out[2] = result.paths[o + 2]
}

/** Duração (s) da animação da trajetória `i`. */
export function pathDuration(result: McResult, i: number, verticesPerSecond: number): number {
  return Math.max(result.pathLengths[i] - 1, 0) / verticesPerSecond
}
