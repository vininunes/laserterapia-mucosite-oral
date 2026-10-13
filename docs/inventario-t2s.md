# Inventário T2S — componentes para o simulador laser/PBM

Levantamento da Fase 0 (somente leitura). Lista o que pode ser copiado do ecossistema T2S para `src/ui/`, de onde vem, do que depende e como adaptar.

| Item | Valor |
|---|---|
| Fonte A | `~/technomar/pattern/vts-application` — commit `d909622fadd9335ddd2438a660a76945d5a2320c` (09/10/2026), árvore limpa |
| Fonte B | `~/technomar/pattern/design-system` (`@technomar/design-system` 0.1.0) — commit `3b42c90728e19b032e68b6e948b604f1a55dd544` (09/09/2026) |
| Documentação lida | `docs/applications/design-system/design-system-application.md`, `CLAUDE.md` do vts |
| Recomendação | Copiar **primitivos e tokens da Fonte B** (já desacoplados) e reescrever **player** e **painel** com base no visual da Fonte A |
| Stack herdada | React 19, Tailwind CSS v4, Radix UI, `class-variance-authority`, `clsx` + `tailwind-merge`, `lucide-react`, `framer-motion` |
| Fora do escopo | Mapbox, deck.gl, jotai, react-query, i18next, rotas, autenticação |

## Achado principal: existe uma versão já desacoplada

O plano previa copiar do `vts-application`. Na leitura apareceu o repositório `pattern/design-system`, que é a extração dos base-components do vts com as regras: sem alias `@/`, sem `jotai`, sem `react-router`, sem `react-query`, cores só via tokens. Os primitivos de lá diferem dos do vts apenas no import de `cn` e na remoção do estado global (ex.: `FloatCard` lê `data-blur` em vez do átomo `decreaseGpuUsageState`).

**Proposta:** usar a Fonte B para primitivos, tokens e `ThemeProvider`; usar a Fonte A só como referência visual do player (que não existe na Fonte B, pois é feature de domínio). Única coisa que a Fonte A tem e a B não: a prop `markers` do `Slider`, necessária para os marcadores da timeline — portar esse trecho (11 linhas) para a cópia.

## Tokens e tema

| Arquivo | Fonte | Dependências | Acoplamento |
|---|---|---|---|
| `src/styles/tokens.css` | B | `tailwindcss` v4, `tw-animate-css` | Nenhum. Matriz claro/escuro × glass/solid, variants `dark:`, `solid:`, `no-blur:` |
| `src/theme/theme-provider.tsx` | B | React | Nenhum. Modo controlado ou `localStorage` (`ds-color-scheme`) |
| `src/lib/cn.ts` | B | `clsx`, `tailwind-merge` | Nenhum |
| `src/styles/global.css` | A | — | Alto: fundo `#6bc8eb` do mapa, regras de Mapbox, sonner, cursores de drag. **Não copiar** |

**Adaptação:** o simulador não fica sobre um mapa, então a surface padrão deve ser `solid` (`<ThemeProvider surface="solid">`). A ponte para o 3D lê as CSS variables em runtime (`getComputedStyle(document.documentElement).getPropertyValue('--background')` etc.) e reage à troca de `.dark` via `MutationObserver` no `<html>`. Tokens úteis para a cena: `--background`, `--foreground`, `--muted-foreground` (grade e eixos), `--border`, `--primary` (destaques), `--warning` (parâmetro pendente).

## Inputs e primitivos

| Componente | Caminho na Fonte B | Dependências externas | Uso no simulador |
|---|---|---|---|
| `Button` | `src/primitives/button.tsx` | `@radix-ui/react-slot`, `cva` | Controles do player, troca de cena |
| `Slider` | `src/primitives/slider.tsx` | `@radix-ui/react-slider` | λ, potência, tempo; barra de progresso do player |
| `Select` + `SelectBase` | `src/primitives/select.tsx`, `select-base.tsx` | `@radix-ui/react-select`, `lucide-react` | Velocidade, presets de λ, seleção de cena |
| `InputNumber` + `InputBase` | `src/primitives/input-number.tsx`, `input-base.tsx` | — | Parâmetros numéricos de dosimetria |
| `Label` | `src/primitives/label.tsx` | `@radix-ui/react-label` | Rótulos dos campos |
| `Switch` | `src/primitives/switch.tsx` | `@radix-ui/react-switch` | Liga/desliga camadas (campo B, partículas) |
| `Tooltip` + `TooltipBase` | `src/primitives/tooltip.tsx`, `tooltip-base.tsx` | `@radix-ui/react-tooltip` | Dicas nos controles; aviso de parâmetro pendente |
| `Tabs` | `src/primitives/tabs.tsx` | `@radix-ui/react-tabs` | Navegação entre as 6 cenas |
| `FloatCard` | `src/primitives/float-card.tsx` | `framer-motion` | Base do painel e do player |

Nenhum desses arquivos usa i18n (`useDsTranslation` aparece só em date-picker, data-table, confirmation-dialog e afins, que não serão copiados).

## Player

| Arquivo (Fonte A) | Linhas | Papel |
|---|---|---|
| `src/atomic/features/player/components/player-dock.tsx` | 326 | Barra inferior: ‹ ▶ › , velocidade, navegador de data, slider com buffer |
| `src/atomic/features/player/hooks/use-player-actions.ts` | 169 | play/pause, seek em %, forward/previous (1 % do range), velocidade |
| `src/atomic/features/player/hooks/use-player-tick.ts` | 47 | `setInterval` de 100 ms avançando `speed × 100 ms` |
| `src/atomic/features/player/store/player-state.ts` | 101 | Átomos jotai do estado global |
| `src/atomic/features/player/models/player.ts` | 13 | `PlayerState`, `PlayerSpeed = 2 \| 5 \| 10 \| 30 \| 60 \| 100` |

**Acoplamentos com o domínio VTS (todos impedem cópia direta):**

- Estado global em jotai (`playerState`, `playerModeAtom`, `playerDockOpenAtom`).
- Importa `vessel-player-state` (janelas de chunks de posições AIS, gatilho de refetch).
- Tempo em `Date` absoluto (relógio de parede, intervalo de 12 h), com navegação por dia, "ir a um momento" e marcador de "agora".
- Buffer de chunks (`WINDOW_MS`) e faixas de disponibilidade de CCTV.
- `useTime`, `useNow`, i18next (`t('player-*')`), `dockAnimation`.
- Velocidades pensadas para horas de dados (2× a 100×); a simulação precisa de 0,25× a 4×.
- Tick por `setInterval` de 100 ms: grosso demais para animação 3D a 60 fps.

**Proposta:** reescrever `src/ui/player/player.tsx` como componente controlado pela interface `PlayerProps` do plano (`duration`, `t`, `playing`, `speed`, `markers`, `onSeek`, `onPlayingChange`, `onSpeedChange`). Reaproveitar do dock apenas o layout (FloatCard h-10, botões `outline size-7`, slider num box `border-input bg-input/40`, rótulos `text-[10px] tabular-nums`). O tempo passa a ser `t` em segundos; o avanço fica em `useSimulationClock` (`requestAnimationFrame`, sem `setInterval`). Marcadores da timeline usam a prop `markers` do `Slider` da Fonte A.

## Janela / painel

| Arquivo (Fonte A) | Linhas | Acoplamento |
|---|---|---|
| `src/atomic/features/windows/components/window.tsx` | 347 | jotai (`windowsState`, `windowsFocusedAtom`, `decreaseGpuUsageState`), i18next, `useDragCursor`, gerenciador de posições/minimização |
| `src/atomic/features/windows/hooks/use-windows.ts` | 267 | Store global de janelas, encaixe por espaço livre |

**Proposta:** não portar o gerenciador de janelas. Criar `src/ui/panel.tsx` simples: `FloatCard` com cabeçalho (título + ação de recolher) e corpo rolável, posição fixa no layout. Visual igual ao da `Window` (cabeçalho, bordas, blur), sem drag nem store global. Se arrastar for necessário depois, usar `framer-motion` `drag` local.

## Dependências a instalar

`@radix-ui/react-slot`, `@radix-ui/react-slider`, `@radix-ui/react-select`, `@radix-ui/react-label`, `@radix-ui/react-switch`, `@radix-ui/react-tooltip`, `@radix-ui/react-tabs`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react`, `framer-motion`, `tailwindcss` v4 + `@tailwindcss/vite`.

## Assimetrias e pendências

- **Fonte divergente do plano.** O plano manda copiar do `vts-application`; a proposta é copiar da Fonte B. Precisa de aprovação.
- **Fonte B está um mês atrás do vts.** O `Slider` da B não tem `markers`; outros primitivos podem ter correções posteriores no vts. Para os 14 arquivos listados, a única diferença funcional encontrada foi essa (as demais diferenças são import de `cn` e remoção de estado global).
- **Licença.** O pacote é `UNLICENSED`, acesso restrito. Copiar o código num projeto de pesquisa que pode ser publicado depende da confirmação listada em "Pendências fora do escopo do agente".
- **Tokens em hex no vts, `rgba` na B.** A B segue a regra de `rgba(r, g, b, a)`; ao ler tokens em runtime para o Three.js, o parser precisa aceitar os dois formatos (e `transparent`).
- **Tema glass não faz sentido aqui.** Os tokens glass assumem um mapa por baixo; o fundo do canvas vai usar `--background` da surface `solid`.
- **Sem testes no vts.** Nenhum componente de origem tem teste; Vitest entra só no `src/model/` deste projeto, como previsto.
