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
import { cn } from '../ui/lib/cn'
import { Panel } from '../ui/panel'
import { Player } from '../ui/player/player'
import { Tabs, TabsList, TabsTrigger } from '../ui/primitives/tabs'
import { FloatCard } from '../ui/primitives/float-card'
import { MOBILE_QUERY, useMediaQuery } from '../ui/use-media-query'
import { Caption } from './caption'
import { MobileDock } from './mobile-dock'
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
  const mobile = useMediaQuery(MOBILE_QUERY)

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

  const titleBlock = (
    <div className="min-w-0">
      <h1 className="text-sm leading-tight font-semibold">{APP_TITLE}</h1>
      <p className="hidden text-[10px] leading-tight text-muted-foreground sm:block">{APP_SUBTITLE}</p>
    </div>
  )

  const sceneTabs = (
    <Tabs value={scene.script.id} onValueChange={selectScene} className={cn('max-w-full min-w-0', mobile && 'w-full')}>
      {/* `inline-flex`: o TabsList do DS não define display e, como bloco, os
          triggers (inline-flex) alinhavam pela linha de base e desciam.
          `justify-start`: centralizado, o que transborda à esquerda fica
          fora do alcance da rolagem (cortava a 1ª aba no celular). */}
      <TabsList className={cn('inline-flex h-8 max-w-full justify-start overflow-x-auto', mobile && 'w-full')}>
        {scenes.map((s, i) => (
          <TabsTrigger key={s.script.id} value={s.script.id} title={s.script.title} className="h-full">
            <span className="text-muted-foreground tabular-nums">{i + 1}</span>
            {s.script.shortTitle}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )

  return (
    <ClockContext.Provider value={clock}>
      {/* No celular a gaveta e o player saem de cima da cena e ficam abaixo dela: a
          cena encolhe para a área livre e o conteúdo 3D fica centrado no que se vê. */}
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
        <div className="relative min-h-0 flex-1">
          <SceneCanvas scene={scene} params={params} className="!absolute inset-0" />

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2">
            {/* No celular o header ocupa a largura toda, com o tema ao lado do título e as abas embaixo. */}
            {mobile ? (
              <header className="w-full">
                <FloatCard className="flex w-full flex-col gap-2 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    {titleBlock}
                    <ThemeToggle />
                  </div>
                  {sceneTabs}
                </FloatCard>
              </header>
            ) : (
              <header className="flex items-start justify-between gap-2">
                <FloatCard className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
                  {titleBlock}
                  {sceneTabs}
                </FloatCard>
                <FloatCard className="flex shrink-0 items-center p-1.5">
                  <ThemeToggle />
                </FloatCard>
              </header>
            )}

            {!mobile && (
              <>
                <div className="flex min-h-0 flex-1 flex-row-reverse items-start justify-between gap-2">
                  <div className="flex max-h-full min-h-0 w-80 shrink-0 flex-col gap-2">
                    <ParameterPanel controls={scene.script.controls} params={params} onChange={setParam} onApply={applyParams} />
                    {scene.Readout && (
                      <Panel title="Grandezas">
                        <scene.Readout params={params} />
                      </Panel>
                    )}
                  </div>
                  <Caption steps={scene.script.steps} illustrative={scene.script.illustrative} className="self-end" />
                </div>
                <ConnectedPlayer scene={scene} />
              </>
            )}
          </div>
        </div>

        {/* Em tela pequena a legenda e os painéis cobririam a cena inteira: vão para a gaveta. */}
        {mobile && (
          <div className="flex shrink-0 flex-col gap-2 p-2 pt-0">
            <MobileDock scene={scene} params={params} onChange={setParam} onApply={applyParams} />
            <ConnectedPlayer scene={scene} />
          </div>
        )}
      </div>
    </ClockContext.Provider>
  )
}
