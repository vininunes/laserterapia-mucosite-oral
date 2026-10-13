import { useRef } from 'react'

import { Grid } from '@react-three/drei'
import type { Mesh } from 'three'

import { useClockFrame } from '../clock/use-simulation-clock'
import { testCubeModel, type TestCubeParams } from '../model/test-cube'
import { useThemeTokens } from '../ui/theme/theme-tokens'
import type { SceneProps } from './types'

export function TestCubeScene({ params }: SceneProps<TestCubeParams>) {
  const tokens = useThemeTokens()
  const mesh = useRef<Mesh>(null)

  useClockFrame((t) => {
    const m = mesh.current
    if (!m) return
    const s = testCubeModel(t, params)
    m.rotation.set(s.rotationX, s.rotationY, 0)
    m.scale.setScalar(s.scale)
  })

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 3]} intensity={1.8} />
      <mesh ref={mesh}>
        <boxGeometry />
        <meshStandardMaterial color={tokens.primary} roughness={0.45} />
      </mesh>
      <Grid
        position={[0, -1.25, 0]}
        cellColor={tokens.border}
        sectionColor={tokens.mutedForeground}
        cellSize={0.5}
        sectionSize={2.5}
        fadeDistance={20}
        infiniteGrid
      />
    </>
  )
}
