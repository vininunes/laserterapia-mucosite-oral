# Cena 1 — A luz como onda eletromagnética

Primeira cena e molde das demais: modelo puro, roteiro em dados, renderização que só lê o modelo e testes do modelo.

| Item | Valor |
|---|---|
| Id (URL) | `onda-em` |
| Duração | 42 s, 6 etapas |
| Modelo | `src/model/em-wave.ts`, `photon.ts`, `spectrum.ts` |
| Roteiro | `src/content/scenes/em-wave.ts` |
| Renderização | `src/scenes/em-wave/scene.tsx`, `wave-lines.ts`, `readout.tsx` |
| Testes | `em-wave.test.ts` (12), `photon.test.ts` (5), `spectrum.test.ts` (5) |
| Parâmetros científicos | `planck`, `speed-of-light`, `elementary-charge` (BIPM, 2019) |
| Parâmetros da UI | `wavelengthA` (380–1000 nm, padrão 660), `wavelengthB` (padrão 808), `compare`, `showB` |

## Modelo

`emWaveModel(t, { ...params, timing })` devolve, para as duas ondas: λ real e visual, número de onda e frequência angular visuais, frente de onda, posição da faixa, opacidades, cor, se é visível ao olho, frequência real e energia do fóton. Também devolve a opacidade da régua de λ e a posição do fóton.

- Eixos: propagação em +x, E em y, B em z. E e B em fase.
- O campo em `x` é `sin(k·(x − xMin) − ω·(t − emitidoEm))` até a frente de onda e zero além dela. A onda nasce na fonte e avança: não existe estado anterior a `t = 0`.
- O laser B começa a emitir em `timing.compare`, então sua frente também parte da fonte.
- O fóton percorre o eixo do laser A em ciclos de `EM_SPAN / speed` segundos e some perto das pontas.
- `timing` (instantes de entrada de B, régua, fóton e comparação) vem do roteiro, para o modelo não depender de `content/` além das constantes físicas.

Grandezas físicas (`photon.ts`) usam só `requireParameter`, que lança erro se o parâmetro estiver pendente.

## Escala ilustrativa

| Grandeza | Na tela | Real |
|---|---|---|
| Comprimento de onda | proporcional: 660 nm ↦ 2 unidades | — |
| Velocidade de propagação | 1,6 unidades/s, igual para todo λ | c |
| Frequência | consequência das duas linhas acima | c/λ (mostrada no painel Grandezas) |
| Amplitude de B | igual à de E | E/c no vácuo |

A legenda da etapa 2 e a nota do painel Grandezas avisam o usuário.

## Cor do feixe

`wavelengthToRgb` implementa a aproximação de Bruton (1996) para 380–780 nm. Fora dessa faixa a cor é uma **representação fixa** (vermelho escuro para infravermelho, violeta para ultravioleta), a curva fica **tracejada** e o rótulo da fonte diz "invisível". É a exceção prevista no plano: a cor do feixe não usa token do tema. O campo B e os elementos de apoio (eixo, fonte, régua) usam tokens.

## Roteiro

| t (s) | Etapa | O que entra | Câmera |
|---|---|---|---|
| 0 | A luz é uma onda eletromagnética | Fonte e campo E | Frontal |
| 7 | Campos elétrico e magnético | Campo B | 3/4, mostra a perpendicularidade |
| 14 | Comprimento de onda | Régua de λ | Próxima, sobre a régua |
| 21 | Energia do fóton | Fóton com E em eV | 3/4 baixa |
| 28 | Vermelho × infravermelho | Laser B, faixas separadas | Frontal afastada |
| 35 | Tudo ligado | — | Aberta |

## Renderização

- Curvas de campo: `Line2` (linha com espessura em pixels) e `LineSegments` para os "fios" do vetor, com buffers alocados uma vez e reescritos a cada frame (`wave-lines.ts`). `instanceCount` corta a curva na frente de onda.
- Objetos criados à mão (`<primitive>`) são liberados no desmonte; o R3F não faz `dispose` deles.
- Rótulos: `SceneLabel` (`src/scenes/scene-label.tsx`), `<div>` posicionado por projeção a cada frame. Substitui o `Html` do drei, que perdia o conteúdo do primeiro rótulo ao trocar o elemento-alvo quando o R3F conecta os eventos.
- Painel Grandezas (`readout.tsx`): λ, região espectral, f, E em eV e em J. Depende só dos parâmetros.

## Assimetrias e pendências

- **Validação de conteúdo.** As legendas são afirmações qualitativas de física básica; precisam de revisão do especialista, junto com o resto do conteúdo.
- **Limite do visível.** 380–780 nm é convenção (há fontes com 400–700 nm). O mesmo limite é usado na cor e na classificação "visível/infravermelho".
- **Comparação fixa no roteiro.** A legenda da etapa 5 cita 660 nm e 808 nm "por padrão"; se o usuário mudar os sliders, o texto não acompanha.
- **λ visual cresce com λ.** Com 1000 nm a onda tem 3 unidades de comprimento; abaixo de ~400 nm as cristas ficam próximas da resolução dos fios (um fio a cada 0,3 unidade).
- **Bruton (1996)** é uma página web acadêmica, não publicação revisada; serve como convenção de visualização, não como dado científico.
