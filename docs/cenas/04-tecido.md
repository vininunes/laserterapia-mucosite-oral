# Cena — A luz dentro da mucosa (Monte Carlo)

Dois blocos de mucosa jugal lado a lado (padrão: 660 nm × 808 nm). Fótons fazem um random walk de absorção e espalhamento calculado por Monte Carlo num Web Worker. A cena mostra a janela óptica e por que o infravermelho chega mais fundo.

| Item | Valor |
|---|---|
| Id (URL) | `tecido` |
| Duração | 44 s, 5 etapas |
| Motor | `src/model/monte-carlo.ts` (puro, seed), `src/model/workers/monte-carlo.worker.ts` |
| Óptica das camadas | `src/model/tissue-optics.ts`, calculada de `src/content/parameters.ts` |
| Roteiro | `src/content/scenes/tissue.ts` |
| Renderização | `src/scenes/tissue/scene.tsx`, `readout.tsx`, `mc-store.ts` (cache compartilhado), `config.ts` |
| Testes | `monte-carlo.test.ts` (10), `tissue-optics.test.ts` (10) |
| Parâmetros da UI | `wavelengthA`, `wavelengthB` (632,8 / 660 / 808 nm), `photons` (5 mil / 20 mil / 50 mil), `seed` (1–999) |
| Desempenho | 20 mil fótons por λ em ≈ 0,8–0,9 s no worker; a UI não trava |

## ⛔ Coeficientes para validação do especialista

**Nenhum coeficiente de camada foi digitado à mão.** Todos saem do código a partir de dados primários com fonte:

- μa(sangue) = 2,303 · C_Hb · [S·ε_HbO₂ + (1 − S)·ε_Hb], com C_Hb = 2,39 mg/mL ÷ 64 500 g/mol e S = 0,941
- μa(camada) = μa(sangue), só nas camadas vascularizadas, + W·μa(água)
- μs' = a·(λ/500 nm)^−b
- μs = μs'/(1 − g)

| λ (nm) | Camada | Espessura | μa (cm⁻¹) | μs' (cm⁻¹) | μs (cm⁻¹) | g |
|---|---|---|---|---|---|---|
| 632,8 | Epitélio | 545 µm | 0,0018 | 52,3 | 523 | 0,9 |
| 632,8 | Lâmina própria | 150 µm | 0,0717 | 33,4 | 334 | 0,9 |
| 632,8 | Submucosa | semi-infinita | 0,0717 | 12,8 | 128 | 0,9 |
| 660 | Epitélio | 545 µm | 0,0021 | 49,8 | 498 | 0,9 |
| 660 | Lâmina própria | 150 µm | 0,0440 | 31,6 | 316 | 0,9 |
| 660 | Submucosa | semi-infinita | 0,0440 | 12,0 | 120 | 0,9 |
| 808 | Epitélio | 545 µm | 0,0129 | 39,4 | 394 | 0,9 |
| 808 | Lâmina própria | 150 µm | 0,0853 | 24,4 | 244 | 0,9 |
| 808 | Submucosa | semi-infinita | 0,0853 | 8,6 | 86 | 0,9 |

### Origem de cada dado primário

| Dado | Valor | Fonte | Natureza |
|---|---|---|---|
| Hemoglobina total | 2,39 mg/mL | Greening 2016, Tab. 2 | Mucosa do lábio interno in vivo; média do volume, atribuída às camadas vascularizadas |
| Saturação | 94,1 % | Greening 2016, Tab. 2 | Idem |
| ε HbO₂ / Hb | 561,2 / 4930,8 (632 nm); 319,6 / 3226,56 (660); 856 / 723,52 (808) cm⁻¹/M | Prahl (OMLC) | Tabulado; 632,8 nm usa o valor de 632 nm |
| μa da água | 0,0028 (625 nm); 0,0032 (650 nm); 0,019858 (810 nm) cm⁻¹ | Hale & Querry 1973 | **λ mais próximo tabulado** |
| Fração de água W | 0,65 | Jacques 2013, Tab. 3 | **Proxy:** derme |
| μs' epitélio: a, b | 68,7 cm⁻¹; 1,161 | Jacques 2013, Tab. 1 (Salomatina 2006) | **Proxy:** epiderme |
| μs' lâmina própria: a, b | 45,3 cm⁻¹; 1,292 | Idem | **Proxy:** derme |
| μs' submucosa: a, b | 18,8 cm⁻¹; 1,620 | Jacques 2013, Tab. 1 (Bashkatov) | **Proxy:** "tecido mucoso" inteiro, sítio não confirmado |
| g | 0,9 | Yaroslavsky 2023, Tab. 1 | **Proxy:** valor de MC de PBM para pele, gordura e músculo |
| Espessura do epitélio | 545,4 µm | Di Stasio 2019, Tab. 1 | Mucosa jugal, OCT in vivo |
| Espessura da lâmina própria | 150 µm | Kurtzman 2021 | **Proxy:** enxerto de mucosa jugal |
| Espessura da submucosa | — | **Não encontrada** | `null` / `TODO`; camada semi-infinita (corte do modelo em 3 cm) |

## Resultado com os padrões (20 mil fótons, semente 42)

| | 660 nm | 808 nm |
|---|---|---|
| Volta à superfície | 87,1 % | 80,7 % |
| Absorvido na submucosa | 12,1 % | 18,3 % |
| Metade dos fótons chega a | 0,5 mm | 0,6 mm |
| 10 % dos fótons chegam a | 8,1 mm | 8,8 mm |

**Leitura física:** com sangue oxigenado (94 %), o μa em 808 nm é *maior* que em 660 nm (0,085 contra 0,044 cm⁻¹ na lâmina própria). O 808 nm chega mais fundo porque espalha menos (μs' 24,4 contra 31,6 cm⁻¹). A legenda da última etapa diz exatamente isso. Em profundidades extremas (a fração de 1 %), a absorção pesa mais e a ordem se inverte. Essa métrica foi tirada do painel, porque passa da espessura de uma bochecha e encosta no corte do modelo.

## Simplificações do Monte Carlo

- Analógico: em cada interação, absorção com probabilidade μa/μt; senão, espalhamento Henyey-Greenstein.
- Sem diferença de índice de refração na superfície: o fóton que volta sai. Isso superestima a fração que volta e subestima a luz retida perto da superfície.
- Camadas planas e infinitas na lateral, feixe colimado e perpendicular, spot de 1 mm.
- Trajetórias desenhadas: 700 por λ, um vértice a cada 8 interações (até 360). A estatística usa todos os fótons e todas as interações.

## Testes

Determinismo por seed; conservação (absorvidos + voltam + atravessam + perdidos = 1); Beer-Lambert sem espalhamento; ⟨cosθ⟩ = g no Henyey-Greenstein; gravação subamostrada não muda a estatística; μa do sangue igual à conta à mão; μs' cai com λ; 808 nm mais fundo que 660 nm (10 %) com os dados da mucosa.

## Assimetrias e pendências

- **Validação do especialista** da tabela acima, principalmente dos proxies.
- **Espessura da submucosa** não encontrada.
- **Sangue por camada:** Greening mede a média do volume; atribuir tudo à lâmina própria e à submucosa é uma escolha do modelo.
- **μa baixo:** o sangue da mucosa in vivo dá μa de 0,04–0,09 cm⁻¹, bem menor que valores ex vivo de pele (0,3–0,7 cm⁻¹). As profundidades absolutas (mm) dependem disso e devem ser lidas como tendência, não como valor clínico.
- **Valores só vistos em snippets** (42 cm⁻¹ em 810 nm no epitélio jugal; 830 µm de lâmina própria gengival por OCT) não foram usados.
