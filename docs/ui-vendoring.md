# Vendoring de UI — design system T2S

Registro do que foi copiado do design system da Technomar para `src/ui/`, de onde, e o que mudou. Os repositórios de origem não foram modificados.

| Item | Valor |
|---|---|
| Fonte principal | `~/technomar/pattern/design-system` (`@technomar/design-system` 0.1.0), commit `3b42c90728e19b032e68b6e948b604f1a55dd544` |
| Fonte secundária | `~/technomar/pattern/vts-application`, commit `d909622fadd9335ddd2438a660a76945d5a2320c` |
| Data da cópia | 13/10/2026 |
| Licença de origem | `UNLICENSED`, acesso restrito — ver pendências |
| Arquivos copiados sem alteração | 14 |
| Arquivos copiados com alteração | 1 (`slider.tsx`) |
| Componentes reescritos | 2 (`player/player.tsx`, `panel.tsx`) |

## Arquivos copiados

| Destino | Origem | Alteração |
|---|---|---|
| `src/ui/styles/tokens.css` | design-system `src/styles/tokens.css` | Nenhuma |
| `src/ui/theme/theme-provider.tsx` | design-system `src/theme/theme-provider.tsx` | Nenhuma |
| `src/ui/lib/cn.ts` | design-system `src/lib/cn.ts` | Nenhuma |
| `src/ui/primitives/button.tsx` | design-system `src/primitives/button.tsx` | Nenhuma |
| `src/ui/primitives/float-card.tsx` | design-system `src/primitives/float-card.tsx` | Nenhuma |
| `src/ui/primitives/select.tsx`, `select-base.tsx` | design-system `src/primitives/` | Nenhuma |
| `src/ui/primitives/input-number.tsx`, `input-base.tsx` | design-system `src/primitives/` | Nenhuma |
| `src/ui/primitives/label.tsx` | design-system `src/primitives/label.tsx` | Nenhuma |
| `src/ui/primitives/switch.tsx` | design-system `src/primitives/switch.tsx` | Nenhuma |
| `src/ui/primitives/tooltip.tsx`, `tooltip-base.tsx` | design-system `src/primitives/` | Nenhuma |
| `src/ui/primitives/tabs.tsx` | design-system `src/primitives/tabs.tsx` | Nenhuma |
| `src/ui/primitives/slider.tsx` | vts `src/atomic/base-components/slider.tsx` | Import de `cn` trocado de `@/lib/tailwind/utils` para `../lib/cn` |

### Slider

Única peça tirada do vts: a versão do design-system ainda não tem a prop `markers` (linhas verticais sobre o track), usada aqui para os marcadores do roteiro na timeline. Fora o import, o arquivo é idêntico ao do vts, que por sua vez é o do design-system mais `markers`.

## Componentes reescritos

### Player (`src/ui/player/player.tsx`)

Referência visual: `vts src/atomic/features/player/components/player-dock.tsx`. Mantido: barra `FloatCard` h-10, botões `outline size-7` (‹ ▶ ›), select de velocidade `w-20`, slider dentro de um box `border-input bg-input/40`, rótulos `text-[10px] tabular-nums` nas pontas.

Removido do original:

- Estado global jotai (`playerState`, `playerModeAtom`, `playerDockOpenAtom`, `playerAvailabilityTrackAtom`).
- Dependência de `vessel-player-state` (janelas de chunks AIS, refetch).
- Tempo absoluto em `Date`, navegação por dia, "ir a um momento", marcador de "agora", `useTime`, `useNow`.
- Faixas de buffer e de disponibilidade (CCTV), botão de refresh e de fechar.
- i18next: textos fixos em pt-BR.
- Tick por `setInterval` de 100 ms.

Adicionado: interface controlada `PlayerProps` (`duration`, `t`, `playing`, `speed`, `markers`, `onSeek`, `onPlayingChange`, `onSpeedChange`); ‹ › saltam entre marcadores do roteiro em vez de 1 % do range; velocidades 0,25× a 4×. O avanço do tempo saiu do player e foi para `SimulationClock` + `useClockDriver` (`requestAnimationFrame`).

### Painel (`src/ui/panel.tsx`)

Referência visual: `vts src/atomic/features/windows/components/window.tsx`. Mantido: `FloatCard` com cabeçalho de título `text-xs` e corpo rolável. Removido: gerenciador global de janelas (jotai), arrastar, minimizar para a sidebar, foco/z-index, encaixe por espaço livre, `decreaseGpuUsageState`, i18next. Adicionado: recolher/expandir local.

## Não copiado

- `vts src/styles/global.css`: fundo do mapa, regras de Mapbox, sonner e cursores de drag. Substituído por `src/index.css` mínimo.
- i18n do design-system (`ds` namespace): nenhum dos primitivos copiados usa.
- Gerenciador de janelas, date pickers, data-table, forms.

## Uso dos tokens no 3D

`src/ui/theme/theme-tokens.tsx` lê as CSS variables (`--background`, `--foreground`, `--muted-foreground`, `--border`, `--primary`, `--warning`, `--positive`, `--destructive`) com `getComputedStyle`, compõe cores translúcidas sobre o fundo e entrega hex para o Three.js. Um `MutationObserver` no `<html>` relê os tokens quando `class`, `data-surface` ou `data-blur` mudam. A aplicação usa `surface="solid"` (o tema glass pressupõe um mapa por baixo). A cor do feixe (λ → RGB) é física e não passa por aqui.

## Assimetrias e pendências

- **Licença.** O código de origem é `UNLICENSED`, de acesso restrito. Publicar este repositório depende de autorização da Technomar.
- **Defasagem.** O design-system está em 09/09/2026 e o vts em 09/10/2026. Se o pacote evoluir, esta cópia não acompanha; atualizar manualmente e registrar aqui.
- **Slider vem do vts.** Quando o design-system ganhar `markers`, trocar a origem do arquivo.
- **Thumb branco no tema claro.** O `Slider` usa thumb `bg-white` fixo (decisão do DS); no tema claro sólido ele aparece só pela sombra.
