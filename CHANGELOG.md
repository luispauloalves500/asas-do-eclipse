# Histórico

## v0.4.0 — 10/11/2026

- Revisão autocrítica prévia documentada; menu com céu animado e porto aéreo 3D, hangar com aeronave giratória, cinco melhorias com comparação antes/depois, briefing contextual com reconhecimento 3D do chefe.
- M01/M02: distribuição de terreno variada entre tiles, tráfego/civis decorativos, luzes e sombras de nuvens. Nenhum painel lateral no voo; HUD, medalhas e barras de módulos retrabalhados.
- Flash de casco, faíscas, explosões mais quentes com destroços/onda, hit-stop de 25–40 ms e tremor limitado a cerca de 0,07 un. ALERTA de entrada e 3,5 s de destruição com zona segura de coleta.
- Música sintetizada própria por missão/chefe, duas camadas com crossfade de 0,75 s; SFX de impactos, mísseis, altitude e esquiva. Um contexto/sequenciador e um loop de motor.
- Opções acessíveis durante pausa real: volumes separados, auto-fire/manual, hitbox, vibração e qualidade automática/baixa/média/alta. Persistem sem resetar saves antigos.
- M03 Fortaleza do Vento: picos nevados, névoa, fortalezas, pontes e turbinas gigantes; tutorial Rasante/Alta, E03/E04, E06/E10, dois resgates e Ciclone. Timeline JSON preserva a sequência do GDD.
- E04 Lâmina: aviso de 0,9 s e investida sobre posição marcada. E10 Aríete: asas atingíveis separadamente, cada uma desativa seu bombardeio de solo.
- Postura Q/LB/HUD/toque em todas as missões: troca de 0,4 s, recarga 4 s, sem imunidade; Rasante +20% solo/coleta 2,0; Alta +15% ar/evita ground_only. Perigos de solo usam triângulo âmbar e rastro próprio; sombras e trilhas acompanham altitude.
- Ciclone original: helicóptero birotor blindado com módulos destrutíveis, mísseis guiados por no máximo 1,2 s, vento lateral somente visual e espirais duplas com corredor navegável. Destruir rotores remove seus emissores.
- Vitória M02 libera M03. Vitória M03 libera A02 Bóreas (80 HP, 9,7 un/s, dano 0,92×, +10% cadência após quase-esquiva em movimento), selecionável no hangar com modelo próprio.
- Melhorias globais de cadência (+6%/nível) e blindagem (+10 HP/nível), além de motor/canhão/coletor. Schema 2 aditivo mantém migração de todas as versões anteriores.
- 59 testes Vitest; três playthroughs acelerados com dano/resgates/fases reais, browser desktop/móvel e regressões de reinício, áudio, persistência e HTML offline. Evidências em `release/*v04.json`, `release/screenshots/v0.4/` e `qa/reports/2026-11-10-v0.4.0.md`.

## v0.3.0 — 10/11/2026

- M02 Estrada de Ferro Fantasma: cânion ocre instanciado, pontes de aço, trilhos marcados, depósitos e comboios em movimento.
- E03 Raptor (mira passada), E07 Arpão (salvas com brechas) e E08 Semeador (minas materializam após 0,6 s). Ondas e resgates dirigidos por JSON.
- Objetivo bônus: destruir dois vagões de munição antes da fuga; falas de Suri e coordenadas da estação Farol.
- Serpente de Ferro: reator + três vagões, juntas douradas atingíveis, três fases e avisos audiovisuais; destruição individual desativa armas.
- Mapa simplificado do Ato I com cinco nós, briefing, recordes e medalhas por missão. M02 desbloqueia após vitória M01 Normal; M03–M05 ficam em produção. Relatório M01 oferece Próxima missão.
- Save aditivo preserva moeda, melhorias e dados v0.1/v0.2; recompensas M02 410 na primeira vitória / 246 replay, além de coleta e bônus.
- Corrigida lacuna periódica na reciclagem do terreno de ambos os biomas; avisos de laser sem duração nunca causam dano.
- 40 testes unitários; playthroughs acelerados com dano de M01/M02, campanha desktop/móvel e verificações de regressão. Evidências em `release/screenshots/v0.3/` e `qa/reports/2026-11-10-v0.3.0.md`.
- Postura adiada para M03; permanecem as três melhorias globais da fatia inicial.

## v0.2.0 — 10/11/2026

- Removidos os painéis laterais de operação/telemetria. A cena Three.js agora ocupa a tela inteira; fora do campo de combate o próprio terreno continua, com vinheta suave. HUD essencial permanece no campo lógico.
- Mundo lógico e hitboxes continuam 16×28; em 16:9 a escala usa a altura inteira. Em retrato estreito, o mundo se estende acima/abaixo em vez de recortar a área jogável.
- Véspera remodelada: fuselagem volumétrica, cockpit multifacetado, painéis, asas articuladas, entradas de ar, dois motores, exaustão pulsante, estabilizador, luzes de posição e trilhas.
- Quatro inimigos com silhuetas próprias, incluindo rotores do E02, esteiras/canhões do E05 e ótica/antena do E06.
- Gárgula-01 reconstruída como caminhão-fortaleza: cabine envidraçada, grades, placas, esteiras e torres. Canhões destruídos deixam sucata/brasas visuais no casco.
- Rio com shader animado, barrancos irregulares, ruínas com altura e janelas, árvores em camadas, rochas, pistas/linhas, pontes reforçadas, represa com comportas e nuvens translúcidas.
- Sombras falsas para aeronaves e alvos; muzzle flashes, impactos luminosos, explosões com faíscas/fumaça/destroços, trilhas e coleta com halo. Balas e lasers permanecem acima dos VFX; tremor limitado a menos de 0,04 un.
- Geometria estática dos modelos agrupada por material; terreno instanciado; partículas/destroços em pools fixos; redução automática de DPR/densidade decorativa se o frame time ficar alto. Física e projéteis nunca são reduzidos.
- Save v0.1 (schema 2) mantido integralmente compatível. Migração v1 continua funcionando. Nenhum reset de saldo, medalhas ou upgrades.
- 25 testes unitários e verificação browser desktop/móvel. Novas evidências em `release/screenshots/v0.2/`.

## v0.1.0

Primeira M01 completa, conforme o GDD §23. Publicada inicialmente em GitHub Pages por workflow de build/deploy, antes do trabalho da v0.2.
