# ASAS DO ECLIPSE — Guerra dos Céus

Campanha jogável **v0.4.0 / M01 + M02 + M03**, baseada no GDD original em `docs/GDD.md`. Arte low-poly e áudio sintetizado originais. Protótipo em evolução, não a campanha completa.

## Jogar

**https://luispauloalves500.github.io/asas-do-eclipse/**  
Código: https://github.com/luispauloalves500/asas-do-eclipse

Abra `release/asas-do-eclipse-m01.html` diretamente em um navegador com WebGL2: o nome legado é mantido, mas **as três missões estão dentro do mesmo HTML**, sem rede/servidor. Áudio inicia após interação. Save é local por origem; em `file://` depende da política do navegador. Há aviso/exportação quando o armazenamento falha.

Alternativa: descompacte `release/asas-do-eclipse-dist.zip` e sirva por HTTP. Vite usa `base: './'`, inclusive em GitHub Pages/subpastas. Sem backend/autenticação. O cenário ocupa a tela inteira e continua fora dos 16×28 lógicos, com vinheta — sem painéis laterais de voo.

## Campanha

- **M01 Ruínas de Arkan:** rio, represa e ruínas; E01/E02, tanques E05, torres E06, três resgates e Gárgula-01.
- **M02 Estrada de Ferro Fantasma:** cânion ocre, pontes de aço e trens; Raptor E03, Arpão E07 e minas E08. Três depósitos/resgates e dois vagões de munição para o bônus; Serpente de Ferro de quatro carros.
- **M03 Fortaleza do Vento:** montanhas, névoa, turbinas gigantes e fortalezas; tutorial de altitude até 1:30, E03/Lâmina E04 até 3:30, E06/Aríete E10 e dois técnicos até 5:50, então Ciclone. Investidas telegráficas, asas destrutíveis, mísseis que só guiam por 1,2 s, vento visual e espirais com brechas.

M01 disponível desde o início; vitória Normal na anterior libera M02/M03. M04/M05 aparecem **Em produção**. Resultados M01/M02 oferecem **Próxima missão**. Recordes e cinco medalhas por missão; saldo e upgrades compartilhados. Saves v0.1/v0.2/v0.3 migram sem reset (schema 2 aditivo).

Vencer M03 libera **A02 Bóreas**: 80 HP, velocidade 9,7, dano 0,92× e +10% de cadência por 3 s após quase-esquiva em movimento; cooldown de 4 s, sem invulnerabilidade. Modelo próprio e seleção no hangar. Véspera continua com 100 HP/8,2 un/s. Cinco upgrades globais: motor, canhão, coletor, cadência e blindagem; antes/depois, preços e confirmação no hangar.

## Controles

- **WASD / setas / analógico esquerdo / D-pad:** mover; aceleração 35/desaceleração 40 e diagonal normalizada.
- **Mouse/toque:** arraste relativo, incluindo gestos rápidos.
- **Q / LB / botão ALTITUDE:** Rasante ↔ Alta; transição 0,4 s, recarga 4 s, **sem imunidade**. Usável nas três missões.
  - Rasante: +20% contra solo, coleta base 2,0 un; maior exposição AA.
  - Alta: +15% contra ar; projéteis SOLO passam por baixo. Perigos exclusivos têm triângulo âmbar e rastro; a hitbox não muda durante a transição.
- **Shift / botão direito / A do controle:** Raio Lança (2 cargas, 1,2 s).
- **E / B do controle:** Bomba de Pulso (2 cargas), limpa só projéteis apagáveis, não lasers.
- **Espaço / RT / segurar mouse:** tiro manual quando auto-fire estiver desligado; por padrão 6 tiros/s, dano 10, velocidade 25.
- **Esc / P / Start / Ⅱ:** pausa real; opções/controles/reinício/saída com confirmação.
- **Resgate:** raio 1,5 un, manter 1,5 s; fora do círculo decai gradualmente.

Na pausa/menu: volumes música/efeitos, auto-fire, mostrar hitbox, vibração quando suportada e qualidade auto/baixa/média/alta. Preferências persistentes. Qualidade reduz somente custo visual; não muda física, balas ou perigos.

## Apresentação e arquitetura

- Vite + TypeScript estrito + Three.js; XY lógico 16×28, câmera ortográfica, passo fixo 60 Hz com interpolação e clamp de acumulador 0,1 s. Campo completo sem recorte no portrait.
- Menu de céu animado/porto com Véspera 3D; hangar rotativo; briefing com objetivos e modelo/inteligência do boss; medalhas com critérios.
- Cenários em tiles variados, instâncias, água animada, alturas, trânsito/civis decorativos, luzes, sombras/névoa e vento sem tomar o controle no Normal.
- Flash de casco, faíscas, muzzle flash, rastros, explosões/destroços/onda, hit-stop leve e tremor pequeno. Balas com contorno escuro/aro claro e render acima dos VFX. ALERTA e zona segura de 3,5 s após boss.
- Música própria por missão/chefe, crossfade 0,75 s, SFX sintetizados. Um AudioContext, um sequenciador, dois buses de música e no máximo um loop de motor.
- Pool de 600 projéteis, hash espacial 2D, dano/origem rastreados, HP/i-frames 0,85 s, kits, magnetismo e score/combo. Subcomponentes removem ataques, transições de boss ≤1,5 s.
- `src/core`, `gameplay` (sem Three/DOM), `data` (três JSONs), `render`, `input`, `audio`, `persistence`, `app`; `src/tests` e `e2e`. Fontes modulares, não HTML monolítico.

## Desenvolver / verificar

Node 24 recomendado (mesma versão do CI).

```bash
npm ci
npm run dev
npm test                    # 59 testes Vitest
npm run build               # tsc --noEmit + Vite normal
npm run release             # testes + build normal + single-file + ZIP
npx playwright install chromium
npm run test:e2e            # servidor próprio em /jogos/asas/, porta 4178

# Em terminais separados:
npm run preview -- --port 4176
node e2e/autopilot.mjs       # M01 completa
node e2e/m02.mjs             # M02 completa, 3 civis, 2 vagões e 3 fases
node e2e/m03.mjs             # M03 completa, 2 civis, posturas e padrões/fases
node e2e/campaign.mjs        # mapa/migração, reinícios de boss e mobile
node e2e/v04-features.mjs    # opções, upgrades, Bóreas, Q/LB/toque
```

`?debug=qa&stage=M03` permite avançar a mesma física por comandos; `?debug=boss&stage=M03` salta ao chefe (também M01/M02). **Sem god-mode/edição de HP, sem recompensas de perfil**. API de teste ausente sem `debug`. Fixtures explícitas de save são usadas somente para compras/desbloqueios em testes de UI.

## Evidências e limites

Autocrítica prévia: `qa/reports/2026-11-10-v0.4-review.md`. Verificações efetivamente executadas: `qa/reports/2026-11-10-v0.4.0.md`, dados `release/*v04.json`, capturas `release/screenshots/v0.4/`. Histórico em `CHANGELOG.md`.

59 unitários e Chromium desktop 1600×900 / mobile emulado 390×844, zero erros de console nas suítes; três vitórias aceleradas com dano normal e todos os resgates/fases. Testes incluem pausa/options, teclado/mouse/gamepad sintético/toque CDP, saves antigos, upgrades, Bóreas, reinícios e HTML offline.

**Fora desta versão:** M04–M15, dificuldade avançada/Acessível/checkpoints, EMP/outros especiais, outras aeronaves, coop, PWA, importação de save, remapeamento e navegação integral de menus por controle. Vento só visual no Normal; não há dificuldade avançada implementada. Modelos/áudio são arte procedural de protótipo; menus usam a câmera ortográfica inclinando os modelos, não câmera perspectiva dedicada.

**Próximo risco (§23):** playtests humanos e balanceamento das três missões antes de adicionar mais. Piloto seguro ainda contorna boa parte dos inimigos; bosses caem rápido com alinhamento/raio, tutorial M03 pode ser longo e metas de eliminação/coleta precisam validação. Vitórias aceleradas ficaram em cerca de 5:56 / 6:28 / 6:30 de simulação (não certificam duração humana de 7–8 min). Sem teste em Android/controle físico, Safari/Firefox, audição humana da mixagem, perfil FPS p95 no hardware-alvo ou RAM/VRAM ao longo de dez partidas completas.
