# Cena — Calculadora de dose

Dosimetria interativa: potência, tempo e área do spot calculam irradiância, fluência e energia, com o mesmo visual da cena Protocolos.

| Item | Valor |
|---|---|
| Id (URL) | `calculadora` |
| Duração | 131 s (3 s + tempo máximo de 125 s + 3 s), 4 etapas |
| Modelo | `deviceDose` em `src/model/dosimetry.ts` |
| Roteiro | `src/content/scenes/calculator.ts` |
| Renderização | `src/scenes/dosimetry/calculator.tsx`, `calculator-readout.tsx`, `dose-lane.tsx` (compartilhado) |
| Testes | `dosimetry.test.ts` (deviceDose), `calculator.test.ts` (presets) |
| Parâmetros da UI | `wavelengthNm`, `powerMw` (1–500), `timeS` (1–125), `areaCm2` (0,01–1,5) |
| Padrão | RT + QT 660 nm, spot 0,24 cm²: 100,08 mW × 10 s |

## Fórmulas

| Grandeza | Fórmula | Unidade |
|---|---|---|
| Irradiância | potência ÷ área | mW/cm² |
| Fluência | irradiância × tempo ÷ 1000 | J/cm² |
| Energia no ponto | potência × tempo ÷ 1000 | J |

## Presets

"Carregar protocolo recomendado" aplica λ, potência (irradiância publicada × spot), tempo e área de um protocolo. É uma ação, não um parâmetro: não vai para a URL. O teste garante que cada preset reproduz exatamente o seu protocolo, e o painel diz quando os ajustes atuais correspondem a um protocolo.

## Visualização

Spot e feixe em escala real; barra de fluência que sobe durante o tempo do ponto e acompanha o valor no topo; anéis discretos com a fluência publicada de cada protocolo. Acima de 10 J/cm² a barra para de crescer e o rótulo indica "fora da escala".

## Assimetrias e pendências

- **808 nm** aparece só para comparação; não está entre os protocolos recomendados para prevenção listados.
- **Mesmos J/cm², protocolos diferentes.** O texto e o painel repetem que a diretriz pede seguir o protocolo inteiro.
- **Ligação com a cena Tecido** (dose em profundidade) depende dos coeficientes ópticos.
