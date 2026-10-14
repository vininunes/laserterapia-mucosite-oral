# Laser e fotobiomodulação — simulação didática

Visualizações 3D interativas sobre ondas eletromagnéticas, funcionamento do laser e fotobiomodulação (PBM) aplicada à mucosite oral. Projeto de pesquisa acadêmica com objetivo **didático**: não é simulação física rigorosa nem ferramenta clínica.

| Item | Valor |
|---|---|
| Stack | Vite 7, React 19, TypeScript, React Three Fiber 9, drei 10, Tailwind CSS 4 |
| UI | Copiada do design system T2S (ver `docs/ui-vendoring.md`) |
| Deploy | Site estático (`dist/`), sem backend; GitHub Pages via `.github/workflows/deploy-pages.yml` |

## Comandos

```bash
yarn install
yarn dev        # servidor de desenvolvimento
yarn test       # testes unitários (Vitest) de src/model, relógio e estado
yarn build      # typecheck + build estático em dist/
yarn build:single  # um único dist-single/index.html (JS, CSS e worker embutidos) para abrir como arquivo
yarn preview    # serve o build
```

## Publicação no GitHub Pages

O workflow `.github/workflows/deploy-pages.yml` roda a cada push na `main` (ou manualmente, em Actions): instala, testa, gera `dist/` e publica. A versão de arquivo único vai junto, em `laserterapia-mucosite-oral-offline.html`, para quem quiser baixar e usar sem internet. Os caminhos relativos (`base: './'`) fazem o site funcionar no endereço `https://<usuário>.github.io/<repositório>/`.

Uma vez só, no GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

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

Ordem das abas, da física da luz ao tratamento:

| Aba | Cena | Documento |
|---|---|---|
| 1 | A luz: onda eletromagnética, λ e energia do fóton | `docs/cenas/01-onda-em.md` |
| 2 | Tecido: absorção, espalhamento e profundidade (Monte Carlo) | `docs/cenas/04-tecido.md` |
| 3 | Célula: citocromo c oxidase, ATP e inflamação (esquemática) | `docs/cenas/05-celula.md` |
| 4 | Protocolos MASCC/ISOO para prevenção | `docs/cenas/06-dosimetria.md` |
| 5 | Calculadora de dose | `docs/cenas/07-calculadora.md` |

Cada cena segue o molde: `src/model/<cena>.ts` (+ teste), `src/content/scenes/<cena>.ts`, `src/scenes/<cena>/` e registro em `src/scenes/registry.ts`. A numeração dos documentos segue o plano original; a das abas é a ordem de exibição.
