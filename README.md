# Laser e fotobiomodulação — simulação didática

Visualizações 3D interativas sobre ondas eletromagnéticas, funcionamento do laser e fotobiomodulação (PBM) aplicada à mucosite oral. Projeto de pesquisa acadêmica com objetivo **didático**: não é simulação física rigorosa nem ferramenta clínica.

| Item | Valor |
|---|---|
| Stack | Vite 7, React 19, TypeScript, React Three Fiber 9, drei 10, Tailwind CSS 4 |
| UI | Copiada do design system T2S (ver `docs/ui-vendoring.md`) |
| Deploy | Site estático (`dist/`), sem backend |

## Comandos

```bash
yarn install
yarn dev        # servidor de desenvolvimento
yarn test       # testes unitários (Vitest) de src/model, relógio e estado
yarn build      # typecheck + build estático em dist/
yarn preview    # serve o build
```

## Arquitetura

| Camada | Pasta | Regra |
|---|---|---|
| Modelo | `src/model/` | TypeScript puro, sem React nem Three.js. `(t, params) → estado`, determinístico |
| Roteiro | `src/content/` | Dados: etapas, legendas, câmera, parâmetros científicos com fonte, referências |
| Renderização | `src/scenes/` | Componentes R3F que só leem o modelo; rótulos 3D com `SceneLabel` |
| Relógio | `src/clock/` | `SimulationClock` (puro) + hooks; o player não conhece Three.js e as cenas não conhecem o player |
| Estado da URL | `src/state/` | Cena, parâmetros, `t` e velocidade no hash (`#cena=…&t=…&v=…&p.<param>=…`) |
| UI | `src/ui/` | Primitivos do design system, player e painel |

Atalhos: espaço (play/pausa), ← → (±1 s).

## Cenas

| # | Cena | Documento |
|---|---|---|
| 1 | Onda eletromagnética | `docs/cenas/01-onda-em.md` |
| 6 | Dosimetria: protocolos MASCC/ISOO | `docs/cenas/06-dosimetria.md` |

Cada cena segue o molde da cena 1: `src/model/<cena>.ts` (+ teste), `src/content/scenes/<cena>.ts`, `src/scenes/<cena>/` e registro em `src/scenes/registry.ts`.
