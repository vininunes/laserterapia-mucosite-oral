# Cena — O que a luz faz na célula

Esquemática e animada, **não simulada**. A UI marca "esquema ilustrativo" na legenda e no painel.

| Item | Valor |
|---|---|
| Id (URL) | `celula` |
| Duração | 52 s, 9 etapas |
| Modelo | `src/model/cell.ts` (coreografia determinística em função de `t`) |
| Roteiro | `src/content/scenes/cell.ts` |
| Renderização | `src/scenes/cell/scene.tsx`, `readout.tsx` |
| Testes | `cell.test.ts` (9) |
| Referências | Karu 1999, Hamblin 2017, Sonis 2004 (citações a conferir), Zadik 2019 |
| Parâmetro da UI | `wavelengthNm` (632,8 / 650 / 660 / 808): só a cor do fóton |

## Sequência

| t (s) | Etapa | Na tela |
|---|---|---|
| 0 | Uma célula da mucosa | Membrana, núcleo, mitocôndrias, mediadores inflamatórios ao redor |
| 5 | O fóton chega | Fóton na cor do λ entra na célula |
| 10 | A citocromo c oxidase absorve a luz | Sítio da enzima acende; NO sai |
| 15 | Mais ATP | Partículas de ATP extras passam a sair da mitocôndria |
| 21 | Sinalização | Pulso amarelo (ROS em baixa quantidade, fatores de transcrição) |
| 27 | Modulação da inflamação | Mediadores diminuem até 30% — reduzem, não somem |
| 32 | Menos dor | Efeito analgésico: menos mediadores que sensibilizam as terminações nervosas; endorfinas (TCC, seção 3.3) |
| 37 | Reparo do epitélio | Células vizinhas aparecem: efeito cicatrizante (proliferação; colágeno e angiogênese na lâmina própria) |
| 43 | De volta à mucosite | Ligação com o modelo de Sonis e com a recomendação MASCC/ISOO |

## Modelo

`cellModel(t)` devolve posição/opacidade do fóton, brilho da enzima, quanto do ATP extra apareceu, pulso de sinalização, fração de mediadores e entrada das células vizinhas. As partículas (`atpParticle`, `noParticle`, `mediatorParticle`) são funções puras de `(i, t)` com direções pseudoaleatórias por hash: o scrubbing mostra sempre o mesmo quadro.

## Cores

Estruturas (membrana, núcleo, mitocôndria) usam cores ilustrativas fixas. Elementos com significado usam tokens do tema: ATP `positive`, mediadores `destructive`, enzima ativada e sinalização `warning`, NO `foreground`. O fóton usa a cor física do λ.

## Assimetrias e pendências

- **Citações a conferir.** Karu 1999, Hamblin 2017 e Sonis 2004 estão marcadas `unverified` até a conferência de autores, volume e páginas.
- **Afirmações qualitativas** (NO como inibidor deslocado, ATP, ROS em baixa quantidade, redução de mediadores pró-inflamatórios) seguem a literatura de PBM e precisam da revisão do especialista.
- **Etapas vindas do TCC.** "Menos dor" e "Reparo do epitélio" cobrem os efeitos analgésico e cicatrizante que o TCC destaca (seções 3.3 e 3.4). Citam Bjordal 2011, Piva 2011 e França 2009 como estão nas referências do TCC, marcadas `unverified`: os textos não foram lidos aqui. Não têm animação própria além das células vizinhas no reparo.
- **Quantidades ilustrativas.** Número de partículas, piso de 30% dos mediadores e tempos não têm significado quantitativo.
