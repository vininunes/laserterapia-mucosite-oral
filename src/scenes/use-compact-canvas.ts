import { useThree } from '@react-three/fiber'

/** Abaixo desta largura (px) do canvas os rótulos das cenas passam ao formato curto. */
export const COMPACT_CANVAS_WIDTH = 640

/** Canvas estreito (celular): as cenas encurtam ou reorganizam seus rótulos. */
export function useCompactCanvas() {
  return useThree((s) => s.size.width < COMPACT_CANVAS_WIDTH)
}
