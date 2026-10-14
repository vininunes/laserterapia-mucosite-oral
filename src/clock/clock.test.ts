import { describe, expect, it, vi } from 'vitest'

import { advance, MAX_FRAME_DT, SimulationClock } from './clock'

const base = { t: 0, playing: true, speed: 1, duration: 10 }

describe('advance', () => {
  it('não mexe no tempo pausado', () => {
    const s = { ...base, playing: false }
    expect(advance(s, 0.05)).toBe(s)
  })

  it('aplica a velocidade', () => {
    expect(advance({ ...base, speed: 2 }, 0.05).t).toBeCloseTo(0.1)
  })

  it('limita o passo de um frame longo', () => {
    expect(advance(base, 5).t).toBeCloseTo(MAX_FRAME_DT)
  })

  it('para no fim', () => {
    const s = advance({ ...base, t: 9.99 }, 0.05)
    expect(s.t).toBe(10)
    expect(s.playing).toBe(false)
  })
})

describe('SimulationClock', () => {
  it('limita o seek à duração', () => {
    const clock = new SimulationClock({ ...base, playing: false })
    clock.seek(42)
    expect(clock.getSnapshot().t).toBe(10)
    clock.seek(-1)
    expect(clock.getSnapshot().t).toBe(0)
  })

  it('recomeça ao dar play no fim', () => {
    const clock = new SimulationClock({ ...base, t: 10, playing: false })
    clock.setPlaying(true)
    expect(clock.getSnapshot()).toMatchObject({ t: 0, playing: true })
  })

  it('só notifica quando o estado muda', () => {
    const clock = new SimulationClock({ ...base, playing: false })
    const listener = vi.fn()
    clock.subscribe(listener)
    clock.seek(0)
    clock.tick(0.05)
    expect(listener).not.toHaveBeenCalled()
    clock.seek(1)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('ignora velocidade inválida', () => {
    const clock = new SimulationClock(base)
    clock.setSpeed(0)
    clock.setSpeed(Number.NaN)
    expect(clock.getSnapshot().speed).toBe(1)
  })

  it('avisa o fim só quando a reprodução chega ao fim sozinha', () => {
    const clock = new SimulationClock({ ...base, t: 9.95, playing: true })
    const ended = vi.fn()
    clock.onEnd(ended)
    clock.tick(0.01)
    expect(ended).not.toHaveBeenCalled()
    clock.tick(0.1)
    expect(clock.getSnapshot()).toMatchObject({ t: 10, playing: false })
    expect(ended).toHaveBeenCalledTimes(1)
    // Parado no fim, novos ticks não avisam de novo.
    clock.tick(0.1)
    expect(ended).toHaveBeenCalledTimes(1)
  })

  it('pausar, buscar o fim ou trocar de cena não avisam o fim', () => {
    const clock = new SimulationClock({ ...base, t: 5, playing: true })
    const ended = vi.fn()
    clock.onEnd(ended)
    clock.setPlaying(false)
    clock.seek(10)
    clock.load({ duration: 3 })
    expect(ended).not.toHaveBeenCalled()
  })

  it('load troca a duração e reposiciona', () => {
    const clock = new SimulationClock({ ...base, t: 5 })
    clock.load({ duration: 3, t: 8 })
    expect(clock.getSnapshot()).toMatchObject({ duration: 3, t: 3, playing: false })
  })
})
