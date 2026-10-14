/**
 * Quantos pixels vale uma unidade 3D no ponto que a câmera enquadra. Escrito
 * pelo `ScaleProbe` (dentro do canvas) e lido pela barra de escala (fora),
 * sem re-renderizar a aplicação a cada frame de câmera.
 */
export class ScaleStore {
  private pxPerUnit = 0
  private readonly listeners = new Set<() => void>()

  get = (): number => this.pxPerUnit

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  set(pxPerUnit: number) {
    if (!(pxPerUnit > 0)) return
    // Abaixo de 0,5% de diferença a barra não muda visivelmente.
    if (this.pxPerUnit > 0 && Math.abs(pxPerUnit - this.pxPerUnit) / this.pxPerUnit < 0.005) return
    this.pxPerUnit = pxPerUnit
    this.listeners.forEach((l) => l())
  }
}
