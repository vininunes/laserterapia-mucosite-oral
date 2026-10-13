import { useEffect } from 'react'

import type { SimulationClock } from '../clock/clock'

const INTERACTIVE = 'input, textarea, select, button, [role="slider"], [role="combobox"], [role="tab"], [contenteditable]'

/** Espaço: play/pausa. ← →: recua/avança 1 s. Ignorado com foco em controles. */
export function useKeyboardShortcuts(clock: SimulationClock) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return
      const s = clock.getSnapshot()
      if (e.code === 'Space') clock.setPlaying(!s.playing)
      else if (e.code === 'ArrowLeft') clock.seek(s.t - 1)
      else if (e.code === 'ArrowRight') clock.seek(s.t + 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [clock])
}
