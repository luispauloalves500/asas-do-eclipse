# ASAS DO ECLIPSE — Guerra dos Céus

Primeira versão jogável **v0.1.0 / P0–P1**, baseada no GDD original incluído em `docs/GDD.md`. Não é a campanha completa: apenas M01 — Ruínas de Arkan.

## Jogar agora

Abra `release/asas-do-eclipse-m01.html` num navegador moderno com WebGL2. O arquivo contém todo o código, arte procedural e áudio; não requer servidor nem downloads externos. O áudio começa após uma interação. O save pertence ao navegador/origem; em `file://`, a persistência depende das políticas do navegador. Quando o armazenamento falha, a interface avisa e permite exportar o save.

Alternativa: descompacte `release/asas-do-eclipse-dist.zip` e sirva a pasta por HTTP. O build usa `base: './'` e foi testado sob `/jogos/asas/`. **Não foi publicado no GitHub Pages**; não há autenticação ou backend.

## Desenvolvimento

```bash
npm ci
npm run dev
npm test                     # 21 testes Vitest
npm run build                # TypeScript estrito + build normal
npm run build:single         # dist-single/index.html
npm run release              # testes, dois builds e pacotes
npx playwright install chromium
npm run test:e2e             # inicia seu próprio servidor na porta 4178
```

Para repetir o playthrough completo acelerado:

```bash
npm run preview -- --port 4176
# em outro terminal:
node e2e/autopilot.mjs
```

O robô apenas escolhe comandos de movimento, especial e bomba. Usa `?debug=qa` para avançar a mesma simulação fixa rapidamente, com colisões, dano e resgates normais. Não usa invulnerabilidade, não altera HP e **não ganha recompensas de perfil**. O relatório deixa explícito que o teste é acelerado, não uma partida humana em tempo real.

## Controles

- **WASD / setas:** mover; diagonal normalizada, aceleração e desaceleração.
- **Mouse ou toque:** arraste relativo; gestos rápidos preservam seu deslocamento.
- **Shift / botão direito / A do controle:** Raio Lança, 2 cargas, feixe de 1,2 s.
- **E / B do controle:** Bomba de Pulso, 2 cargas; limpa apenas balas apagáveis, sem apagar lasers.
- **Esc / P / Start / botão Ⅱ:** pausa.
- **Controle padrão:** analógico esquerdo / D-pad; deadzone 0,14.
- **Resgatar:** fique a até 1,5 un do civil por 1,5 s; sair faz o progresso decair gradualmente.
- Tiro principal automático, 6/s, dano 10, velocidade 25. Ponto ciano central = hitbox de raio 0,33.

## Implementado

- Vite + TypeScript + Three.js; mundo XY 16×28, câmera ortográfica, letterbox sem recorte inclusive no celular; render desacoplado e interpolação; passo fixo de 60 Hz, acumulador limitado a 0,1 s.
- Véspera com HP 100, velocidade 8,2, aceleração 35, desaceleração 40, banking visual, sombra e i-frames de 0,85 s.
- E01 Vespa, E02 Mosquito, E05 Bastilha e E06 Olho Vermelho, com catálogo de dados, estados de IA, avisos e laser. Timeline JSON: 40 s seguros; caças até 2 min; tanques e resgates; AA, reparo e terceiro civil; chefe aos 5:40.
- Pool de 600 slots de projéteis, hash espacial 2D, colisões primitivas e origem de dano registrada.
- Três resgates, sucata magnética (+5% de raio passivo da Véspera), kit de +25 HP, combo x1–x5 e perda de combo por dano/inatividade.
- Gárgula-01: núcleo 600 HP, canhões laterais 200 cada, três fases, avisos, rails laterais e laser central; módulos param de atacar quando destruídos. Dano ao módulo não duplica no núcleo. Transições invulneráveis de 0,9 s; entrada de 1,5 s; destruição de 3,5 s.
- Menu, briefing, HUD, pausa real com confirmação de saída/reinício, derrota com origem do dano, câmera lenta visual, resultado, medalhas, precisão, recompensas e Jogar Novamente.
- Save v2 com migração v1, validação, slot temporário, backup anterior e exportação JSON. Vitória mantém coleta + recompensa (300 na primeira vitória, 180 no replay) + bônus aditivos; derrota mantém 60% da coleta.
- Hangar: motor (+3%/nível), canhão (+10%/nível) e coletor (+0,35 un/nível), preços escalonados, confirmação, comparação antes/depois e persistência.
- Modelos low-poly originais feitos com primitivas, terreno rolante de rio/represa/ruínas, balas com contorno escuro e aro claro, interface em PT-BR. WebAudio original sintetizado, música e efeitos, um único gerenciador e loops idempotentes.

## Estrutura

`src/core` relógio; `gameplay` simulação independente de Three.js/DOM; `data` catálogos e M01; `render` apresentação; `input` roteador; `audio` sintetizador; `persistence` save; `app` telas e orquestração; `src/tests` regras; `e2e` navegador. O arquivo HTML final é empacotado a partir dos módulos, não é a fonte monolítica do jogo.

## Testes de fato executados

Detalhes e limitações em `qa/reports/2026-11-10-v0.1.0.md`; dados brutos em `release/browser-smoke.json` e `release/full-mission-qa.json`.

- TypeScript + Vite: PASS.
- Vitest: 21/21 PASS.
- Chromium headless: 12 verificações PASS; nenhum erro de console ou `pageerror`.
- 20 reinícios pela interface: uma fonte contínua de motor; contagem de geometrias estável em 28.
- Partida M01 acelerada, apenas com comandos: vitória em **5:56,72 de simulação**, 3/3 civis, os dois canhões destruídos e as fases 1/2/3 observadas. HP/dano normal, sem god-mode.
- Mouse real, teclado, gamepad sintético padrão, toque CDP em 390×844, subpasta HTTP e HTML via `file://`.

## Fora desta fatia / próximos riscos

- Posturas Rasante/Alta ficam fixas (opcionais no MVP); não há EMP, outros especiais, outras aeronaves, M02–M15, coop, mapa completo, PWA/service worker, importação de save nem créditos de campanha final.
- Arte, música e efeitos são placeholders originais, não assets de produção final. Menus usam a mesma câmera ortográfica, não uma cena perspectiva dedicada.
- Sem remapeamento de teclas, dificuldade Acessível/checkpoint, navegação integral de menus pelo controle ou perfis gráficos/acessibilidade completos.
- O boss pode cair rapidamente com bom alinhamento e Raio Lança; o playthrough seguro também demonstrou que é possível evitar combates laterais. **Próximo risco prioritário conforme §23: playtests humanos e balanceamento/legibilidade de M01 antes de M02**, especialmente duração da luta, interesse dos primeiros 40 s, metas de 70/95% e coleta.
- Teste touch foi em emulação Chromium, não aparelho Android físico. Gamepad foi mapeamento sintético, não controle físico. Não há certificação Firefox/Safari, FPS p95 em hardware-alvo, RAM/VRAM de 10 partidas completas nem teste humano em tempo real de 6 minutos. Draw calls observadas no snapshot de boss: 60 (não um teto certificado de toda a missão).
