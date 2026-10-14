# Cena 6 — Dosimetria: protocolos MASCC/ISOO para prevenção

Adiantada a pedido da pesquisa (antes das cenas 2 a 5). Mostra lado a lado, em escala real, os cinco protocolos de PBM intraoral recomendados pela diretriz MASCC/ISOO para prevenção de mucosite oral em adultos.

| Item | Valor |
|---|---|
| Id (URL) | `dosimetria` |
| Duração | 134 s (3 s de introdução + 125 s do protocolo mais longo + fechamento), 7 etapas |
| Dados | `src/content/protocols.ts` |
| Modelo | `src/model/dosimetry.ts` |
| Roteiro | `src/content/scenes/dosimetry.ts` (etapas geradas a partir dos dados) |
| Renderização | `src/scenes/dosimetry/scene.tsx`, `readout.tsx` |
| Testes | `dosimetry.test.ts` (10), `protocols.test.ts` (3), `scripts.test.ts` (4) |
| Fonte | Zadik et al., 2019 (doi:10.1007/s00520-019-04890-2); resumo MASCC/ISOO 2019/2020; Elad et al., 2020 |
| Parâmetro da UI | `focus`: −1 (todos) ou índice do protocolo |

## Protocolos

| Contexto | λ (nm) | Irradiância (mW/cm²) | Tempo/ponto (s) | Fluência publicada (J/cm²) | Fluência calculada | Spot (cm²) | Potência (mW) | Pontos | Evidência |
|---|---|---|---|---|---|---|---|---|---|
| TCTH | 632,8 | 31,25 | 40 | 1,0 | **1,25 ⚠** | 0,8 | 25 | 18 | I |
| TCTH | 650 | 1000 * | 2 | 2,0 | 2,00 | 0,04 | 40 | 54–70 | I |
| RT | 632,8 | 24 | 125 | 3,0 | 3,00 | 1 | 24 | 12 | II |
| RT + QT | 660 | 417 * | 10 | 4,2 | 4,17 | 0,24 | 100 | 72 | I |
| RT + QT | 660 | 625 * | 10 | 6,2 | 6,25 | 0,04 | 25 | 69 | I |

Valores transcritos do resumo enviado pela pesquisa em 13/10/2026, sem correção. Fluência calculada, potência, energia por ponto e por sessão são derivadas (`deriveDose`), não publicadas.

## Modelo

- Fluência (J/cm²) = irradiância (mW/cm²) × tempo (s) / 1000. Potência (mW) = irradiância × área. Energia (J) = potência × tempo / 1000.
- `fluenceMismatch`: a publicada difere da calculada além de meia unidade da última casa publicada (0,05 J/cm²). Só o protocolo TCTH 632,8 nm dispara; 4,17 → 4,2 e 6,25 → 6,2 ficam dentro do arredondamento.
- `doseLane(t)`: todas as sondas ligam em `DOSE_START` (3 s); a fluência cresce linearmente até o tempo do protocolo e para. A barra usa a fluência **calculada**; o anel marca a **publicada**. Onde não batem, o anel fica amarelo e a barra passa dele.
- Tempo de sessão: pontos × tempo por ponto (só irradiação; sem deslocamento entre pontos).

## Visualização

| Elemento | Escala | Cor |
|---|---|---|
| Grade da mucosa | real, 1 quadrado = 1 cm | token `border` |
| Spot | real (raio = √(área/π)) | física, λ → RGB |
| Feixe | altura ilustrativa (1,6 cm); brilho em escala log da irradiância | física, λ → RGB |
| Barra de fluência | 0,32 unidade por J/cm² | token `primary` |
| Anel da fluência publicada | mesma escala da barra | token `foreground`, ou `warning` se inconsistente |
| Mucosa | placa ilustrativa | rosa fixo (conteúdo, não UI) |

O painel Grandezas mostra a tabela comparativa (modo "todos") ou o detalhe do protocolo em foco: contexto, todos os parâmetros, derivados, duração do tratamento, nível de evidência, alertas e nota de segurança. Rodapé com fonte e aviso de conteúdo didático.

## Assimetrias e pendências

- **Faixa de dose do TCC.** A etapa final cita 10–100 mW e 1–4 J/cm² por ponto (Eduardo; Bezinelli, 2010, como no TCC, `unverified`) e avisa que os protocolos de RT + QT passam dessa faixa (4,2 e 6,2 J/cm²). Os textos da tela usam "densidade de energia", o termo do TCC, com "(fluência)" entre parênteses onde o termo é apresentado (etapa 2 da cena 4, etapa 1 e painel da cena 5).

- **⚠ Fluência do protocolo TCTH 632,8 nm.** 31,25 mW/cm² × 40 s = 1,25 J/cm², não 1,0 J/cm². Conferir no artigo qual valor está correto. A cena mostra a divergência e não escolhe.
- **Marcação `*` nas irradiâncias** de 1000, 417 e 625 mW/cm²: significado ausente no resumo. Exibida como alerta no detalhe do protocolo.
- **Conferência com o artigo.** Nenhum valor foi conferido no texto completo de Zadik et al. (2019); todos vêm do resumo transcrito.
- **Distribuição anatômica dos pontos** não é representada: o resumo dá só a contagem. Não inventar posições.
- **Ligação visual com a cena 4 (tecido)**, prevista no plano, depende da cena 4.
- **Cena 1 sem os λ dos protocolos.** O slider de λ tem passo de 1 nm; 632,8 nm não é selecionável. Avaliar presets.
- **Cor do 632,8 nm** pela aproximação de Bruton sai laranja-avermelhada; é a convenção adotada, não colorimetria.
- **Validação clínica** de todo o texto pelo especialista, como no restante do conteúdo.
