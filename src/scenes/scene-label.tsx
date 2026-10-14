import { useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'

import { useFrame, useThree } from '@react-three/fiber'
import { Vector3, type Group, type Object3D } from 'three'

import type { Vec3 } from '../model/types'

export const LABEL_BASE_CLASS =
  'pointer-events-none absolute top-0 left-0 z-[5] rounded bg-background/70 px-1 text-[11px] font-medium whitespace-nowrap text-foreground select-none'

export function isWorldVisible(o: Object3D | null): boolean {
  for (let n = o; n; n = n.parent) if (!n.visible) return false
  return true
}

const projected = new Vector3()

/**
 * Rótulo de texto preso a um ponto da cena. É um `<div>` simples criado e
 * posicionado à mão a cada frame — sem uma raiz React por rótulo, como faz o
 * `Html` do drei (que perdia o conteúdo do primeiro rótulo ao trocar o
 * elemento-alvo). Fica oculto quando algum ancestral está invisível ou o
 * ponto está atrás da câmera. Estilizado por classes, então segue o tema.
 */
export function SceneLabel({
  position,
  text,
  className = '',
  anchor = 'center',
  ref,
}: {
  position: Vec3
  text: string
  className?: string
  /** `left`: o texto começa no ponto; `right`: termina no ponto; `top`: fica abaixo dele, centrado. */
  anchor?: 'center' | 'left' | 'right' | 'top'
  /** O `<div>` do rótulo, para ajustar opacidade no `useFrame` da cena. */
  ref?: Ref<HTMLDivElement>
}) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const group = useRef<Group>(null)
  const [el] = useState(() => document.createElement('div'))

  useImperativeHandle(ref, () => el, [el])

  useLayoutEffect(() => {
    const container = gl.domElement.parentElement
    container?.appendChild(el)
    return () => el.remove()
  }, [gl, el])

  useLayoutEffect(() => {
    el.className = `${LABEL_BASE_CLASS} ${className}`
  }, [el, className])

  useLayoutEffect(() => {
    el.textContent = text
  }, [el, text])

  useFrame(() => {
    const g = group.current
    if (!g) return
    // O useFrame roda antes de o renderer atualizar as matrizes: um rótulo
    // recém-montado leria a matrixWorld antiga (sem o deslocamento do pai).
    g.updateWorldMatrix(true, false)
    projected.setFromMatrixPosition(g.matrixWorld).project(camera)
    const show = projected.z < 1 && isWorldVisible(g)
    el.style.display = show ? '' : 'none'
    if (!show) return
    const x = ((projected.x + 1) / 2) * size.width
    const y = ((1 - projected.y) / 2) * size.height
    const dx = anchor === 'left' ? '0' : anchor === 'right' ? '-100%' : '-50%'
    const dy = anchor === 'top' ? '0' : '-50%'
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(${dx}, ${dy})`
  })

  return <group ref={group} position={position} />
}
