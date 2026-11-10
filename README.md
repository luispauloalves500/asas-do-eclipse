# ASAS DO ECLIPSE — Guerra dos Céus

Fatia de campanha **v0.3.0 / M01 + M02**, baseada no GDD original incluído em `docs/GDD.md`. Não é a campanha completa: M01 — Ruínas de Arkan e M02 — Estrada de Ferro Fantasma.

## Jogar agora

Abra `release/asas-do-eclipse-m01.html` num navegador moderno com WebGL2. A cena preenche a tela sem painéis laterais: o cenário continua além do campo lógico, escurecido por uma vinheta. Veja `CHANGELOG.md` para os detalhes da v0.3. O nome do HTML mantém `m01` por compatibilidade, mas inclui as duas missões.

O arquivo contém todo o código, arte procedural e áudio; não requer servidor nem downloads externos. O áudio começa após uma interação. O save pertence ao navegador/origem; em `file://`, a persistência depende das políticas do navegador. Quando o armazenamento falha, a interface avisa e permite exportar o save.

Alternativa: descompacte `release/asas-do-eclipse-dist.zip` e sirva a pasta por HTTP. O build usa `base: './'` e foi testado sob `/jogos/asas/`. Publicado em **https://luispauloalves500.github.io/asas-do-eclipse/**. Código: https://github.com/luispauloalves500/asas-do-eclipse. Não há autenticação ou backend.

## Desenvolvimento

```bash
npm ci
npm run dev
npm test                     # 40 testes Vitest
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
node e2e/autopilot.mjs          # M01
node e2e/m02.mjs                # M02, 3 civis, 2 vagões, 3 fases
node e2e/campaign.mjs           # mapa, migração e M02 móvel
```

O robô apenas escolhe comandos de movimento, especial e bomba. Usa `?debug=qa` para avançar a mesma simulação fixa rapidamente, com colisões, dano e resgates normais. Não usa invulnerabilidade, não altera HP e **não ganha recompensas de perfil**. O relatório deixa explícito que o teste é acelerado, não uma partida humana em tempo real.

## Campanha

Abra **CAMPANHA** no menu. M01 está disponível desde o início; vencer no Normal libera M02, sem exigir medalhas extras. Saves v0.1/v0.2 com M01 concluída abrem M02 automaticamente. Cada missão mantém seu próprio recorde e medalhas; sucata e melhorias são compartilhadas. M03–M05 aparecem bloqueadas como **Em produção**. Após M01, o relatório oferece **Próxima missão**.

M02: cânion ocre, viadutos de aço e trens em movimento; E01/E03 (0–1:45), E05/E07 (1:45–3:20), trilhos/minas E08 e três depósitos (3:20–5:45), Serpente de Ferro a partir de 5:45. Destrua os dois vagões de munição antes da fuga para +80 de bônus. Minas piscam por 0,6 s antes de causar dano e deixam o corredor central livre.

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

- Vite + TypeScript + Three.js; mundo XY 16×28, câmera ortográfica, campo completo sem recorte, com mundo estendido inclusive no celular; render desacoplado e interpolação; passo fixo de 60 Hz, acumulador limitado a 0,1 s.
- Véspera com HP 100, velocidade 8,2, aceleração 35, desaceleração 40, banking visual, sombra e i-frames de 0,85 s.
- E01 Vespa, E02 Mosquito, E05 Bastilha e E06 Olho Vermelho, com catálogo de dados, estados de IA, avisos e laser. Timeline JSON: 40 s seguros; caças até 2 min; tanques e resgates; AA, reparo e terceiro civil; chefe aos 5:40.
- E03 Raptor mira sua posição de 0,65 s atrás; E07 Arpão dispara quatro projéteis largos com abertura; E08 Semeador planta minas em faixas sinalizadas. Roteiro de M02 em JSON e falas de Suri.
- Serpente de Ferro: quatro vagões aerodeslizantes (reator 900 HP + três módulos de 200 HP), juntas douradas atingíveis, minas → jatos elétricos → corridas telegráficas. Destruir módulos remove seus ataques e projéteis. Núcleo desativa todo o comboio; derrota em 3,5 s.
- Pool de 600 slots de projéteis, hash espacial 2D, colisões primitivas e origem de dano registrada.
- Três resgates, sucata magnética (+5% de raio passivo da Véspera), kit de +25 HP, combo x1–x5 e perda de combo por dano/inatividade.
- Gárgula-01: núcleo 600 HP, canhões laterais 200 cada, três fases, avisos, rails laterais e laser central; módulos param de atacar quando destruídos. Dano ao módulo não duplica no núcleo. Transições invulneráveis de 0,9 s; entrada de 1,5 s; destruição de 3,5 s.
- Menu, briefing, HUD, pausa real com confirmação de saída/reinício, derrota com origem do dano, câmera lenta visual, resultado, medalhas, precisão, recompensas e Jogar Novamente.
- Save v2 com migração v1 e extensão aditiva de campanha (compatível com v0.2), validação, slot temporário, backup anterior e exportação JSON. Vitória mantém coleta + recompensa (M01: 300/180; M02: 410/246 na primeira vitória/replay) + bônus aditivos; derrota mantém 60% da coleta.
- Hangar: motor (+3%/nível), canhão (+10%/nível) e coletor (+0,35 un/nível), preços escalonados, confirmação, comparação antes/depois e persistência.
- Modelos low-poly originais feitos com primitivas, terreno rolante de rio/represa/ruínas, balas com contorno escuro e aro claro, interface em PT-BR. WebAudio original sintetizado, música e efeitos, um único gerenciador e loops idempotentes.

## Estrutura

`src/core` relógio e escala do viewport; `gameplay` simulação independente de Three.js/DOM; `data` catálogos e roteiros M01/M02; `render` apresentação (modelos agrupados, terrenos Arkan/cânion, partículas e qualidade adaptativa); `input` roteador; `audio` sintetizador; `persistence` save; `app` telas e orquestração; `src/tests` regras; `e2e` navegador. O arquivo HTML final é empacotado a partir dos módulos, não é a fonte monolítica do jogo.

## Testes de fato executados

Relatório: `qa/reports/2026-11-10-v0.3.0.md`. Evidências brutas em `release/*v03.json`; capturas em `release/screenshots/v0.3/`.

- TypeScript estrito + Vite normal e single-file; **40 testes Vitest** (25 existentes + 15 novos).
- Chromium 158: desktop 1600×900 e mobile portrait 390×844; teclado, mouse, gamepad sintético, toque CDP, pausa, derrota/retry, compras e persistência, mapa/bloqueios e migração. HTML `file://` inclui M02; build HTTP em subpasta.
- Partidas completas aceleradas com comandos de movimento/especial/bomba e dano normal: M01 e M02 vencidas, três civis em cada e fases 1/2/3 observadas. M02 também destrói os dois vagões de munição e os três módulos do boss. Sem god-mode; testes não dão recompensas ao perfil.
- 20 reinícios M01 e seis reinícios de boss M02 verificam geometrias estáveis e no máximo um loop de motor.
- Revisão visual encontrou e corrigiu lacuna na reciclagem do terreno; teste amostra 896 posições de scroll para cobertura contínua inclusive no portrait.

## Fora desta fatia / próximos riscos

- Posturas Rasante/Alta ficam fixas (opcionais no MVP); não há EMP, outros especiais, outras aeronaves, M03–M15, coop, mapa completo, PWA/service worker, importação de save nem créditos de campanha final.
- Arte, música e efeitos são placeholders originais, não assets de produção final. Menus usam a mesma câmera ortográfica, não uma cena perspectiva dedicada.
- Sem remapeamento de teclas, dificuldade Acessível/checkpoint, navegação integral de menus pelo controle ou perfis gráficos/acessibilidade completos.
- O boss pode cair rapidamente com bom alinhamento e Raio Lança; o playthrough seguro também demonstrou que é possível evitar combates laterais. **Próximo risco prioritário conforme §23: playtests humanos e balanceamento/legibilidade de M01/M02 antes de M03**, especialmente duração da luta, interesse dos primeiros 40 s, metas de 70/95% e coleta.
- Teste touch foi em emulação Chromium, não aparelho Android físico. Gamepad foi mapeamento sintético, não controle físico. Não há certificação Firefox/Safari, FPS p95 em hardware-alvo, RAM/VRAM de 10 partidas completas nem teste humano em tempo real de 6 minutos. Draw calls observadas no snapshot de boss: 94 em M02 (não um teto certificado de toda a missão).
