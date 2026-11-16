# Histórico

## v0.5.0 — 16/11/2026

- **M04 Costa das Cinzas** (GDD 8.3/8.2/7.1): mar cinzento com shader animado, espuma de costa e quebra-mar, cristas no mar aberto, docas com guindastes, contêineres e armazéns, falésias, pilhas de rocha, farol com facho giratório, navios encalhados inclinados e cinzas no ar. Timeline JSON: baterias E05/E06 (0–2:00) → Hidras E11 + drones E01 (2:00–4:30) → docas com três resgates sob fogo, salvas E07 e aproximação de câmera (4:30–6:30) → chefe.
- **E11 Hidra**: lancha torpedeira 3D (casco, faixa vermelha, lançador de 7 tubos, ponte, chaminé, radar giratório, esteira de espuma). Anuncia por 1,05 s uma **pista segura** ciano; dispara 7 torpedos SOLO que se abrem em 9 faixas e deixam um corredor de 3,8 un. Alta passa por cima; Rasante dá +20%.
- **Resgates sob fogo**: enquanto um resgate de doca está aberto, a artilharia costeira marca um círculo de 1 un sobre a nave, com 1,25 s até o impacto (20 de dano); sair e voltar só decai o progresso aos poucos.
- **Câmera de aproximação**: entre ~4:22 e ~6:28 o cenário costeiro aproxima até 6%. A câmera de jogo e o campo 16×28 não mudam, então nenhum projétil é escondido.
- **Bastião Delta**: fortaleza costeira 3D com três casamatas (260 HP, estados intacto/destroço) e comando de 1100 HP protegido pela casamata central. Fase 1: torres AA com mira anunciada; fase 2: barragens costeiras SOLO em leque; fase 3: raio da plataforma com aviso de 1,25 s em toda a área perigosa e brecha de 2,6 un. Destruir uma casamata apaga seus projéteis/avisos e desliga seus ataques. Entrada com ALERTA, blindagem de 1,5 s, transições de 0,9 s e destruição segura de 3,5 s. Recompensa narrativa: Farol identificado (Suri/Lina/NÓX).
- Campanha: M04 abre após vitória Normal em M03; mapa, briefing com modelo 3D do chefe, relatório (casamatas 3/3, Hidras afundadas, bônus "Proteger o porto" +60) e "Próxima missão" a partir de M03. Save schema 2 aditivo, com migração do registro M04 e `lastStage` validado.
- Pressão leve de objetivo em todas as missões: inimigo que escapa vivo conta em **FUGAS** no HUD e reduz o combo em 0,5. Não há falha por fuga.
- Flash de impacto mais suave em cascos grandes, para que o tiro automático não deixe Hidra/Bastião brancos. Avisos de raio largos aparecem na largura real, abaixo da nave.
- QA: `__AURORA__.hold()`, só em modo debug, congela o tempo real entre passos e torna capturas e playthroughs reprodutíveis. 74 testes (15 novos de M04); quatro vitórias aceleradas M01–M04; Chromium desktop/móvel sem erros. Evidências em `release/*v05.json`, `release/screenshots/v0.5/` e `qa/reports/2026-11-16-v0.5.0.md`.

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
