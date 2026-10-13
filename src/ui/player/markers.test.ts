import { describe, expect, it } from 'vitest'

import { nextMarker, previousMarker } from './markers'

describe('marcadores', () => {
  const markers = [0, 4, 8]

  it('recua para o marcador anterior', () => {
    expect(previousMarker(markers, 6)).toBe(4)
    // Encostado num marcador, recua para o anterior a ele.
    expect(previousMarker(markers, 4.1)).toBe(0)
    expect(previousMarker(markers, 0)).toBe(0)
  })

  it('avança para o próximo marcador ou para o fim', () => {
    expect(nextMarker(markers, 4, 12)).toBe(8)
    expect(nextMarker(markers, 9, 12)).toBe(12)
  })
})
