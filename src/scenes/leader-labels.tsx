import { createRef, useLayoutEffect, useMemo } from 'react'

import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, type Group } from 'three'

import type { Vec3 } from '../model/types'
import { isWorldVisible, LABEL_BASE_CLASS } from './scene-label'

export interface LeaderLabelItem {
  /** Ponto da cena que o rótulo aponta (coordenadas locais do pai). */
  position: Vec3
  text: string
  /** Classes do rótulo; a cor do texto (`text-*`) também pinta a linha-guia. */
  className?: string
}

interface LeaderLabelsProps {
  items: LeaderLabelItem[]
  /** Lado da coluna de rótulos em relação aos pontos. */
  side?: 'left' | 'right'
  /** Para onde um rótulo se desloca quando encostaria no vizinho. */
  stack?: 'up' | 'down'
  /** Distância horizontal (px) entre o ponto e a coluna de rótulos. */
  offsetPx?: number
  /** Folga vertical (px) mínima entre rótulos. */
  gapPx?: number
  opacity?: number
}

const projected = new Vector3()

/**
 * Rótulos em coluna ao lado dos seus pontos, ligados a eles por uma
 * linha-guia. Pontos próximos na tela (anéis de fluência quase na mesma
 * altura) teriam os textos sobrepostos; aqui cada rótulo sobe o necessário
 * para não encostar no de baixo, e a linha mostra a que ponto pertence.
 * Posiciona tudo sozinho a cada frame (projeta os pontos e mede os rótulos),
 * então não depende da ordem dos `useFrame` de outros rótulos.
 */
export function LeaderLabels({
  items: itemsProp,
  side = 'right',
  stack = 'up',
  offsetPx = 28,
  gapPx = 3,
  opacity = 1,
}: LeaderLabelsProps) {
  // Quem chama costuma montar o array a cada render: só recria os elementos
  // quando o conteúdo muda de fato.
  const signature = JSON.stringify(itemsProp)
  const items = useMemo(() => itemsProp, [signature])
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  const anchors = useMemo(() => items.map(() => createRef<Group>()), [items])
  const els = useMemo(
    () =>
      items.map(() => ({
        label: document.createElement('div'),
        leader: document.createElement('div'),
      })),
    [items]
  )

  useLayoutEffect(() => {
    const container = gl.domElement.parentElement
    els.forEach(({ label, leader }, i) => {
      const item = items[i]
      label.className = `${LABEL_BASE_CLASS} ${item.className ?? ''}`
      label.textContent = item.text
      // Linha de 1px que gira em torno da ponta esquerda (o ponto da cena).
      leader.className = `pointer-events-none absolute top-0 left-0 z-[4] h-px origin-left bg-current opacity-60 ${item.className ?? ''}`
      container?.append(leader, label)
    })
    return () => els.forEach(({ label, leader }) => (label.remove(), leader.remove()))
  }, [gl, els, items])

  useLayoutEffect(() => {
    for (const { label, leader } of els) {
      label.style.opacity = String(opacity)
      leader.style.opacity = String(opacity * 0.6)
    }
  }, [els, opacity])

  useFrame(() => {
    const visible: { i: number; x: number; y: number; h: number }[] = []
    anchors.forEach((ref, i) => {
      const g = ref.current
      const { label, leader } = els[i]
      if (!g) return
      g.updateWorldMatrix(true, false)
      projected.setFromMatrixPosition(g.matrixWorld).project(camera)
      const show = projected.z < 1 && isWorldVisible(g)
      label.style.display = leader.style.display = show ? '' : 'none'
      if (!show) return
      visible.push({
        i,
        x: ((projected.x + 1) / 2) * size.width,
        y: ((1 - projected.y) / 2) * size.height,
        h: label.offsetHeight,
      })
    })

    // `up`: de baixo para cima, cada rótulo fica na altura do seu ponto ou logo
    // acima do anterior, o que for mais alto na tela. `down`: o espelho disso.
    visible.sort((a, b) => (stack === 'up' ? b.y - a.y : a.y - b.y))
    let limit = stack === 'up' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
    for (const v of visible) {
      const top =
        stack === 'up' ? Math.min(v.y - v.h / 2, limit - gapPx - v.h) : Math.max(v.y - v.h / 2, limit + gapPx)
      limit = stack === 'up' ? top : top + v.h
      const { label, leader } = els[v.i]
      // `lx`: borda do rótulo voltada para o ponto, onde a linha termina.
      const lx = side === 'right' ? v.x + offsetPx : v.x - offsetPx
      const ly = top + v.h / 2
      const left = side === 'right' ? lx : lx - label.offsetWidth
      label.style.transform = `translate3d(${left}px, ${top}px, 0)`
      const dx = lx - v.x
      const dy = ly - v.y
      leader.style.width = `${Math.hypot(dx, dy)}px`
      leader.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) rotate(${Math.atan2(dy, dx)}rad)`
    }
  })

  return (
    <>
      {items.map((item, i) => (
        <group key={i} ref={anchors[i]} position={item.position} />
      ))}
    </>
  )
}
