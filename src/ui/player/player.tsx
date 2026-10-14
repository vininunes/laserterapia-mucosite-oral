import { useMemo } from 'react'

import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'

import { cn } from '../lib/cn'
import { Button } from '../primitives/button'
import { FloatCard } from '../primitives/float-card'
import { Select } from '../primitives/select'
import { Slider } from '../primitives/slider'
import Tooltip from '../primitives/tooltip'
import { formatTime } from './format-time'
import { nextMarker, previousMarker } from './markers'

export interface PlayerMarker {
  t: number
  label: string
}

export interface PlayerProps {
  /** Duração da timeline, em segundos. */
  duration: number
  t: number
  playing: boolean
  speed: number
  markers?: PlayerMarker[]
  speedOptions?: readonly number[]
  onSeek(t: number): void
  onPlayingChange(playing: boolean): void
  onSpeedChange(speed: number): void
  /**
   * Navegação própria para os botões ⏮ ⏭ (ex.: trocar de cena). Sem ela, os
   * botões pulam entre os marcadores da timeline.
   */
  navigation?: {
    previous: { label: string; onClick(): void; disabled?: boolean }
    next: { label: string; onClick(): void; disabled?: boolean }
  }
  className?: string
}

const DEFAULT_SPEEDS = [0.25, 0.5, 1, 2, 4, 8, 16] as const

const speedLabel = (speed: number) => `${String(speed).replace('.', ',')}×`

/**
 * Player controlado por props. Visual adaptado do `PlayerDock` do T2S (barra
 * h-10, botões outline size-7, slider num box outline); toda a lógica de
 * playback do VTS (jotai, chunks AIS, datas absolutas) foi removida — o tempo
 * aqui é `t` em segundos e quem avança é o dono das props.
 */
export function Player({
  duration,
  t,
  playing,
  speed,
  markers = [],
  speedOptions = DEFAULT_SPEEDS,
  onSeek,
  onPlayingChange,
  onSpeedChange,
  navigation,
  className,
}: PlayerProps) {
  const speedItems = useMemo(
    () => [speedOptions.map((s) => ({ value: String(s), name: speedLabel(s) }))],
    [speedOptions]
  )

  const sliderMarkers = useMemo(
    () =>
      duration > 0
        ? markers.map((m) => ({
            position: (m.t / duration) * 100,
            className: 'bg-foreground/50',
            title: m.label,
          }))
        : undefined,
    [markers, duration]
  )

  const markerTimes = markers.map((m) => m.t)
  const previous = navigation?.previous ?? {
    label: 'Etapa anterior',
    onClick: () => onSeek(previousMarker(markerTimes, t)),
  }
  const next = navigation?.next ?? {
    label: 'Próxima etapa',
    onClick: () => onSeek(nextMarker(markerTimes, t, duration)),
  }

  return (
    <FloatCard className={cn('flex h-10 w-full items-center gap-1.5 px-1.5', className)}>
      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip text={previous.label}>
          <Button
            variant="outline"
            size="icon"
            className="size-7 rounded-l-lg"
            onClick={previous.onClick}
            disabled={previous.disabled}
            aria-label={previous.label}
          >
            <SkipBack className="fill-current" />
          </Button>
        </Tooltip>

        <Tooltip text={playing ? 'Pausar' : 'Reproduzir'}>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={() => onPlayingChange(!playing)}
            aria-label={playing ? 'Pausar' : 'Reproduzir'}
          >
            {playing ? <Pause className="fill-current" /> : <Play className="fill-current" />}
          </Button>
        </Tooltip>

        <Tooltip text={next.label}>
          <Button
            variant="outline"
            size="icon"
            className="size-7"
            onClick={next.onClick}
            disabled={next.disabled}
            aria-label={next.label}
          >
            <SkipForward className="fill-current" />
          </Button>
        </Tooltip>

        <Select
          items={speedItems}
          value={String(speed)}
          onValueChange={(value) => onSpeedChange(Number(value))}
          className="w-20 text-xs"
          contentProps={{ side: 'top' }}
          aria-label="Velocidade"
        />
      </div>

      <div className="flex h-7 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-input/40 px-2 shadow-xs">
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{formatTime(t)}</span>
        <Slider
          min={0}
          max={Math.max(duration, 0.01)}
          step={0.01}
          value={[t]}
          onValueChange={(values) => onSeek(values[0])}
          markers={sliderMarkers}
          // O trilho padrão (`muted`) some sobre a caixa da timeline nos dois temas.
          // Início reto: ali fica a marca da primeira etapa (t = 0).
          className="min-w-0 flex-1 [&_[data-slot=slider-track]]:rounded-l-none [&_[data-slot=slider-track]]:bg-foreground/20"
          aria-label="Linha do tempo"
        />
        <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
      </div>
    </FloatCard>
  )
}
