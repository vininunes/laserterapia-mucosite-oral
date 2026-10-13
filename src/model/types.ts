/**
 * Contrato de toda cena: dado o tempo `t` (segundos na timeline) e os
 * parâmetros, devolve o estado da cena. Deve ser determinístico — o mesmo
 * `(t, params)` sempre produz o mesmo estado. Sem Three.js nem React aqui.
 */
export type SceneModel<P, S> = (t: number, params: P) => S

export type Vec3 = [number, number, number]
