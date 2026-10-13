import { BufferAttribute, BufferGeometry, LineBasicMaterial, LineSegments, type InterleavedBufferAttribute } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2.js'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'

/**
 * Objetos Three.js de uma curva de campo: a linha grossa (Line2) e os
 * "fios" verticais que desenham o vetor do campo a partir do eixo. Os
 * buffers são alocados uma vez; a cada frame só os valores mudam.
 */
export interface FieldCurve {
  line: Line2
  hairs: LineSegments<BufferGeometry, LineBasicMaterial>
  dispose(): void
}

export function createFieldCurve(samples: number, hairEvery: number): FieldCurve {
  const geometry = new LineGeometry()
  geometry.setPositions(new Float32Array(samples * 3))
  const material = new LineMaterial({
    linewidth: 2.5,
    transparent: true,
    depthWrite: false,
    dashSize: 0.16,
    gapSize: 0.1,
  })
  const line = new Line2(geometry, material)
  line.frustumCulled = false

  const hairCount = Math.floor((samples - 1) / hairEvery) + 1
  const hairGeometry = new BufferGeometry()
  hairGeometry.setAttribute('position', new BufferAttribute(new Float32Array(hairCount * 6), 3))
  const hairMaterial = new LineBasicMaterial({ transparent: true, depthWrite: false })
  const hairs = new LineSegments(hairGeometry, hairMaterial)
  hairs.frustumCulled = false

  return {
    line,
    hairs,
    dispose() {
      geometry.dispose()
      material.dispose()
      hairGeometry.dispose()
      hairMaterial.dispose()
    },
  }
}

/**
 * Escreve a curva: `xs[i]` no eixo, deslocada de `values[i] · amplitude` na
 * direção `axis` (1 = y para E, 2 = z para B). Só desenha até `visibleUntil`
 * (índice do último ponto alcançado pela onda).
 */
export function writeFieldCurve(
  curve: FieldCurve,
  xs: Float32Array,
  values: Float32Array,
  amplitude: number,
  axis: 1 | 2,
  visibleUntil: number,
  hairEvery: number
) {
  const start = curve.line.geometry.attributes.instanceStart as InterleavedBufferAttribute
  const segments = start.data.array as Float32Array
  const n = xs.length
  // Layout do LineSegmentsGeometry: 6 floats por segmento (início, fim).
  for (let i = 0; i < n - 1; i++) {
    const o = i * 6
    segments[o] = xs[i]
    segments[o + 1] = axis === 1 ? values[i] * amplitude : 0
    segments[o + 2] = axis === 2 ? values[i] * amplitude : 0
    segments[o + 3] = xs[i + 1]
    segments[o + 4] = axis === 1 ? values[i + 1] * amplitude : 0
    segments[o + 5] = axis === 2 ? values[i + 1] * amplitude : 0
  }
  start.data.needsUpdate = true
  curve.line.geometry.instanceCount = Math.max(0, Math.min(visibleUntil, n - 1))

  const hairPos = curve.hairs.geometry.attributes.position as BufferAttribute
  const h = hairPos.array as Float32Array
  let count = 0
  for (let i = 0; i < n; i += hairEvery) {
    const o = count * 6
    const v = i <= visibleUntil ? values[i] * amplitude : 0
    h[o] = xs[i]
    h[o + 1] = 0
    h[o + 2] = 0
    h[o + 3] = xs[i]
    h[o + 4] = axis === 1 ? v : 0
    h[o + 5] = axis === 2 ? v : 0
    count++
  }
  hairPos.needsUpdate = true
}

/**
 * Tracejado = radiação invisível (IV/UV): a cor na tela é só representação.
 * Trocar `dashed` recompila o shader, então só mexe quando muda.
 */
export function setDashed(curve: FieldCurve, dashed: boolean) {
  const material = curve.line.material
  if (material.dashed !== dashed) {
    material.dashed = dashed
    material.needsUpdate = true
  }
  if (dashed) curve.line.computeLineDistances()
}
