import { useCallback, useEffect, useMemo, useState } from 'react'

import { SimulationClock, SPEED_OPTIONS } from '../clock/clock'
import { APP_SUBTITLE, APP_TITLE } from '../content/app'
import { ClockContext, useClockDriver, useSimulationClock } from '../clock/use-simulation-clock'
import { findScene, scenes } from '../scenes/registry'
import { SceneCanvas } from '../scenes/scene-canvas'
import type { SceneDefinition } from '../scenes/types'
import { decodeHashState, type NumericParams } from '../state/hash-state'
import { resolveHashState } from '../state/initial-state'
import { useHashSync } from '../state/use-hash-sync'
import { Panel } from '../ui/panel'
import { Player } from '../ui/player/player'
import { Tabs, TabsList, TabsTrigger } from '../ui/primitives/tabs'
import { FloatCard } from '../ui/primitives/float-card'
import { Caption } from './caption'
import { ParameterPanel } from './parameter-panel'
import { ThemeToggle } from './theme-toggle'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'

function ConnectedPlayer({ scene }: { scene: SceneDefinition }) {
  const clock = useSimulationClock()
  const markers = useMemo(
    () => scene.script.steps.map((s) => ({ t: s.t, label: s.title })),
    [scene.script.steps]
  )
  return <Player {...clock} markers={markers} speedOptions={SPEED_OPTIONS} />
}

export function App() {
  // Estado inicial vem do hash: recarregar a página restaura a mesma cena.
  const [initial] = useState(() => resolveHashState(decodeHashState(window.location.hash), scenes))
  const [clock] = useState(
    () =>
      new SimulationClock({
        t: initial.t,
        playing: false,
        speed: initial.speed ?? 1,
        duration: initial.scene.script.duration,
      })
  )
  const [scene, setScene] = useState(initial.scene)
  const [params, setParams] = useState<NumericParams>(initial.params)

  useClockDriver(clock)
  useKeyboardShortcuts(clock)

  const selectScene = useCallback(
    (id: string) => {
      const next = findScene(id)
      if (!next) return
      setScene(next)
      setParams({ ...next.script.defaults })
      clock.load({ duration: next.script.duration })
    },
    [clock]
  )

  const onExternalChange = useCallback(
    (decoded: ReturnType<typeof decodeHashState>) => {
      const r = resolveHashState(decoded, scenes, scene)
      setScene(r.scene)
      setParams(r.params)
      clock.load({ duration: r.scene.script.duration, t: r.t })
      if (r.speed) clock.setSpeed(r.speed)
    },
    [clock, scene]
  )

  useHashSync({ clock, scene: scene.script.id, params, onExternalChange })

  useEffect(() => {
    document.title = `${scene.script.shortTitle} · ${APP_TITLE}`
  }, [scene])

  const setParam = useCallback((key: string, value: number) => setParams((p) => ({ ...p, [key]: value })), [])
  const applyParams = useCallback((values: NumericParams) => setParams((p) => ({ ...p, ...values })), [])

  return (
    <ClockContext.Provider value={clock}>
      <div className="relative h-dvh w-full overflow-hidden bg-background text-foreground">
        <SceneCanvas scene={scene} params={params} className="!absolute inset-0" />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2">
          <header className="flex items-start justify-between gap-2">
            <FloatCard className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
              <div className="min-w-0">
                <h1 className="text-sm leading-tight font-semibold">{APP_TITLE}</h1>
                <p className="text-[10px] leading-tight text-muted-foreground">{APP_SUBTITLE}</p>
              </div>
              <Tabs value={scene.script.id} onValueChange={selectScene} className="min-w-0">
                {/* `inline-flex`: o TabsList do DS não define display e, como bloco, os
                    triggers (inline-flex) alinhavam pela linha de base e desciam. */}
                <TabsList className="inline-flex h-8 max-w-full overflow-x-auto">
                  {scenes.map((s, i) => (
                    <TabsTrigger key={s.script.id} value={s.script.id} title={s.script.title} className="h-full">
                      <span className="text-muted-foreground tabular-nums">{i + 1}</span>
                      {s.script.shortTitle}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </FloatCard>
            <FloatCard className="flex shrink-0 items-center p-1.5">
              <ThemeToggle />
            </FloatCard>
          </header>

          <div className="flex min-h-0 flex-1 flex-col justify-between gap-2 md:flex-row-reverse md:items-start">
            <div className="flex min-h-0 w-full shrink-0 flex-col gap-2 md:max-h-full md:w-80">
              <ParameterPanel controls={scene.script.controls} params={params} onChange={setParam} onApply={applyParams} />
              {scene.Readout && (
                <Panel title="Grandezas">
                  <scene.Readout params={params} />
                </Panel>
              )}
            </div>
            <Caption
              steps={scene.script.steps}
              illustrative={scene.script.illustrative}
              className="md:self-end"
            />
          </div>

          <ConnectedPlayer scene={scene} />
        </div>
      </div>
    </ClockContext.Provider>
  )
}
