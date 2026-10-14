import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { SimulationClock, SPEED_OPTIONS } from '../clock/clock'
import { APP_SUBTITLE, APP_TITLE } from '../content/app'
import { ClockContext, useClockDriver, useSimulationClock } from '../clock/use-simulation-clock'
import { findScene, scenes } from '../scenes/registry'
import { ScaleStore } from '../scenes/scale-store'
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
import { ScaleBar } from './scale-bar'
import { nextStep, previousStep, type StepTarget } from './step-navigation'
import { ThemeToggle } from './theme-toggle'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'

/** Inícios das etapas de cada cena, na ordem das abas. */
const STEP_TIMES = scenes.map((s) => s.script.steps.map((step) => step.t))

function ConnectedPlayer({ scene, onNavigate }: { scene: SceneDefinition; onNavigate(target: StepTarget): void }) {
  const clock = useSimulationClock()
  const markers = useMemo(
    () => scene.script.steps.map((s) => ({ t: s.t, label: s.title })),
    [scene.script.steps]
  )
  // ⏮ ⏭ andam pelas etapas e atravessam para a cena vizinha nas pontas: depois
  // da última etapa vem a próxima cena; antes da primeira, a última etapa da anterior.
  const index = scenes.findIndex((s) => s.script.id === scene.script.id)
  const previous = previousStep(STEP_TIMES, index, clock.t)
  const next = nextStep(STEP_TIMES, index, clock.t)
  const navigation = {
    previous: {
      label: previous && previous.scene !== index ? 'Última etapa da cena anterior' : 'Etapa anterior',
      onClick: () => previous && onNavigate(previous),
      disabled: !previous,
    },
    next: {
      label: next && next.scene !== index ? 'Próxima cena' : 'Próxima etapa',
      onClick: () => next && onNavigate(next),
      disabled: !next,
    },
  }
  return <Player {...clock} markers={markers} speedOptions={SPEED_OPTIONS} navigation={navigation} />
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
  const [scaleStore] = useState(() => new ScaleStore())

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

  // Cena atual para callbacks que não re-renderizam (fim da reprodução, ⏮ ⏭).
  const sceneId = useRef(scene.script.id)
  useEffect(() => {
    sceneId.current = scene.script.id
  }, [scene])

  /** Vai para uma etapa, trocando de cena se preciso; se estava tocando, continua tocando. */
  const navigate = useCallback(
    (target: StepTarget) => {
      const next = scenes[target.scene]
      if (next.script.id !== sceneId.current) {
        const wasPlaying = clock.getSnapshot().playing
        selectScene(next.script.id)
        if (wasPlaying) clock.setPlaying(true)
      }
      clock.seek(target.t)
    },
    [clock, selectScene]
  )

  // Quando uma cena termina tocando, a próxima começa e continua tocando, até
  // a última. Pausar, buscar o fim ou trocar de cena à mão não encadeiam.
  useEffect(
    () =>
      clock.onEnd(() => {
        const i = scenes.findIndex((s) => s.script.id === sceneId.current)
        const next = i >= 0 ? scenes[i + 1] : undefined
        if (!next) return
        selectScene(next.script.id)
        clock.setPlaying(true)
      }),
    [clock, selectScene]
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
    <div className={cn('min-w-0', mobile && 'flex-1')}>
      {/* Uma linha só: no celular a fonte acompanha a largura da tela; reticências só em último caso. */}
      <h1 className="truncate text-[clamp(10px,3.2vw,14px)] leading-tight font-semibold sm:text-sm" title={APP_TITLE}>
        {APP_TITLE}
      </h1>
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
          <TabsTrigger
            key={s.script.id}
            value={s.script.id}
            title={s.script.title}
            // Aba ativa com o primary nos dois temas (o padrão do DS é fundo neutro).
            className="group h-full data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary"
          >
            <span className="text-muted-foreground tabular-nums group-data-[state=active]:text-primary-foreground/70">
              {i + 1}
            </span>
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
          <SceneCanvas scene={scene} params={params} scaleStore={scaleStore} className="!absolute inset-0" />

          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 p-2">
            {/* No celular o header ocupa a largura toda, com o tema ao lado do título e as abas embaixo. */}
            {mobile && (
              <header className="w-full">
                <FloatCard className="flex w-full flex-col gap-2 p-2">
                  <div className="flex items-center justify-between gap-2">
                    {titleBlock}
                    <ThemeToggle />
                  </div>
                  {sceneTabs}
                </FloatCard>
              </header>
            )}

            {/* No celular a barra de escala fica no canto inferior esquerdo da cena. */}
            {mobile && (
              <ScaleBar scale={scene.script.scale} store={scaleStore} className="mt-auto self-start" />
            )}

            {!mobile && (
              // Desktop: título, abas e tema num card só, à esquerda; a coluna de
              // painéis começa no topo, à direita. A legenda fica embaixo, à esquerda.
              <>
                <div className="flex min-h-0 flex-1 items-start gap-2">
                  <div className="flex h-full min-w-0 flex-1 flex-col items-start justify-between gap-2">
                    <header className="max-w-full">
                      <FloatCard className="flex min-w-0 flex-wrap items-center gap-2 p-2">
                        {titleBlock}
                        {sceneTabs}
                        <ThemeToggle />
                      </FloatCard>
                    </header>
                    <div className="flex w-full flex-col items-start gap-2">
                      <ScaleBar scale={scene.script.scale} store={scaleStore} />
                      <Caption steps={scene.script.steps} illustrative={scene.script.illustrative} />
                    </div>
                  </div>
                  {/* Parâmetros fica com a altura do próprio conteúdo e não encolhe;
                      Grandezas ocupa o que sobra até a timeline e rola por dentro.
                      Assim um não encolhe o outro e nenhum passa da timeline. */}
                  <div className="flex max-h-full min-h-0 w-80 shrink-0 flex-col gap-2">
                    <ParameterPanel
                      controls={scene.script.controls}
                      params={params}
                      onChange={setParam}
                      onApply={applyParams}
                      className="max-h-none shrink-0"
                    />
                    {scene.Readout && (
                      <Panel title="Grandezas">
                        <scene.Readout params={params} />
                      </Panel>
                    )}
                  </div>
                </div>
                <ConnectedPlayer scene={scene} onNavigate={navigate} />
              </>
            )}
          </div>
        </div>

        {/* Em tela pequena a legenda e os painéis cobririam a cena inteira: vão para a gaveta. */}
        {mobile && (
          <div className="flex shrink-0 flex-col gap-2 p-2 pt-0">
            <MobileDock scene={scene} params={params} onChange={setParam} onApply={applyParams} />
            <ConnectedPlayer scene={scene} onNavigate={navigate} />
          </div>
        )}
      </div>
    </ClockContext.Provider>
  )
}
