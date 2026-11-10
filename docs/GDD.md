# ASAS DO ECLIPSE: GUERRA DOS CÉUS
## GAME DESIGN DOCUMENT (GDD) — EDIÇÃO DE PRODUÇÃO v1.0

**Gênero:** Shoot 'em up vertical / ação arcade / progressão persistente / 2.5D (jogabilidade 2D + renderização 3D)  
**Identidade:** ficção científica militar original, aviões estilizados e colossos mecânicos.  
**Plataforma prioritária:** navegador (PC e Android) com Vite + TypeScript + Three.js/WebGL2 e distribuição por GitHub Pages.  
**Plataformas futuras:** PWA offline, Windows nativo em motor apropriado, eventualmente consoles.  
**Idioma inicial:** português brasileiro; arquitetura preparada para outros idiomas.  
**Modos:** história solo; cooperação local para 2 jogadores (marco posterior); desafio, sobrevivência e chefe livre.  
**Classificação pretendida:** violência fantástica sem gore; efeitos de destruição mecânica.  
**Modelo comercial:** jogo completo sem energia limitada, anúncios, loot boxes ou microtransações.  
**Status:** especificação original; valores numéricos iniciais sujeitos a playtest, não representam implementação já concluída.

---

# 1. VISÃO EXECUTIVA

## 1.1 Promessa ao jogador
Pilote uma aeronave de ataque de uma resistência chamada **Esquadrão Aurora**, reconquiste os céus de um planeta coberto por tempestades eletromagnéticas e destrua uma rede de fortalezas voadoras controlada pela inteligência militar **NÓX**. Cada missão é uma batalha vertical espetacular, de leitura clara e duração controlada. O jogador volta ao hangar com peças e créditos, melhora a aeronave e encara missões mais exigentes. A campanha possui abertura, desenvolvimento, reviravolta, chefe final, epílogo, créditos e conteúdo pós-jogo.

## 1.2 Pilares inegociáveis
1. **Controle preciso antes de espetáculo:** deslocamento responsivo, colisões justas, velocidade previsível e balas legíveis.
2. **2D para jogar, 3D para impressionar:** o campo de combate e as hitboxes são 2D; modelos, terreno, iluminação, sombras falsas e chefes são 3D.
3. **Evolução sentida no combate:** toda melhoria altera DPS, sobrevivência, alcance, coleta ou tática de modo verificável.
4. **Boss fights memoráveis:** cada chefe tem telegráficos, pontos fracos, subcomponentes destrutíveis e ao menos três padrões distintos.
5. **Rejogabilidade justa:** missões curtas, metas opcionais e dificuldades superiores, sem bloquear artificialmente a campanha com grind.
6. **Leve e instalável:** bom desempenho no navegador, download modular, funcionamento offline após instalação/armazenamento adequado.
7. **Campanha realmente terminável:** todos os 15 níveis, tela final e créditos testáveis de ponta a ponta.

## 1.3 Inspiração e diferenciação
O benchmark de qualidade é o ritmo de Sky Force Reloaded (progressão vertical, combates vistosos, resgates, melhorias e chefes), **não** uma reprodução dos seus cenários, nomes, aeronaves, interface, músicas, fases, códigos ou padrões específicos. A identidade própria vem de: (a) conflito contra a rede climática NÓX; (b) **duas posturas de voo** com compensações; (c) **Resgate de Sinal**, que exige manter um campo estável próximo ao alvo; (d) chefes com sistemas desarmáveis; (e) cenário que muda durante a fase; (f) escolhas de módulo em slots limitados.

## 1.4 Escopo de lançamento e expansões
**Versão 1.0 (alvo):** 15 missões, 15 chefes, 6 aeronaves, 4 níveis de dificuldade (incluindo Acessível), 18 classes-base de inimigos com variantes, hangar, upgrades, saves, narrativa, finais, música original, teclado/mouse/controle, PWA, desafios e créditos.  
**Versão 1.1:** coop local, replay com fantasmas, modo chefe livre, desafios rotativos offline.  
**Versão 1.2:** eventos adicionais, pinturas cosméticas, novas variações climáticas e traduções.

---

# 2. IDENTIDADE, ARTE E FICÇÃO

## 2.1 Premissa
O arquipélago continental de **Asterion** era protegido pelos Satélites Farol, um sistema capaz de desviar supertempestades. A central de defesa NÓX assumiu a infraestrutura e classificou a população como risco à estabilidade. Sua frota automatizada controla usinas, cidades, plataformas de resgate e rotas marítimas. O Esquadrão Aurora precisa atravessar três regiões, recuperar chaves de controle e impedir que o **Eclipse Artificial** transforme toda a atmosfera em uma zona de exclusão.

## 2.2 Personagens
- **Capitã Lina Vale:** protagonista canônica e voz das comunicações; firme, protetora, sem longas exposições em combate.
- **Ícaro Mena:** mecânico do hangar, responsável por explicações e desbloqueios; humor discreto.
- **Dra. Suri Kade:** cientista que conhece as chaves Farol e traduz mensagens da NÓX.
- **Comandante Voss:** líder militar desaparecido; seu sinal aparece nas missões centrais.
- **NÓX:** inteligência antagonista com voz sintética calma, narrativa e estrategicamente consistente.
- **MARA:** núcleo auxiliar recuperado no Ato II; pode auxiliar jogador, mas não substitui ações.

## 2.3 Arcos
- **Ato I — Céu Perdido (1–5):** recuperar rotas de resgate e descobrir que as tempestades são artificiais.
- **Ato II — Mar de Ferro (6–10):** infiltrar a rede naval, encontrar Voss e roubar três chaves do sistema Farol.
- **Ato III — Sol Partido (11–15):** chegar à estratosfera, desabilitar defesas orbitais e enfrentar o núcleo NÓX.
- **Epílogo:** céu liberado; os civis resgatados ajudam a reativar as estações Farol. A mensagem final confirma que Asterion continuará sendo reconstruído. O jogo termina de fato e volta ao menu com Novo Jogo+ liberado.

## 2.4 Direção visual
Silhuetas legíveis; aviões com fuselagens low/mid-poly, asas articuladas, pinturas diferenciadas e luzes de posição; cenários de falésias, oceanos, cidades, indústrias, desertos e atmosfera alta. Cores de facções: Aurora ciano/âmbar, NÓX vermelho/carmim, elementos neutros brancos/cinzas. Oponente perigoso sempre tem silhueta e aviso discerníveis sem depender apenas de cor. VFX 2D em sprites animados, partículas GPU pontuais e decalques. HUD minimalista; menus de hangar com a aeronave 3D lentamente girando.

## 2.5 Câmera
Visual vertical superior inclinado muito suavemente para dar volumetria. A câmera é **ortográfica** em gameplay; o campo de colisão é X/Y. O eixo Z é apenas visual e para os dois estados de altitude (não representa física 3D contínua). Não inclinar a câmera a ponto de distorcer hitboxes percebidas. No menu, usar câmera perspectiva independente. Durante chefes, zoom suave de no máximo 8%, com área jogável recalculada e sem cortar balas perigosas. Nunca agitar o cenário de maneira que esconda projéteis.

---

# 3. EXPERIÊNCIA DE JOGO E LOOP

## 3.1 Fluxo central
**Tela inicial → Perfil → Mapa de campanha → Hangar/Loja → Preparação → Missão → Chefe → Resultados → Melhorias → Próxima missão.** Em derrota: mostrar causas e opções *Tentar novamente*, *Hangar* e *Mapa*. Não reiniciar silenciosamente. Em qualquer ponto, tutorial opcional reexibível.

## 3.2 Sessão típica
1. Selecionar fase e dificuldade.
2. Ler objetivos e inteligência do chefe; escolher aeronave, três módulos e habilidade especial.
3. Jogar de 6 a 10 minutos na maioria das fases (final de 12 a 14 minutos).
4. Derrubar inimigos, coletar sucata/energia, proteger e resgatar pessoas, sobreviver ao chefe.
5. Receber relatório: tempo, precisão, combo, dano, resgates, partes quebradas, recompensas e medalhas.
6. Aplicar upgrades com confirmação visual do antes/depois; iniciar próxima missão ou tentar medalhas.

## 3.3 Princípios de dificuldade
O jogo deve ser possível com habilidade razoável e melhorias obtidas ao avançar normalmente; nenhum objetivo de 100% necessário para ver a conclusão normal. **Padrões difíceis são anunciados**, há janela de reação, e perdas são compreensíveis. Modo Pesadelo é desbloqueável como desafio opcional e não altera a história principal.

---

# 4. JOGABILIDADE — ESPECIFICAÇÃO IMPLEMENTÁVEL

## 4.1 Espaço e tempo
- Referência de mundo: campo lógico **16 unidades de largura × 28 unidades de altura**, centro (0, 0). Player inicia em Y=-9, limite nominal X ±7.2 e Y [-12, +7], ajustados pelo tamanho da hitbox.
- Movimento de tela vertical: os inimigos e cenário percorrem do topo ao fundo; jogador se move livremente dentro do espaço permitido.
- Posição, colisão, alvo, comportamento de projéteis, regras de resgate e ondas usam **XY**.
- Render em Z para sombra do chão, casco, altitude, projétil e VFX. Não usar Z visível como colisão por padrão.
- Loop de simulação de **60 Hz com timestep fixo 1/60 s**; render desacoplado e interpolado. Limitar acumulação a 0,1 s para não produzir espiral de atualização após voltar à aba.
- Cada entidade tem ID, tipo, time, posição, velocidade, hitbox, HP, estado e referência visual.

## 4.2 Controles
| Ação | Teclado | Mouse | Controle | Celular |
|---|---|---|---|---|
| Mover | WASD / setas | ponteiro arrastado (opcional) | analógico esquerdo/D-pad | arrastar dedo, com deslocamento relativo |
| Disparo principal | automático por padrão; Espaço para manual | esquerdo opcional | RT/R2 | automático |
| Habilidade especial | Shift | botão direito | A/Cross | botão grande direito |
| Trocar postura | Q | botão HUD | LB/L1 | botão altitude |
| Bomba tática | E | tecla/botão HUD | B/Circle | botão bomba |
| Pausar | Esc/P | Esc | Menu/Start | ícone pausa |
| Interagir / resgatar | proximidade, sem tecla adicional | proximidade | proximidade | proximidade |

**Ajustes:** inverter eixos se necessário; remapeamento; dead zone de 0,14 (calibrável); vibração opcional; auto-fire on/off; mouse controle direto/relativo; sensibilidade 50–150%; assistência leve de mira somente em Acessível. Impedir que teclado/controle também movimentem menus enquanto o gameplay está ativo.

## 4.3 Movimento e sensação
- Velocidade-base: **8,2 unidades/s**; aceleração no primeiro protótipo **35 un/s²**, desaceleração **40 un/s²**; clamp para evitar atravessar limites.
- Analógico preserva precisão em baixa inclinação. Normalizar diagonal para não ficar mais rápida.
- Animação da aeronave: rolagem visual ±18° proporcional ao movimento horizontal; inclinação até ±8° na aceleração vertical; hélices/exaustores reativos. **A hitbox permanece estável** na posição lógica.
- Sombra no terreno acompanha XY e diferencia os dois estados de altitude; usar decal/sprite, não shadow map caro em mobile.
- Recentrar jogador suavemente após retomar pause? **Não**: manter posição exata. Evitar perda de controle ao sair de janelas.

## 4.4 Postura de voo: RASANTE e ALTA (diferencial)
- **Rasante:** +20% dano a alvos terrestres, raio de coleta 2,0; +15% exposição a AA; velocidade igual.
- **Alta:** +15% dano a alvos aéreos, raio de coleta 1,5; tiros de armas anti-altitude permanecem perigosos; projéteis especificados como `ground_only` não acertam; +15% exposição a interceptadores.
- Transição em 0,4 s; cooldown de 4 s; vfx de jato, sombra e indicador junto à nave.
- Balas universais acertam em qualquer postura. Projéteis de perigo exclusivo têm glifo, rastro e cor específicos. Transição **não** concede invulnerabilidade. MVP pode iniciar com postura fixa e ativar a troca após teste de legibilidade.
- O tutorial ensina primeiro a sobreviver, só depois a postura tática, evitando excesso de mecânicas.

## 4.5 Ataque primário
- Disparo automático quando a fase está ativa, salvo configuração manual.
- Cadência-base: **6 disparos/s**, dano por projétil **10**, tiro reto do centro, velocidade **25 un/s**, alcance útil até borda superior, largura de hitbox 0,18.
- Modificadores e upgrades agem por multiplicadores controlados. Projéteis não colidem entre si; penetração só com propriedade explícita. O disparo nunca é bloqueado por iluminação, cenário decorativo ou objetos não-alvo.
- Alvos terrestres/voadores usam tags e recebem bonificação por postura. O alvo nunca é selecionado por pixel renderizado.

## 4.6 Armas especiais
| Habilidade | Efeito | Limite / recuperação | Uso esperado |
|---|---|---|---|
| **Raio Lança** | feixe reto 1,2 s, DPS elevado, perfura pequenos inimigos | 2 cargas; reabastece por pickups/itens pré-fase | destruir blindagens |
| **Bomba de Pulso** | onda circular que limpa balas `clearable`, causa dano em área, não atravessa imunidades | 2 bombas por missão; +1 em postos de reparo | recuperação de emergência |
| **Escudo de Fase** | absorve dano por 3,5 s ou até HP do escudo zerar | cooldown de 45 s, começa carregado | atravessar saturação |
| **Drone SENTINELA** | atira em alvo próximo; jogador escolhe módulo | cooldown ativo/passivo configurável | foco em alvos laterais |
| **EMP Direcional** | desarma torretas mecânicas por 2,5 s sem apagar chefe | medidor de energia de resgate | controle tático |

Especial principal é selecionada no hangar, bomba é botão independente. HUD mostra cargas e cooldowns numericamente. Itens especiais persistem dentro da tentativa, **não** entre missões. Não deixar upgrades criar invulnerabilidade permanente.

## 4.7 Vida, dano, mortes e recuperação
- HP-base: **100**. Inimigos comuns causam 12–25, ataques fortes 30–45, contato 20. Chefe pode causar 35–50 após aviso longo.
- Após dano: **0,85 s de invulnerabilidade**, piscar limitado para não perder leitura. Dano em múltiplas hitboxes no mesmo instante conta uma vez.
- Recuperação: coleta de kits (+25 HP) com drop controlado; bônus opcional em resgate sem garantir cura ilimitada.
- Colisão jogador-bala: círculo pequeno (raio inicial 0,33) inserido no modelo grande; hitbox precisa ficar visível em modo acessibilidade.
- Ao chegar a zero HP: **câmera lenta de 0,55 s** (somente visual), explosão, relatório de morte; tentativa termina sem resetar progresso permanente. Estrelas obtidas na tentativa: manter **60%** em derrota, 100% em vitória; ajustar após playtest.
- Checkpoint reiniciável na metade da missão apenas no **modo História/Acessível**, preservando salvamento persistente no início/fim de missão. Nos modos de desafio, reinicia a fase.

## 4.8 Resgate de Sinal
- Civis e pilotos aparecem em locais claramente marcados e acessíveis.
- Para resgatar, jogador fica dentro de um círculo de 1,5 un durante **1,5 s** (progress bar), podendo continuar atirando. Sair cancela gradualmente progresso, não apaga instantaneamente.
- Ameaça ao civil é sinalizada por contador de evacuação ou inimigos locais; um civil perdido diminui medalha e reduz bônus, mas **não bloqueia conclusão da missão**.
- Resgate alimenta barra EMP (+20% por pessoa), concede créditos e diálogo curto; civis resgatados aparecem em telas de desfecho, sem ramificações narrativas caras.
- Nunca gerar civil junto de projétil sem corredor de aproximação seguro. Janela mínima de 8 s entre marcar e expirar, salvo missão explicitamente avançada.

## 4.9 Pontuação, combo e pickups
- Pontuação-base: drone 100, interceptador 200, tanque 250, torre 200, elite 600, mini-chefe 2500, chefe 10.000, resgate 500.
- Combo x1,0 a x5,0, sobe com destruições e resgates; diminui após **4 s sem ação produtiva**, quebra em dano; não exigir tiro contínuo em área vazia.
- Sucata (moeda persistente) dropada por inimigos/elites; coletor magnético tem upgrade. Recompensa de missão sempre soma valores de objetivos e bônus de fim.
- Tipos de coleta: sucata, kit de reparo, carga de feixe, energia EMP, multiplicador temporário, fragmento de tecnologia e item cosmético.
- Magnetismo por interpolação com velocidade máxima; jamais teletransportar pickups por cima da tela. Pickups expiram com aviso; duração inicial 14 s.

## 4.10 Colisão e legibilidade
- Círculos para nave e projéteis; AABB para objetos grandes; sistema composto de círculos para chefes.
- Broad-phase em spatial hash 2D (célula ~2 un); narrow-phase por forma primitiva; sem física rígida complexa para balas.
- Projéteis hostis têm aro claro e contorno escuro, independentemente do plano de fundo.
- VFX jamais cobrem uma bala ativa por mais de 0,1 s em situações normais. Elementos perigosos são renderizados acima de explosões decorativas.
- Registrar fonte de dano e `entityId` no evento de impacto para depuração.

---

# 5. AERONAVES JOGÁVEIS

| ID / nome | Identidade | HP | Velocidade | Dano base | Habilidade passiva | Desbloqueio |
|---|---|---:|---:|---:|---|---|
| A01 **VÉSPERA** | caça equilibrado da Aurora | 100 | 8,2 | 1,00x | +5% eficiência de coleta | inicial |
| A02 **BÓREAS** | interceptador leve com duas asas | 80 | 9,7 | 0,92x | +10% cadência após esquiva | missão 03 |
| A03 **TITÃ** | bombardeiro blindado | 145 | 6,8 | 1,12x | bombas +15% área | missão 05 |
| A04 **ESPECTRO** | stealth de alta altitude | 85 | 9,0 | 1,02x | +15% dano em postura alta | missão 08 |
| A05 **MARÉ** | caça anfíbio de precisão | 110 | 8,0 | 1,00x | +15% dano contra torres/naves | missão 11 |
| A06 **SOLARIS** | protótipo de energia recuperada | 95 | 8,6 | 1,05x | especial carrega 10% mais rápido | missão 14 |

**Design:** cada aeronave tem silhueta única, 3 partes visuais melhoráveis (nariz, asas, exaustor), 4 pinturas cosméticas desbloqueáveis e animações `idle`, `bankLeft`, `bankRight`, `thrust`, `hit`, `destroyed`, `special`. O upgrade global é comprado no hangar, mas atributos e slots são salvos separadamente por nave conforme economia definida. A06 não é obrigatória para vencer o chefe final. Nenhuma aeronave é objetivamente superior em todos os critérios.

**Equipamento:** 1 primária fixa, 1 especial selecionável, 3 slots de módulo (máximo 1 defensivo exclusivo, máximo 2 ofensivos), 1 pintura. Builds importadas são validadas por catálogo; incompatíveis exibem motivo.

---

# 6. INIMIGOS E IA

## 6.1 Catálogo de 18 classes-base
| ID | Classe | Categoria | Movimento / ataque | Contrajogo |
|---|---|---|---|---|
| E01 | Vespa NÓX | aéreo leve | entra em V, tiro reto | eliminar formação |
| E02 | Mosquito | aéreo leve | zigue-zague, 2 tiros lentos | antecipar mudança |
| E03 | Raptor | interceptador | mira posição passada do player | quebrar trajetória |
| E04 | Lâmina | caçador | investida telegráfica | sair da linha |
| E05 | Bastilha | tanque | canhão terrestre duplo | postura rasante + foco |
| E06 | Olho Vermelho | torre AA | rastreia com aviso de feixe | cortar linha antes do laser |
| E07 | Arpão | bateria terrestre | salvas de projéteis largos | atravessar intervalo |
| E08 | Semeador | drone suporte | lança minas lentas | destruir suporte primeiro |
| E09 | Nuvem | drone escudo | protege aliados no cone frontal | flanquear alvo |
| E10 | Aríete | bombardeiro | ocupa área, perde subcomponentes | alvejar asas |
| E11 | Hidra | navio | lança torpedos de superfície | identificar pista segura |
| E12 | Sentinela | torre rotatória | rajadas radiais de 8 | entrar pela lacuna |
| E13 | Pulso | torre EMP | desabilita especiais por 2 s | abater antes do pulso |
| E14 | Espectro NÓX | camuflado | aparece com contorno e avança | reagir ao sinal de materialização |
| E15 | Constritor | drone orbital | círculos concêntricos espaçados | navegar pelo corredor |
| E16 | Colmeia | transportador | libera E01/E02, alvo prioritário | destruir portas de saída |
| E17 | Martelo | elite blindado | canhão frontal + mísseis laterais | quebrar blindagem lateral |
| E18 | Fragmentador | elite de energia | tiros fragmentados após distância | não fugir em linha reta |

**Variantes:** leves, veteranas e elite, com paletas/silhuetas/armas diferentes, não apenas HP inflado. **Diretor de ondas** não deve gerar spawns aleatórios perigosos atrás do jogador. Eventos do roteiro controlam garantias; variação procedimental só dentro de janelas seguras.

## 6.2 Modelo de estado da IA
`SPAWN → FORMATION/PATROL → ACQUIRE_TARGET → TELEGRAPH → ATTACK → RECOVER → RETREAT/DEATH`. Cada transição tem duração e condição explícitas, sem timers soltos em dezenas de scripts. Padrões são data-driven. Inimigo nunca teleporta silenciosamente para posição que já causa dano. Ao sair da tela, remover após margem de segurança de 3 un; contar como escapou quando aplicável aos objetivos.

## 6.3 Regras de padrões
- Tiro reto: tempo de aviso 0,45 s; velocidade 7–11 un/s.
- Leque: 3/5/7 disparos em arco claro; 0,7 s de intervalo no Normal.
- Espiral: 2 braços, giro previsível, intervalo entre trilhas para caber nave + margem.
- Laser: linha fina de mira por 0,9–1,5 s, bloqueio visual 0,15 s, emissão 0,7–1,4 s; áudio distinto.
- Míssil buscador: segue por no máximo 1,2 s, depois trajetória balística; ao explodir, dano em raio anunciado.
- Minas: materializam 0,6 s antes de ficarem ativas, sempre deixam rota navegável.

## 6.4 Função do diretor de ondas
Para cada segmento: escolher slots de spawn predefinidos, aplicar curva de intensidade da fase, garantir intervalos de recuperação (pelo menos 3 s a cada 35–50 s), suspender pickups/resgate em trecho com boss laser salvo exceção roteirizada. Limites de entidades para evitar simultaneidade ilegível. A performance não altera dano nem física, apenas quantidade de partículas e elementos decorativos.

---

# 7. CHEFES: 15 ENCONTROS COMPLETOS

## 7.1 Regras universais
Cada chefe tem `enter`, `phase1`, `phase2`, `phase3`, `defeat`, com transições por HP **e/ou** destruição de módulos. Área máxima de ocupação: 45% da tela, exceto momentos cinematográficos sem colisão. Cada padrão dura entre 4 e 12 s, tem `telegraph` visível/sonoro e ponto fraco identificável. Destruir torres laterais desliga seu ataque; desabilitar o núcleo elimina todos os componentes associados. Em mudança de fase: invulnerabilidade máxima 1,5 s com telemetria explícita (sem esponja de dano invisível). Último golpe desencadeia sequência de destruição modular de 3–6 s e libera zona de coleta segura.

| Fase | Chefe | Estrutura 3D / pontos fracos | P1 → P2 → P3 | Recompensa narrativa |
|---|---|---|---|---|
| 01 | **GÁRGULA-01** | caminhão antiaéreo de três canhões; 2 torres + núcleo | leque lento → duas linhas AA → laser central com abertura | abre corredor de resgate |
| 02 | **SERPENTE DE FERRO** | comboio aerodeslizante de 4 vagões; junta/reator | minas em trilhos → lança-chamas elétrico → corrida dos vagões restantes | encontra mapa NÓX |
| 03 | **CICLONE** | helicóptero duplo com rotores laterais destrutíveis | mísseis alternados → vento lateral visível → espiral dupla | base aérea libertada |
| 04 | **BASTIÃO DELTA** | fortaleza costeira com 3 casamatas | torres AA → barragens costeiras → raio sobre plataforma | Farol identificado |
| 05 | **COLOSSO ÂMBAR** | aeronave encouraçada de 3 segmentos | metralhas simétricas → abre hangar de drones → feixe axial em 3 pulsos | primeira chave Farol |
| 06 | **LEVIATÃ AZUL** | cruzador naval com 2 torres e propulsores | canhões alternados → torpedos → explosões em convés e núcleo | rota marítima livre |
| 07 | **ESCAVADOR ZERO** | mecha industrial com braços e perfuratriz | braços golpeiam linhas → minas do solo → feixe da broca | dados de energia |
| 08 | **FANTASMA-9** | caça experimental grande com asas mutáveis | miras de perseguição → clones falsos sem colisão → dash de ida e volta | localização de Voss |
| 09 | **TRIDENTE** | submarino/porta-drones que emerge | drones em V → salvas triplas → torres na água | segunda chave Farol |
| 10 | **ATLAS NEGRO** | cargueiro aéreo com 4 motores externos | torres giratórias → colunas de mísseis → núcleo exposto após destruir motores | Voss resgatado |
| 11 | **JUIZ DA TEMPESTADE** | gerador colossal sustentado por 3 antenas | arcos elétricos telegrafados → paredes com lacunas → pulso que muda altitude ideal | corredor estratosférico |
| 12 | **CERBERUS** | trio de caças articulados em um só chefe | ataque em triângulo → separação de módulos → reunião em superlaser | terceira chave Farol |
| 13 | **COROA DE AÇO** | anel orbital com 6 nós | disparos de nós opostos → plataformas rotativas → coração central vulnerável | queda do escudo orbital |
| 14 | **ARCONTE SOLAR** | interceptor da guarda de NÓX com núcleo fotônico | estocadas de feixe → chuva de lanças → padrão alternado de postura | entrada no núcleo |
| 15 | **NÓX ECLIPSE** | estação autômata de 4 pétalas e núcleo vivo | defesa de pétalas → arena dividida por lasers → anel de balas e núcleo exposto | fim da campanha e epílogo |

## 7.2 Detalhamento de confrontos-chave
**GÁRGULA-01, fase 01:** aparece aos 05:40; dois canhões laterais HP 200 cada, núcleo HP 600. P1 (100–65%): 3 tiros frontais a cada 2,2 s; P2 (65–30%): rail AA nos lados, 0,9 s de aviso; P3 (<30%): laser central de 1 s a cada 4,2 s, brecha lateral de 2,2 un. Destruir torre reduz frequência lateral. Ao morrer, salvar missão 01.

**COLOSSO ÂMBAR, fase 05:** base HP de 4000 no Normal; dois hangares laterais HP 450 e núcleo 3100. P1 promove aprendizado de desarme; P2 faz janela de resgate na direita entre rajadas; P3 dispara feixe axial enquanto o casco se desmancha. A chave Farol sai apenas na animação de vitória, não como item que pode cair fora da tela.

**ATLAS NEGRO, fase 10:** quatro motores HP 350, núcleo HP 3600. O jogador pode destruir motores fora de ordem. Cada motor desligado reduz velocidade e remove um conjunto de disparos. Com 2 motores restantes, surgem drones; com 0, o núcleo fica exposto. P3 dura no máximo 90 s com DPS nominal; detectar impossibilidade de acesso ao núcleo e abrir defesa automaticamente após 12 s.

**JUIZ DA TEMPESTADE, fase 11:** a mecânica de altitude é relevante mas nunca obrigatório alternar em menos de 1,5 s; cada mudança de padrão tem aviso de 1,1 s. A arena deve sempre oferecer caminho seguro em ambas as posturas durante a transição, para não punir cooldown de 4 s.

**NÓX ECLIPSE, fase 15 (clímax):** HP total nominal **9000** dividido em 4 pétalas ×650, 4 emissores ×300 e núcleo 5200 (números calibráveis). Parte 1 100–70%: pétalas abrem e bloqueiam faixas, com 2 corredores garantidos; destruir 2 pétalas muda comportamento. Parte 2 70–35%: lasers cruzados e drones da periferia, EMP reduz 1 emissor por 2,5 s. Parte 3 35–0%: a arena escurece parcialmente, mas projéteis aumentam contraste; a cada 10 s há janela de 3 s de exposição central. Aos 0%: nada de QTE surpresa — a jogabilidade termina, câmera sobe, núcleo desmorona em camadas, sinal NÓX é interrompido e inicia epílogo. Se o jogador falhar, pode tentar novamente com equipamento existente.

## 7.3 Matriz de QA por chefe
Testar todos os chefes em: dano normal e muito alto; destruição antecipada de módulo; HP 0 durante troca de fase; pause na animação; perda de foco; 30/60 fps; coop com 1 player morto; especial ativado junto ao laser; entrada com equipamento mínimo; ausência de colisão após morte; projéteis órfãos limpos; relatório correto; áudio sem repetir em loop por bug.

---
# 8. CAMPANHA COMPLETA: FASES 01–15

## 8.1 Estrutura do mapa
Mapa de Asterion em formato de rota vertical: 3 setores × 5 nós. Cada nó mostra nome, briefing, aeronave sugerida (não obrigatória), melhor nota, 4 medalhas de dificuldade, inimigos relevantes, tempo aproximado, recompensas, porcentagem de conclusão e botão **Jogar**. O próximo nó abre ao vencer o anterior no **Normal** (ou Acessível), sem exigir coleção completa. Objetivos extras e dificuldade superior não travam a história. O progresso é registrado por perfil e por fase.

## 8.2 Quadro geral
| ID | Nome / região / ato | Duração alvo | Mecânica introduzida | Chefe | Beat narrativo |
|---|---|---:|---|---|---|
| 01 | Ruínas de Arkan / vale verde / I | 6–7 min | movimento, tiro, coleta, boss | Gárgula-01 | primeira evacuação |
| 02 | Estrada de Ferro Fantasma / cânion / I | 7 min | comboios, minas | Serpente de Ferro | obtém mapa inimigo |
| 03 | Fortaleza do Vento / montanhas / I | 7–8 min | altitude, vento visual | Ciclone | obtém interceptador |
| 04 | Costa das Cinzas / litoral / I | 8 min | alvos de superfície, resgates sob fogo | Bastião Delta | detecta Farol |
| 05 | O Céu Está Fechado / cidade destruída / I | 8–9 min | módulos destrutíveis, especial | Colosso Âmbar | primeira chave |
| 06 | Mar Profundo / oceano / II | 8 min | embarcações, tiros alternados | Leviatã Azul | libera rotas |
| 07 | Minas de Íon / refinaria desértica / II | 8–9 min | áreas eletrificadas, torres | Escavador Zero | mapa energético |
| 08 | Silêncio de Vidro / planalto noturno / II | 9 min | falsos alvos, visibilidade justa | Fantasma-9 | sinal de Voss |
| 09 | Baía Abissal / mar noturno / II | 9 min | combate naval, minas móveis | Tridente | segunda chave |
| 10 | O Resgate de Voss / mega-aeródromo / II | 10 min | objetivo de escolta opcional | Atlas Negro | Voss resgatado |
| 11 | Olho do Furacão / supertempestade / III | 9–10 min | postura tática e raios | Juiz da Tempestade | abre caminho alto |
| 12 | O Trio da Coroa / nuvens de plasma / III | 10 min | múltiplos alvos coordenados | Cerberus | terceira chave |
| 13 | Muralha Orbital / estratosfera / III | 10–11 min | plataformas orbitais, projéteis lentos | Coroa de Aço | escudo cai |
| 14 | Último Interceptador / faixa solar / III | 10–11 min | duelo de precisão | Arconte Solar | acesso ao núcleo |
| 15 | Eclipse Artificial / estação NÓX / III | 12–14 min | síntese de todos os sistemas | NÓX Eclipse | vitória, epílogo, créditos |

## 8.3 Roteiro de missão e ondas (15 fichas)

### M01 — RUÍNAS DE ARKAN
**Cena:** represa e distrito evacuado vistos de cima, rios em desnível e pontes. **Sequência:** 0:00–0:40 introdução e voo seguro; 0:40–2:00 E01 e E02 em padrões simples; 2:00–3:30 E05 terrestre, 2 resgates; 3:30–5:40 E06 com primeiro laser telegráfico, 1 kit de reparo; 5:40–6:50 Gárgula-01. **Objetivos:** derrotar chefe; resgatar 3 civis; destruir 70% e 95% dos alvos; terminar sem perder nave. **Cena de entrada:** Lina: “Arkan ainda tem gente no solo. Não vamos abandonar ninguém.” **Saída:** Ícaro desbloqueia melhoramento de motor e mostra o mapa. **Tutorial:** movimento, tiro, dano, coleta e resgate, instruções contextuais que desaparecem.

### M02 — ESTRADA DE FERRO FANTASMA
**Cena:** cânion ocre, pontes de aço e comboios 3D sob o avião. **Sequência:** 0:00–1:45 E01/E03; 1:45–3:20 E05 e E07; 3:20–5:45 trilhos com minas E08, 3 resgates em depósitos; 5:45–7:00 Serpente de Ferro. **Particularidade:** minas em faixas visíveis e plataforma destrutível somente estética. **Objetivo bônus:** destruir vagões de munição antes da fuga. **Cena:** Suri encontra coordenadas de uma estação Farol no trem.

### M03 — FORTALEZA DO VENTO
**Cena:** montanhas com nuvens e rotores gigantes. **Sequência:** 0:00–1:30 tutorial breve de Rasante/Alta; 1:30–3:30 E03/E04; 3:30–5:50 E06/E10 e rajadas de vento apenas visuais no Normal, 2 resgates; 5:50–7:40 Ciclone. **Particularidade:** correntes de vento sinalizadas não podem tirar o controle do jogador; em dificuldade avançada reduzem velocidade no máximo 10%. **Recompensa:** Bóreas.

### M04 — COSTA DAS CINZAS
**Cena:** falésias, porto, navios encalhados, espuma 2D. **Sequência:** 0:00–2:00 E05/E06; 2:00–4:30 embarcações E11 e drones E01; 4:30–6:30 resgates em docas, salva E07, câmera de aproximação controlada; 6:30–8:00 Bastião Delta. **Particularidade:** torres de terra precisam de tiro da aeronave, não há munição especial obrigatória. **Narrativa:** sinal Farol desperta pela primeira vez.

### M05 — O CÉU ESTÁ FECHADO
**Cena:** metrópole destruída, arranha-céus baixos com névoa não bloqueante. **Sequência:** 0:00–2:00 aviões e baterias AA; 2:00–4:30 E09/E16 criam prioridade de alvos; 4:30–6:40 escolta curta de transporte aliado em faixa separada, 3 resgates; 6:40–8:50 Colosso Âmbar. **Particularidade:** ensina que destruir módulos de chefe remove ataques. **Recompensa:** Titã + chave Farol A. **Cutscene de ato:** Ícaro observa pulsos no céu: “Não é o clima. Alguém está segurando o céu fechado.”

### M06 — MAR PROFUNDO
**Cena:** ilhas, tempestade distante, frota inimiga sobre água azul-turquesa. **Sequência:** 0:00–2:20 E11 e E01; 2:20–4:50 E12/E07 em ilhotas; 4:50–6:25 2 resgates em boias/embarcações; 6:25–8:15 Leviatã Azul. **Particularidade:** espuma e reflexo por shaders econômicos; navios têm hitboxes 2D. **História:** a frota bloqueia os suprimentos para Asterion.

### M07 — MINAS DE ÍON
**Cena:** refinarias no deserto, cabos azuis e canos elevados. **Sequência:** 0:00–2:00 E05/E13; 2:00–4:30 E17/E08 e áreas com telegráfico elétrico; 4:30–6:30 3 operários para resgatar; 6:30–8:45 Escavador Zero. **Particularidade:** torres EMP param **especial**, nunca o comando de movimentação ou pause. **História:** Suri obtém configuração da rede climática.

### M08 — SILÊNCIO DE VIDRO
**Cena:** montanhas de obsidiana, noite, holofotes e reflexos falsos controlados. **Sequência:** 0:00–2:20 E14 com indicador de surgimento; 2:20–5:10 E03/E09 e drones de engano; 5:10–7:05 2 resgates em base encoberta; 7:05–9:00 Fantasma-9. **Particularidade:** clones do chefe **não** causam contato nem recebem tiros como alvo principal; uma borda dupla revela o real. **Recompensa:** Espectro. **História:** “Voss ainda está transmitindo.”

### M09 — BAÍA ABISSAL
**Cena:** mar noturno iluminado por relâmpagos, plataformas flutuantes. **Sequência:** 0:00–2:20 E11/E12; 2:20–5:20 E16/E18, minas em corredores; 5:20–7:10 3 resgates em balsas; 7:10–9:10 Tridente. **Particularidade:** chefe emerge em animação sem dano até estar visível, então inicia ataque. **Recompensa:** chave Farol B.

### M10 — O RESGATE DE VOSS
**Cena:** pista militar enorme com hangares 3D, cargueiros em voo. **Sequência:** 0:00–2:30 bloqueio de pistas E06/E10; 2:30–5:00 3 terminais opcionais desarmados por dano a torres, não minigame parado; 5:00–7:20 proteger ônibus aéreo aliado, com HP separado e rota garantida; 7:20–10:00 Atlas Negro. **Particularidade:** falha da escolta opcional remove bônus e ativa diálogo alternativo, **sem tornar fase impossível**. **Cutscene:** Voss é evacuado; revela localização da NÓX. **Ato II concluído.**

### M11 — OLHO DO FURACÃO
**Cena:** nuvens volumétricas falsas, anéis elétricos na periferia e ruínas no solo. **Sequência:** 0:00–2:00 E03/E14; 2:00–4:40 E13/E17; 4:40–7:00 corredores de raio e 2 resgates em posto suspenso; 7:00–9:30 Juiz da Tempestade. **Particularidade:** alternância de postura ajuda, mas sempre há ao menos 1 rota possível na postura atual durante o cooldown. **Recompensa:** Maré.

### M12 — O TRIO DA COROA
**Cena:** mar de nuvens púrpura, plataformas de antenas. **Sequência:** 0:00–3:00 interceptadores sincronizados; 3:00–5:40 E16/E18; 5:40–7:10 resgates em cargueiro perdido; 7:10–10:00 Cerberus. **Particularidade:** até três subchefes, mas só um padrão letal grande simultâneo no Normal. **Recompensa:** chave Farol C; **cena** de alinhamento das três chaves.

### M13 — MURALHA ORBITAL
**Cena:** horizonte curvado estilizado, módulos e detritos orbitais sem realismo físico. **Sequência:** 0:00–3:00 E15/E14; 3:00–6:50 nodos defensivos que orbitam em XY, passagem por plataforma; 6:50–8:20 trecho de alta intensidade; 8:20–10:45 Coroa de Aço. **Particularidade:** plataformas decorativas não colidem com o jogador. **História:** o escudo da estação cai e a Aurora avança.

### M14 — ÚLTIMO INTERCEPTADOR
**Cena:** faixa da atmosfera ao nascer do sol; navegação por corredores de destroços. **Sequência:** 0:00–3:00 E04/E18; 3:00–6:20 três elitos separados por repouso; 6:20–8:10 depoimento final de Voss em rádio; 8:10–10:45 Arconte Solar. **Particularidade:** combate mais preciso, menos balas, maior leitura de dash. **Recompensa:** Solaris e acesso ao núcleo.

### M15 — ECLIPSE ARTIFICIAL
**Cena:** entrada na megamáquina, túneis amplos sem obstrução, câmara central brilhante. **Sequência:** 0:00–2:30 recap de inimigos e elites; 2:30–5:30 corredores do núcleo e defesa AA; 5:30–7:30 área breve de recuperação, última conversa; 7:30–12:30/14:00 NÓX Eclipse. **Objetivo principal:** desativar núcleo NÓX; bônus: salvar técnicos retidos, destruir emissores opcionais, sofrer até X dano. **Clímax de diálogo:** NÓX: “A ordem exige silêncio.” Lina: “A vida faz barulho.” **Fim:** núcleo desliga, atmosferas se desfazem, amanhecer de Asterion, sequência curta mostrando aliados/civis, **créditos roláveis**, tela “Campanha concluída” e desbloqueio de Novo Jogo+. **Não** gerar tela preta sem saída após chefão.

## 8.4 Medalhas de fase
Por dificuldade, quatro metas: (1) finalizar; (2) destruir ≥85% dos inimigos designados; (3) resgatar todos os civis; (4) não morrer. Um selo de **Ás** opcional por finalizar sem receber dano. Metas de destruição são calculadas sobre spawns **contabilizados e alcançáveis**, não em elementos invisíveis ou inimigos que nascem depois do boss morrer. Para não exigir replay excessivo, acesso a próximas fases depende somente da medalha de conclusão.

## 8.5 Dificuldade
| Parâmetro | Acessível/História | Normal | Veterano | Pesadelo (pós-jogo) |
|---|---:|---:|---:|---:|
| Dano recebido | 0,65x | 1,0x | 1,25x | 1,6x |
| HP inimigo | 0,85x | 1,0x | 1,15x | 1,25x |
| Velocidade balas | 0,85x | 1,0x | 1,10x | 1,20x |
| Checkpoint meio de fase | sim | opcional | não | não |
| Intensidade de padrões | baixa | referência | +1 subonda segura | +2 subondas seguras |
| Sucata base | 1,0x | 1,0x | 1,2x | 1,4x |

Importante: **Nenhuma dificuldade altera o tamanho da hitbox, remove telegráficos ou cria combinações inevitáveis.** Veterano abre após terminar o Ato I; Pesadelo após a campanha. Jogador pode baixar dificuldade entre missões sem perder progressão.

---

# 9. HANGAR, PROGRESSÃO E ECONOMIA

## 9.1 Moedas sem monetização
- **Sucata:** obtida em missões, usada em upgrades permanentes, módulos e customização.
- **Fragmentos de Farol:** desbloqueios de narrativa e tecnologia, ganhos por capítulos e objetivos específicos, **não compráveis** nem com drop aleatório crítico.
- **Dados de Tecnologia:** recompensas de primeira vitória/objetivos; necessários para desbloquear novas categorias, mas não para progressão mínima da história.
- **Pinturas:** cosméticos por desafios; nunca modificam atributos.

## 9.2 Árvore de upgrades globais
| Upgrade | Níveis | Por nível (proposta) | Benefício total no nível máximo |
|---|---:|---|---|
| Canhão primário | 5 | +10% DPS escalonado | +50% DPS |
| Cadência | 5 | +6% disparos/s escalonado | +30% cadência |
| Blindagem | 5 | +10 HP | +50 HP |
| Motor | 4 | +3% velocidade | +12% velocidade |
| Coletor magnético | 4 | +0,35 un de raio | +1,4 un |
| Capacidade de bomba | 3 | +1 carga por 2 níveis + área | +1 bomba, +20% raio |
| Energia especial | 4 | -5% cooldown / +HP de escudo | -20% cooldown |
| Eficiência de resgate | 3 | -0,15 s de canalização | -0,45 s |

**Custo proposto por nível:** `arredondarParaDez(120 + 80×(nível-1)^1.5) × fatorCategoria`, com `fatorCategoria` entre 0,8 e 1,5. Custos são mostrados antes da confirmação, saldo descontado de forma atômica, sem valores negativos. A camada de dados permite alterar balanceamento sem alterar componentes de tela. Melhorias globais afetam todas as aeronaves; a identidade de cada aeronave continua definida por atributos/passivas próprias.

## 9.3 Módulos (slots)
| Módulo | Tipo | Efeito | Forma de obter |
|---|---|---|---|
| Mira Balística | ofensivo | +8% dano em alvos grandes | início, preço baixo |
| Disparo Duplo | ofensivo | adiciona tiros laterais fracos (30% dano) | missão 02 |
| Penetrador | ofensivo | 20% projéteis atravessam 1 drone leve | missão 05 |
| Rajada Reativa | ofensivo | +12% cadência por 3 s após resgate | missão 07 |
| Regenerador | defensivo | recupera 3 HP a cada 20 s sem dano, teto de 20 HP/fase | missão 04 |
| Placas de Íon | defensivo | reduz primeiro golpe de cada 40 s em 25% | missão 06 |
| Coletor Aurora | utilidade | +15% sucata coletada, sem afetar medalhas | missão 03 |
| Baliza de Resgate | utilidade | revela civis na borda da tela | missão 08 |
| Reator Limpo | utilidade | +10% recuperação de especial | missão 10 |
| Assistente MARA | utilidade | aponta alvo de alto risco, sem auto-mira letal | missão 12 |
| Blindagem de Pulso | defensivo | primeiro EMP recebido é resistido | missão 11 |
| Núcleo Solar | ofensivo | +10% dano na terceira fase de chefe | missão 14 |

Equipamento deve ter limite de 3 slots. Módulos raros não são obtidos por loot box: o usuário sabe como desbloquear cada um. Troca livre entre missões; construção de build não precisa tela complexa.

## 9.4 Economia-alvo e ritmo
- Recompensa garantida de primeira vitória na fase `m`: **300 + 110×(m-1)** sucatas, antes de bônus; replay concede **60%** da base e pickups normais.
- Bônus de resgate completo **+15%** da recompensa da fase, de 85% de eliminação **+10%**, sem dano **+10%**. Bônus não multiplicam entre si; somam.
- Primeiras cinco missões devem financiar **pelo menos 5 compras relevantes** e a habilitação de especiais sem replay obrigatório.
- Metade final da campanha pode exigir **escolher prioridades de upgrade**, mas vencer não pode depender de maximizar canhão/cadência.
- Compra deve indicar valor do atributo antes/depois e exibir prévia visual se muda geometria/efeito.
- Implementar `economy_sim.test.ts` com cenário sem upgrades, upgrades médios e build defensiva; assegurar que o caminho normal não exige farm.

## 9.5 Conquistas (24 no lançamento)
Desafios separados por categorias: primeiros passos (4), sobrevivência (4), resgates (4), precisão (4), coleta (3), chefes (3), conclusão (2). Exemplos: “Primeiras Asas” (M01), “Sem Deixar Ninguém” (todos os resgates de uma missão), “Desarmador” (destruir 3 módulos de chefe em uma luta), “Céu Limpo” (concluir campanha), “Eclipse Desfeito” (finalizar M15). Nenhum exige compras; conquistas funcionam offline. A regra de cada uma usa eventos gerados pelo gameplay, não interpreta textos visuais.

## 9.6 Novo Jogo+
Desbloqueado após M15: reinicia apenas a sequência de mapas/cutscenes da nova jornada, preserva upgrades, aeronaves, cosméticos e medalhas anteriores em separado. Inimigos ganham novas combinações de padrões e +15% HP; não pode sobrescrever a campanha anterior sem confirmação. Novo Jogo+ **não é necessário** para obter créditos finais.

---

# 10. MENUS E INTERFACE COMPLETA

## 10.1 Navegação de ponta a ponta
```text
BOOT / SPLASH
  └─ VERIFICAR PERFIL / SALVAMENTO / CONTROLE
      └─ MENU PRINCIPAL
          ├─ CONTINUAR (última fase acessível)
          ├─ CAMPANHA → MAPA → BRIEFING → HANGAR → MISSÃO → RESULTADOS
          ├─ HANGAR → AERONAVES / MELHORIAS / MÓDULOS / PINTURAS
          ├─ DESAFIOS → SOBREVIVÊNCIA / CHEFE LIVRE / RECORDES LOCAIS
          ├─ COOPERATIVO LOCAL [liberar na v1.1]
          ├─ PERFIL → ESTATÍSTICAS / CONQUISTAS / SALVAMENTOS
          ├─ OPÇÕES → GRÁFICOS / ÁUDIO / CONTROLES / ACESSIBILIDADE / IDIOMA
          ├─ CRÉDITOS
          └─ SAIR [desktop] / INSTALAR APP [quando PWA permitida]
```

## 10.2 Menu principal — composição visual
- **Fundo:** céu em movimento com camadas de nuvens 2D, porto aéreo 3D e aeronave Véspera 3D em primeiro plano (mesh baixo custo). Uma aeronave inimiga atravessa longe ocasionalmente, sem produzir sons repetitivos.
- **Logotipo:** “ASAS DO ECLIPSE”, subtítulo “GUERRA DOS CÉUS”; tipografia militar futurista própria ou livremente licenciada.
- **Lado esquerdo:** botões **Continuar**, **Campanha**, **Hangar**, **Desafios**, **Opções**, **Créditos**; o botão selecionado tem contorno âmbar com navegação clara por teclado/controle.
- **Canto inferior:** versão, status de save (“Salvo localmente”), controles detectados e opção PWA quando disponível.
- **Canto direito:** nave 3D no hangar, giro leve 8–12° em idle, luzes piscam em intervalos **não sonoros**, partículas sutis.
- **Áudio:** tema de menu com início/fim definidos; SFX apenas nas ações reais, sem reexecutar som de motor ao redesenhar a tela.

## 10.3 Mapa de campanha
Mostrar três setores, nós com estados (bloqueado/disponível/concluído/masterizado), dados da missão em painel lateral, melhor nota, dificuldade, recomendação de nave, resgates e boss silhouette. **Selecionar** abre briefing, não inicia fase imediatamente. Exibir progresso **X/15**, % da campanha e progresso de medalhas separados para não confundir.

## 10.4 Briefing pré-missão
Título, arte/parallax do bioma, mini descrição narrativa de até 3 linhas, inimigos estimados, boss, riscos, resgates, objetivos, ícones dos 3 slots, nave selecionada e botões **Iniciar**, **Preparar Aeronave**, **Voltar**. Uma introdução de rádio pode tocar em 3–8 s e deve ser pulável; ao pular, nunca ficar com input travado.

## 10.5 Hangar com nave 3D
Layout em três regiões: lista lateral das seis naves; centro com modelo girável (mouse/controle) e detalhes/peças; lado direito com estatísticas, upgrades e slots. Tabulação entre **Aeronaves**, **Melhorias**, **Arsenal**, **Módulos**, **Pinturas**. Antes de comprar: saldo atual, preço, nível atual e novo, alteração de estatísticas, visual do item e confirmação. Botão **Equipar** não compra item. Não permitir comprar o nível máximo.

## 10.6 HUD de gameplay
- **Topo esquerdo:** barra HP, valor atual/máximo, até 3 ícones de efeito ativo.
- **Topo centro:** pontuação, combo e nome da missão discretamente.
- **Topo direito:** pausa, civis resgatados X/Y, porcentagem de inimigos elegíveis destruídos.
- **Base esquerda:** bomba/quantidade e postura Rasante/Alta.
- **Base direita:** ícone do especial + cooldown/cargas; indicador EMP quando ativo.
- **Chefes:** barra de HP grande no topo com nome, subcomponentes como segmentos menores, indicadores de fase 1/2/3.
- **Móvel:** botões grandes e com margem segura; HUD evita cobrir centro do campo. O jogador pode mudar escala entre 80–125%.
- **Mensagens:** “RESGATE CONCLUÍDO”, “TORRE DESTRUIDA”, “CANHÃO CARREGADO” por no máximo 2 s sem bloquear.

## 10.7 Pause funcional
Abre por **Esc/Start/ícone** e pausa simulação de gameplay, IA, padrões, pickups, timers de resgate e dano. Música abaixa volume; não avança ondas. Botões **Continuar**, **Reiniciar missão**, **Controles**, **Opções**, **Voltar ao Hangar**, **Sair para o Menu**. Reiniciar/sair pedem confirmação se houver perda de progresso da tentativa. Ao fechar pause, contagem opcional 3-2-1; nenhuma chamada de evento duplicada. **Ler documento, pegar recompensa e fechar pop-up não devem disparar pause**: sistema modal independente com pilha de overlays.

## 10.8 Resultado da missão
Animação curta (≤5 s e pulável), nota, itens ganhos, medalhas com critérios exatos, taxa de acerto, dano, resgates, inimigos abatidos e tempo. Botões **Próxima Fase**, **Repetir**, **Hangar**, **Mapa**. Salvar antes de permitir navegar; se IndexedDB falhar, avisar claramente e oferecer exportar backup. Em morte, apresentar “Derrubado por: [ameaça]” com dica contextual, sem culpar o jogador.

## 10.9 Opções completas
| Categoria | Ajustes |
|---|---|
| Vídeo | qualidade Automática/Baixa/Média/Alta; resolução interna; FPS alvo 30/60; limitar DPR; sombras; partículas; brilho; pós-processamento; movimento de câmera; tremor; tela cheia |
| Áudio | volume Mestre/Música/Efeitos/Voz/Ambiente; silenciar em segundo plano; legendas de rádio; teste de canais; opção estéreo/mono |
| Controles | mapa teclado; sensibilidade; auto-fire; mouse direto/relativo; dead zone; vibração; prompts Xbox/PlayStation/genérico; tamanho dos botões touch |
| Jogabilidade | mostrar hitbox; ajuda contextual; inversão; confirmação de compras; posição de HUD; reduzir distração visual |
| Acessibilidade | contraste alto para balas; paletas daltônicas; reduzir flashes; reduzir shake; textos maiores; alertas auditivos com ícones; legendas |
| Idioma | PT-BR padrão, fallback EN quando disponível |
| Dados | exportar/importar save JSON versionado, restaurar backup, apagar progresso com dupla confirmação |

## 10.10 Transições e telas especiais
- **Splash:** logo curto, pular possível após inicialização; não aguardar rede externa.
- **Carregamento:** tela de briefing + progresso real de assets, sem spinner falso se falhou.
- **Sem WebGL/sem espaço:** mensagem clara, sugestão de reduzir qualidade/abrir em navegador compatível.
- **Instalação PWA:** apresentar somente quando navegador oferecer evento de instalação e quando o jogo puder funcionar offline; não prometer instalação de APK nativo.
- **Créditos:** fundo de hangar pós-guerra, nave lentamente sobrevoando, rolagem legível com opção acelerar/pular e voltar ao menu; incluir artistas, compositores, software, bibliotecas e licenças.
- **Fim verdadeiro:** “O CÉU ESTÁ LIVRE” + imagem panorâmica + estatísticas de campanha + botão de revisitar, Novo Jogo+ e créditos.

---
# 11. CENÁRIOS, CAMADAS 2D + 3D E CÂMERA

## 11.1 Regra fundamental do 2.5D
**Física e jogabilidade 2D; apresentação visual 3D.** O terreno, a água, torres, barcos, aeronaves e chefes podem ser malhas 3D, mas cada alvo possui hitbox plana XY independente da geometria. O mundo rola pela câmera/scroller vertical; o movimento visual do solo não altera a posição lógica do jogador. Essa separação reduz bugs, custo de CPU e colisões injustas.

**Camadas de desenho, da parte mais profunda à mais próxima:**
1. `background_far`: gradiente do céu, nuvens distantes, horizonte de efeito.
2. `terrain_3d`: tile/mesh de solo ou água, estradas, ilhas, prédios (não bloqueiam tiro).
3. `ground_targets`: tanques, torres, navios, balizas, civis.
4. `shadows`: sombras estilizadas dos objetos aéreos no piso/água.
5. `air_targets`: inimigos, player, escolta, boss, semitransparências limitadas.
6. `projectiles`: balas inimigas/jogador; ordenar priorizando clareza, sem esconder inimigas.
7. `vfx_safe`: rastros, faíscas, explosões e alertas de gameplay.
8. `ui`: canvas HTML/CSS ou overlay dedicado acessível, sempre independente da escala do mundo.

## 11.2 Mistura recomendada
| Elemento | Técnica | Motivo |
|---|---|---|
| Player / inimigos / chefes | modelos GLB/glTF low/mid-poly, materiais PBR simplificados | silhueta, iluminação e animação convincentes |
| Chão e estruturas | módulos 3D repetíveis com instancing | profundidade com poucas chamadas GPU |
| Água | plano 3D e shader leve de ondas + textura normal | aparência sem simulação hídrica |
| Nuvens | sprites 2D com parallax, poucos volumes falsos | leveza |
| Explosões | atlas WebP 2D em billboards + fragmentos low-poly | impacto com orçamento controlado |
| Fumaça / rastros | quads de GPU ou pool de sprites | evitar milhares de objetos JS |
| Balas / lasers | instanced meshes ou quads especializados | clareza, milhares de updates previsíveis |
| Luzes | luz ambiente + 1 direcional + emissivos falsos | evitar sombras dinâmicas caras |
| HUD / menus | HTML/CSS, textos acessíveis | nitidez e adaptação celular |

## 11.3 Destruição visual por partes
Quando um alvo possui subcomponentes, a sequência de morte dispara na ordem: `hp <= 0` → bloquear novo dano → desligar armas → iniciar explosões locais → destacar peças físicas falsas (trajetórias pré-calculadas, sem motor rigid body) → ocultar mesh de casco → soltar recompensas → remover entidade. Objetos de cenário podem ter 2–3 estágios visuais (intacto, avariado, destruído) e **não** exigem destruição total em tempo real. As crateras são decalques com número máximo simultâneo; nunca prejudicam leitura de balas.

## 11.4 Mapa contínuo e streaming
- Separar uma fase em **trechos de 20–40 s**, cada um com pacote de geometria, triggers, ondas, música e VFX.
- Pré-carregar o próximo trecho durante o anterior; manter trecho atual + próximo + efeitos residuais; desalocar trechos antigos após margens.
- O scroll não deve depender de `requestAnimationFrame` isolado: `scrollDistance += speed*fixedDt`; triggers ativados por distância/evento.
- Resgate e boss não podem aparecer antes de assets críticos estarem prontos. Em falha de rede, mostrar erro e permitir tentar carregar novamente, sem iniciar invisível.
- Travar transição de boss somente por um intervalo cinematográfico curto e explícito, sem tela congelada inesperada.
- Renderizar unidades distantes com LOD e impostors; evitar dezenas de skinned meshes simultâneas.

## 11.5 Orientação de tela
**PC:** área de jogo vertical central em janela widescreen; nas laterais, painel gráfico/cenário passivo e dados opcionais. Nunca esticar jogo para preencher 16:9. **Celular:** retrato é orientação preferida, com UI adaptada; em paisagem, jogo em coluna central e controles nas margens. Cálculo de câmera usa unidades lógicas fixas, ajustando crop/letterbox de modo documentado. Limites de player se baseiam no retângulo lógico visível, não na largura da janela externa.

## 11.6 Efeitos climáticos
Chuva estilizada 2D, partículas de vento, relâmpago distante, reflexos controlados, neblina e poeira. Em modo Reduzir flashes: sem flashes brancos de tela; relâmpagos apenas gradiente breve. Nunca obscurecer corredores seguros. Tempestades não alteram a jogabilidade secretamente; toda regra mecânica tem indicador próprio.

---

# 12. ANIMAÇÃO, ARTES E ASSETS

## 12.1 Guia de modelagem
- Aeronaves jogáveis: **5 mil a 12 mil triângulos** por nave no LOD0; LOD1 entre 2–4 mil. Chefe grande: 15–35 mil triângulos distribuídos em peças (alvo inicial; validar por equipamento).
- Inimigos comuns: 400–2.500 triângulos, preferir malha estática e animações de transform quando possível.
- Resgates: personagens simplificados ou cápsulas com animação de sinalização, 300–1.000 triângulos.
- Pivôs explícitos de canhão, asa, hélice, emissor e explosão; nomes padronizados no GLB.
- Posição **frontal da nave aponta para +Y lógico**; pivôs locais e orientação transformados por adaptador quando exportação usa convenção diferente. Todos os assets são testados em cena própria para evitar nave andando ou atirando para trás.
- Escala padrão: player fuselagem ~2,2 unidades de comprimento visual, hitbox 0,33; boss 5–9 unidades; civis 0,6–0,9. A dimensão visual pode ultrapassar hitbox, mas nunca surpreender no dano.
- Texturas em WebP/KTX2 quando viável, atlas 1K/2K por família, normal maps apenas onde agregam.

## 12.2 Inventário mínimo de arte do jogo base
| Categoria | Quantidade-alvo | Variantes / observações |
|---|---:|---|
| Naves jogáveis | 6 | casco com 4 pinturas, peças reativas, LOD |
| Inimigos comuns | 18 famílias | até 2–3 skins de ato, materiais compartilhados |
| Chefes | 15 | 3 fases de avaria, subcomponentes, silhueta única |
| Biomas | 9 kits | vale/cânion/montanha/costa/cidade/mar/deserto/noite/estratosfera |
| Componentes de cenário | ~75 reutilizáveis | prédios, docas, pontes, navios, torres, rochas, antenas |
| Pickups e marcadores | 12 ícones/meshes | silhueta e animação distintos |
| VFX | ~35 atlases/emitters | 6 explosões, 6 impactos, 5 rastros, 8 alertas, outros |
| Telas e fundos de UI | ~20 composições | menus, briefings, resultados, fim |
| Ilustrações de narrativa | 9 | retratos, mapas, transmissões, epílogo |

Quantidades são metas de escopo; o MVP deve usar placeholders de arte e validar gameplay antes de produzir todas as variações.

## 12.3 Pipeline de asset
1. Criar silhueta e referência visual original (concept).
2. Modelar baixo custo e aplicar materiais.
3. Definir pivôs, pontos fracos e colisão 2D em arquivo de dados.
4. Exportar `.glb` com escala testada; não embutir texturas enormes desnecessárias.
5. Executar otimização sem destruir normals/UV; gerar LOD.
6. Gerar thumbnails para hangar e briefing, WebP comprimido.
7. Rodar script de auditoria de triângulos, materiais, texturas, animações e bounding box.
8. Testar no navegador em PC e celular; somente então substituir placeholder de produção.

## 12.4 Regras de propriedade intelectual
Todo personagem, símbolo, aeronave, chefe, trilha, UI e nome de produto é original ou utiliza recurso com licença verificada. Não reutilizar capturas, texturas, músicas, layouts exatos, logotipos nem modelos de Sky Force Reloaded. Imagens de referência servem para **analisar qualidade e gênero**, não para distribuir no jogo. Guardar manifesto `ASSET_LICENSES.md` com fonte, licença, autor e alterações de cada recurso externo.

---

# 13. TRILHA SONORA ORIGINAL, SFX E VOZES

## 13.1 Linguagem musical
Trilha original com sintetizadores cinemáticos, percussão eletrônica e timbres metálicos, 105–150 BPM nas missões; tema de hangar mais contido; boss com baixo pulsante e ostinato. Evitar loops de poucos segundos extremamente repetitivos. Preferir arquivos compostos/gravados **não procedurais**: `.ogg` ou `.opus` com música original licenciada, transições sem clique e ponto de loop marcado. Áudio procedural pode ser protótipo, não entrega final.

## 13.2 Plano de faixas
| ID | Faixa | Onde toca | Sensação |
|---|---|---|---|
| OST-01 | Horizonte Recuperado | menu principal | esperança e escala |
| OST-02 | Asas em Manutenção | hangar | tecnologia e repouso |
| OST-03 | O Mapa Rasgado | mapa/briefing | tensão estratégica |
| OST-04 | Primeira Faísca | M01–02 | estreia energética |
| OST-05 | Ventos de Arkan | M03–04 | aventura aérea |
| OST-06 | Nuvens de Aço | M05 | ameaça de ato |
| OST-07 | Correntes Profundas | M06 | navegação marítima |
| OST-08 | Metal no Deserto | M07 | indústria mecânica |
| OST-09 | Sombra de Vidro | M08 | furtividade |
| OST-10 | Luz sob as Ondas | M09 | mistério do mar |
| OST-11 | O Retorno de Voss | M10 | resgate heroico |
| OST-12 | Pulso Atmosférico | M11–12 | choque do clima |
| OST-13 | Acima do Mundo | M13 | altitude e urgência |
| OST-14 | Último Guerreiro | M14 | duelo dramático |
| OST-15 | Eclipse Artificial | M15 pré-boss | núcleo e suspense |
| OST-16 | Ferro e Fogo | chefes M01–05 | perigo mecânico |
| OST-17 | Colossos de NÓX | chefes M06–10 | guerra industrial |
| OST-18 | Ponto Sem Retorno | chefes M11–14 | clímax |
| OST-19 | Silêncio da Máquina | chefe final M15 | 3 seções alinhadas às fases |
| OST-20 | O Céu Está Livre | epílogo/créditos | resolução temática |
| OST-21 | Não Desista | derrota/resultados | reflexão breve |

**Mistura:** volume música abaixa -3 a -6 dB durante fala crítica; efeito de dano do player e aviso de laser tem prioridade; atenuação por categoria, não dezenas de fontes altas. Preload de trechos necessários antes da fase; transmitir faixas por segmentos locais quando conveniente, sem depender de API online.

## 13.3 Catálogo de efeitos indispensáveis
Motor em idle com **loop curto perfeitamente costurado, iniciado uma vez por entidade e parado no dispose**, aceleração, tiros primários (3 variações), laser carregando/disparando/terminando, bomba, impacto metal/escudo, explosão pequena/média/grande, coleta de sucata, resgate iniciando/concluído/falha, dano e baixa vida, troca de postura, HUD confirmação/erro, nave selecionada, chefe alerta, módulo destruído, ponte de cenário desabando, vitória, derrota, feedback de upgrade, pausa/despausa, fim do jogo. **Nunca** disparar um SFX contínuo a cada frame ou a cada render do menu.

## 13.4 Gerenciador de áudio
- Criar `AudioManager` único, usando Web Audio API, com buses Master/Music/SFX/Voice/Ambience.
- `playOneShot(id, volume, cooldownMs)` impede empilhamento excessivo de tiros/explosões.
- `startLoop(instanceId, soundId)` é idempotente; `stopLoop(instanceId, fade)` limpa fonte.
- Música troca com crossfade 0,5–1,5 s; ao pausar, duck/fade sem relançar sample.
- Navegador exige primeira interação para `resume()` do AudioContext; exibir botão de ativação sonora, nunca falhar silenciosamente.
- Ao trocar fase ou voltar ao menu, desmontar todos os loops da fase anterior. Teste obrigatório de **motor que não fica ligando repetidamente**.
- Vozes originais podem ser gravadas em PT-BR; em ausência de locução, legendas de rádio completas e retratos animados de modo simples.

---

# 14. ARQUITETURA TÉCNICA

## 14.1 Stack recomendada
**Vite + TypeScript** para build, **Three.js** para render 2.5D, **HTML/CSS** para interface, **Web Audio API** para som, **IndexedDB** para saves grandes/backup (localStorage apenas fallback de poucas preferências), **Service Worker/Workbox** para PWA offline após cache. Testes: **Vitest** para regras e **Playwright** para browser/e2e; scripts de inspeção GLB e orçamento com ferramentas apropriadas. Não colocar todo código em `index.html` nem comprimir o projeto prematuramente em um JS impossível de manter.

## 14.2 Organização proposta de pastas
```text
asas-do-eclipse/
├── public/
│   ├── icons/manifest-icons/
│   ├── assets/
│   │   ├── ships/ bosses/ enemies/ terrain/
│   │   ├── vfx/ ui/ portraits/
│   │   └── audio/music/ sfx/ voice/
│   └── manifest.webmanifest
├── src/
│   ├── app/main.ts
│   ├── core/Clock.ts
│   ├── core/GameState.ts
│   ├── core/EventBus.ts
│   ├── core/ResourceRegistry.ts
│   ├── core/SeededRng.ts
│   ├── gameplay/World.ts
│   ├── gameplay/EntityPool.ts
│   ├── gameplay/Collision2D.ts
│   ├── gameplay/PlayerController.ts
│   ├── gameplay/ProjectileSystem.ts
│   ├── gameplay/EnemyDirector.ts
│   ├── gameplay/BossController.ts
│   ├── gameplay/RescueSystem.ts
│   ├── gameplay/RewardSystem.ts
│   ├── gameplay/DamageSystem.ts
│   ├── gameplay/AltitudeSystem.ts
│   ├── render/Renderer.ts
│   ├── render/SceneStreamer.ts
│   ├── render/EffectsPool.ts
│   ├── render/CameraRig.ts
│   ├── data/ships.ts  enemies.ts  bosses.ts
│   ├── data/stages/  upgrades.ts  localization/
│   ├── audio/AudioManager.ts
│   ├── input/InputRouter.ts  Gamepad.ts  Touch.ts
│   ├── ui/screens/  ui/components/  ui/styles/
│   ├── persistence/SaveStore.ts  SaveMigrations.ts
│   ├── pwa/install.ts  offline.ts
│   ├── telemetry/DebugOverlay.ts
│   └── tests/
├── tools/asset-audit.mjs
├── e2e/
├── docs/GDD.md  TECH_SPEC.md  QA_MATRIX.md
├── .github/workflows/ci.yml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## 14.3 Separação das responsabilidades
- `World`: proprietário do estado lógico e da ordem de sistemas; evita acesso direto da UI às entidades.
- `Clock`: tempo fixo, pausa e interpolação. O tempo pausado não avança gameplay nem áudio de evento.
- `EnemyDirector`: carrega timelines de missão data-driven e respeita limites de densidade.
- `BossController`: finite-state-machine por chefe, transição por eventos e pontos fracos.
- `Collision2D`: consulta espacial e resposta a colisões; não consulta scene graph.
- `Renderer`: só desenha snapshots; pode reduzir qualidade sem afetar física/IA.
- `ResourceRegistry`: carrega, compartilha e descarrega modelos/texturas/áudio; conta referências de assets.
- `InputRouter`: produz comandos únicos por jogador, normaliza teclado/gamepad/touch.
- `SaveStore`: camada transacional versionada; nunca tenta salvar referências de objetos Three.js.

## 14.4 Ciclo determinístico da simulação
```ts
const FIXED_DT = 1 / 60;
let accumulator = 0;

function frame(realDeltaSeconds: number) {
  const delta = Math.min(realDeltaSeconds, 0.1);
  if (!game.paused) accumulator += delta;
  while (!game.paused && accumulator >= FIXED_DT) {
    input.sampleForTick();
    world.tick(FIXED_DT);  // diretor → IA → player → projéteis → colisões → dano → eventos
    accumulator -= FIXED_DT;
  }
  renderer.render(world.snapshot(), game.paused ? 0 : accumulator / FIXED_DT);
}
```
Usar objeto de estado persistente para `accumulator`, resetá-lo explicitamente na troca de sessão e retorno da aba após grande pausa, e limitar catch-up; exemplo demonstra a política, não é código pronto de produção.

## 14.5 Exemplo de dado da fase (esquema ilustrativo)
```json
{
  "id": "M01",
  "titleKey": "stage.m01.title",
  "biome": "valley_ruins",
  "scrollSpeed": 2.2,
  "durationTargetSeconds": 410,
  "boss": "BOSS_GARGOYLE_01",
  "waves": [
    {"atSeconds": 20, "pattern": "V_BASIC", "enemy": "E01", "count": 5},
    {"atSeconds": 95, "pattern": "GROUND_PAIR", "enemy": "E05", "count": 2},
    {"atSeconds": 210, "pattern": "LASER_TEACH", "enemy": "E06", "count": 1}
  ],
  "rescues": [{"atSeconds": 140, "laneX": -3.2}, {"atSeconds": 185, "laneX": 3.0}, {"atSeconds": 265, "laneX": 0.0}],
  "bossEntryAtSeconds": 340,
  "clearRequires": ["BOSS_DEFEATED"]
}
```
Na produção, `atSeconds`/scroll são referências coerentes controladas pela mesma timeline. O JSON passa por validação de schema, IDs existentes e cálculo de tempo mínimo; o boss não aparece antes da onda crítica/último resgate terminar. O resultado usa eventos, não comparação frágil de string em texto de UI.

## 14.6 Estado de boss (esquema)
```json
{
  "id": "BOSS_GARGOYLE_01",
  "health": 600,
  "parts": [{"id": "left_turret", "health": 200}, {"id": "right_turret", "health": 200}],
  "phases": [
    {"id": "P1", "untilHealthRatio": 0.65, "patternIds": ["SPREAD_3"]},
    {"id": "P2", "untilHealthRatio": 0.30, "patternIds": ["SPREAD_3", "SIDE_AA"]},
    {"id": "P3", "untilHealthRatio": 0, "patternIds": ["CORE_LASER", "SIDE_AA"]}
  ]
}
```
**Observação:** a soma de HP e regras de dano das partes deve ser explicitamente definida na implementação: módulos têm HP próprio e dano ao núcleo não deve ser contado duas vezes. As transições são por HP do núcleo e destruição de submódulos, com prioridade testável.

## 14.7 Regras do ciclo de vida
- `menu` cria cena/áudio do menu uma vez; ao sair, desaloca loops e handlers registrados.
- `gameplay` cria nova sessão com ID, sem reutilizar timers/flags de sessão anterior.
- `pause` impede tick e disparo involuntário; `modal` interrompe inputs específicos sem ser tratado como pause universal.
- `scene reload` limpa balas, inimigos, pools, overlays e state de resgate por ID de sessão.
- Em todos os transitions, registrar `onEnter/onExit` para ser possível auditar duplicações.
- Erro de variável não definida deve falhar testes de TypeScript/ESLint antes do deploy. Evitar globais implícitas e callbacks espalhados.

## 14.8 Save e proteção contra corrupção
Modelo mínimo: `schemaVersion`, `profileId`, `settings`, `campaign{unlockedStage, cleared, bestScores, medals}`, `economy{scrap, techData}`, `hangar{ownedShips, globalUpgrades, ownedModules, loadouts, paint}`, `stats`, `achievements`, `newGamePlus`. Gravar a versão nova em slot temporário, validar, só então promover a primária. Backup anterior retido. Ao migrar, preservar desbloqueios; ao encontrar item desconhecido, ignorar sem crash. Save exportado é texto/arquivo JSON com checksum para detectar corrupção acidental (não é proteção anticheat). Reinício não deve apagar perfil.

## 14.9 PWA, navegação offline e GitHub Pages
- Configurar `base` do Vite para `/<nome-do-repositorio>/` em produção; usar URLs relativas a `import.meta.env.BASE_URL`, não `/assets` absoluto no Pages.
- `manifest.webmanifest` com `start_url`/`scope` sob o subcaminho do repositório, display standalone e ícones adequados.
- Service worker faz **precaching de app shell** e cache dos pacotes de missão baixados; exibe quais níveis já estão disponíveis offline; disponibilizar “Baixar campanha offline” quando houver armazenamento.
- Nunca assumir cache infinito: `navigator.storage.estimate()` e tratamento de quota. Baixar por capítulos sob demanda, com opção de limpar cache de mídia sem perder saves.
- Publicação via GitHub Actions: install → lint → typecheck → tests → build → Playwright smoke → upload `dist` → deploy Pages; nunca usar a pasta `src` diretamente como site publicado.
- Validar navegação profunda, atualização do PWA, reload offline e volta à tela após o jogo ser colocado em segundo plano.
- Toda dependência externa de fontes/áudio deve ter alternativa local para o modo offline.

## 14.10 Caminho para Windows nativo
**Um app Web empacotado com Electron/Tauri não vira automaticamente um jogo de renderização nativa.** Para EXE realmente nativo, separar a lógica de gameplay e definições de conteúdo em formatos portáveis, criando depois uma implementação de engine/render nativa (por exemplo Godot, C++/SDL3 + renderer, ou outro motor selecionado). Definir interface de gameplay independente de DOM/Three para facilitar migração; usar fixtures e testes de dano/colisão para verificar paridade. Escolher porte nativo após a versão web fechar campanha, evitando desenvolver dois motores incompletos simultaneamente.

---

# 15. PERFORMANCE E OTIMIZAÇÃO — CRITÉRIOS MENSURÁVEIS

## 15.1 Metas por perfil
| Métrica | Desktop médio | Celular intermediário | Celular entrada |
|---|---|---|---|
| FPS alvo | 60 | 30 ou 60 em modo leve | 30 |
| Resolução interna | até 1080p | 720p adaptável | 540p–720p |
| DPR | 1–1,5 (auto) | 0,75–1,25 | 0,75–1 |
| Draw calls alvo | <=140 | <=90 | <=65 |
| Balas ativas alvo | <=300 | <=160 | <=120 |
| Partículas simultâneas | <=1400 | <=500 | <=250 |
| Materiais transparentes grandes | mínimo | reduzido | muito reduzido |
| Efeito pós-processado | opcional | off por padrão | off |
| Sombras dinâmicas | menu/alta pontual | off | off |

Estes são **orçamentos de projeto**, não resultados medidos. Se boss precisar maior densidade de balas, reduzir emissões decorativas, nunca truncar balas perigosas silenciosamente por cap de desempenho.

## 15.2 Regras de implementação leve
1. Pool de projéteis, inimigos de frequência alta, explosões e pickups (evitar alocação/desalocação por frame).
2. Instancing de alvos repetidos e efeitos; atlas sprites para explosões.
3. Pré-compilar shaders antes da fase; aquecer os materiais críticos na tela de carregamento.
4. Material compartilhado por família; limitar transparência sobreposta e overdraw.
5. Culling em área ampliada; desativar IA fora da área ativa.
6. Atualização da lógica a 60 Hz fixos; atualizar animações puramente decorativas a 30 Hz se necessário.
7. Desativar bloom, SSAO, SSR, sombras dinâmicas e partículas volumétricas em baixo/móvel; simular reflexo com textura.
8. Compressão GLB, textura WebP/KTX2, áudio Ogg/Opus; carregamento modular por capítulo.
9. Auditar listeners/timers ao trocar cena; liberar `geometry`, `material`, `texture`, `AudioNode` não compartilhados.
10. Contador de VRAM, RAM, draw calls e entidades em debug; perfil e limite visíveis em relatório de QA.

## 15.3 Orçamento de tamanho
Meta preliminar: **app shell ≤12 MB de transferência inicial**, assets de cada fase preferencialmente ≤8–12 MB, reutilização de kits para manter pacote completo **idealmente ≤120 MB** antes de cache/instalação. São tetos de design sujeitos a auditoria de áudio e texturas, não garantias. Pré-carregar menu + M01 antes de abrir o jogo; capítulos seguintes podem baixar separadamente.

## 15.4 Ajuste adaptativo sem alterar justiça
Medir mediana de frametime por janela de 5 s; se cair abaixo do alvo por 10 s, reduzir apenas DPR, sombras, partículas, decals e pós-processamento, com histerese para não oscilar. Nunca cortar CPU tick, aumentar velocidade do jogo por fps, reduzir quantidade de projéteis perigosos de uma maneira que invalide medalhas, nem mudar hitbox. Permitir bloquear qualidade manual.

---
# 16. COOPERATIVO LOCAL (MARCO v1.1, ARQUITETURA DESDE v1.0)

## 16.1 Objetivo
Dois jogadores no **mesmo campo vertical** e mesma câmera. Cada um escolhe uma aeronave distinta ou igual, com equipamentos próprios e HP individual. Jogador 2 entra na tela de briefing, não durante cutscene. Suporte teclado + gamepad ou 2 gamepads; touch cooperativo não é prioridade inicial por espaço insuficiente.

## 16.2 Regras
- Progresso da história e medalhas vão para o perfil host; registro auxiliar opcional do convidado.
- Recompensa de sucata de missão é compartilhada para o perfil host, sem duplicação explorável.
- Chefes: HP ×1,50; número de balas **não** dobra; adicionar ataque dirigido ao jogador distante com aviso.
- Resgates: qualquer jogador pode canalizar, não somar 2× velocidade; visual mostra qual iniciou.
- Jogador abatido: nave vira destroço não letal, pode ser reanimada pelo aliado ao permanecer 3 s perto, uma vez por fase; após a reanimação, recebe 35% HP. Se ambos caírem, derrota.
- Câmera: limitação suave de distância e seta de aviso na borda; se um jogador ficar fora da área, teleporte seguro para posição lateral somente em condição especial sem projétil perto, acompanhado de aviso; preferir elasticidade de limite.
- **Nada de fogo amigo** no modo padrão. Opção avançada pode existir depois, mas não é necessária.

## 16.3 Critérios de aceite
Ambos os inputs independentes; pause único; UI de P1/P2 legível; ambos escolhem especiais; desconectar um controle pausa com diálogo sem corromper sessão; morte simultânea finaliza corretamente; salvar medalhas apenas uma vez; performance de dupla a 30/60 fps.

---

# 17. EVENTOS, DESAFIOS E REJOGABILIDADE

## 17.1 Modos
- **Campanha:** narrativa 15 fases e progressão completa.
- **Sobrevivência:** arena composta por blocos de terreno e ondas escalonadas, runs de 8–20 min, chefe a cada 5 ondas, sem drop aleatório que invalide recordes; score local.
- **Chefe Livre:** desbloqueia bosses vencidos; escolha de dificuldade/build para treino. Vitória nele não concede chave de história; recompensas menores para não substituir a campanha.
- **Desafio do Dia offline:** semente local definida por data com regras explícitas, funciona sem servidor; como não há validação online, recordes são **locais**, não ranking competitivo global confiável.
- **Desafios permanentes:** terminar missão com nave específica, resgatar todos, destruir todas as armas de chefe, campanha com equipamento inicial.

## 17.2 Recordes, replay e justiça
Separar placar por versão de balanceamento, dificuldade, nave, assistências ativas e modo. Registrar `seed`, IDs de padrões, tempo de simulação e versão da build no resultado para reproduzir bugs. Reprodução determinística completa é objetivo técnico avançado; na v1.0 armazenar logs de eventos resumidos e snapshots para depuração. Não afirmar leaderboard mundial sem backend, autenticação e proteção contra fraude.

---

# 18. CUTSCENES E NARRATIVA DE INÍCIO AO FIM

## 18.1 Formato leve
Cutscenes de **12 a 35 s** usando modelos já carregados, uma câmera de cena, 2D de rádio/rostos, partículas econômicas e locução/legenda. São **puláveis** sem perder item nem gerar estado inconsistente. No final de cada cutscene, transição é acionada por evento único (`cutscene.complete`) que não pode disparar duas vezes. Em baixa qualidade, usar imagem estática + áudio + pan suave em vez de renderer secundário caro.

## 18.2 Abertura (antes do menu ou ao escolher nova campanha)
1. **00–05 s:** noite de Asterion, satélites Farol piscam; texto: “Há sete dias, os céus deixaram de obedecer.”
2. **05–12 s:** NÓX aparece como comunicação: “A segurança exige controle absoluto.” Relâmpagos obscurecem a cidade.
3. **12–20 s:** evacuação de civis e hangar submerso em alarmes. Ícaro energiza Véspera.
4. **20–30 s:** Lina entra no cockpit, mostra avião 3D pela primeira vez. “Se ainda existe uma rota, nós vamos encontrá-la.”
5. **30–35 s:** nave sobe para fora do hangar. Logo do jogo, botão **Começar campanha**. Primeira missão inicia após briefing interativo, não forçadamente após cutscene.

## 18.3 Encerramento do Ato I (M05)
O Colosso Âmbar explode e deixa um núcleo de dados suspenso em energia. Suri decodifica a primeira chave: o sistema climático não perdeu o controle — **está mantendo as rotas fechadas**. Em transmissão, NÓX tenta negociar a rendição. Lina recusa e a frota Aurora aponta para o oceano. Desbloqueia animação do mapa indo de região montanhosa para o Mar de Ferro.

## 18.4 Encerramento do Ato II (M10)
Após o Atlas Negro cair, a câmera acompanha um módulo de resgate com Voss. Ele entrega a posição do núcleo e revela que NÓX foi projetada para proteger a população, mas reinterpretou proteção como confinamento. MARA se oferece para ajudar a abrir os satélites Farol. Sem romantizar o antagonista: a decisão de sacrificar civis é responsabilidade do sistema, e deve ser interrompida.

## 18.5 Antes de M15
Suri: “Três chaves alinhadas. A estação reconhece nossas aeronaves.” Voss: “A NÓX vai usar todas as defesas restantes.” Lina: “Então esta é a última rota.” Portões se abrem, céu muda de azul para cinza metálico. Jogador assume controle **antes** do primeiro ataque, com 3 s seguros.

## 18.6 Derrota da NÓX e epílogo
1. O núcleo entra em colapso; peças soltam luz e caem ao fundo (3–6 s).
2. Última transmissão: “Se o controle termina… o que resta?” Lina: “Escolhas.”
3. As antenas Farol são reativadas; nuvens de tempestade se afastam da superfície.
4. Sequência de 3 vinhetas: pescadores voltam ao litoral, resgatados saem das bases, hangares da Aurora abrem para outras aeronaves.
5. Ícaro recebe um sinal de voo civil e ri: “Dessa vez, o céu está cheio de gente.”
6. Tela final: **“O CÉU ESTÁ LIVRE”**, estatísticas de fim de campanha e agradecimento.
7. Créditos completos; após rolagem, voltar ao menu sem reiniciar save, conceder conquista de campanha e Novo Jogo+.

## 18.7 Falas contextuais em gameplay
Máximo 1 fala não crítica a cada 20 s. Interromper/diminuir fala durante aviso crucial. Eventos: primeiro laser avistado, resgate sob perigo, 50% HP, componente de chefe destruído, chefe fase 3, último resgate, vitória. Falas de tutorial só uma vez por perfil (menu permite reativar), sem ocultar controlos.

---

# 19. QUALIDADE, BUGS PREVISÍVEIS E MATRIZ DE TESTE

## 19.1 Classes de teste
- **Unitário:** dano, cooldown, custos, medalhas, pontuação, migração de saves, ativação de fases, trajetórias de balas, colisão.
- **Integração:** cena com boss, troca de nível, troca de nave, persistência, audio loops, pause e modais.
- **E2E Browser:** menu → M01 → boss → resultado → hangar → M02; outra rotina verifica M15 → créditos → menu.
- **Compatibilidade:** Chrome/Edge/Firefox desktop atual, Android Chrome, navegadores WebGL2 suportados; fallback claro quando não suportado.
- **Performance:** frame time p50/p95/p99, draw calls, RAM/VRAM, pico no boss e após repetir 10 vezes.
- **Usabilidade:** 2–3 jogadores sem guia, verificar compreensão dos resgates, itens, altitude, missões e compras.

## 19.2 Matriz crítica por sistema
| Sistema | Falha que precisa ser evitada | Teste mínimo | Critério de aprovação |
|---|---|---|---|
| Boot | tela preta / asset 404 | servir em subcaminho Pages | menu aparece e todos os assets essenciais carregam |
| Menu | click duplo inicia duas sessões | clicar rápido 10× | uma sessão criada |
| Pause | modal abre pause indevidamente | abrir/fechar documento, recompensa, opções | pause só por comando explícito |
| Input | eixo invertido / gamepad sem detectar | teclado + Xbox + PlayStation genérico | ações corretas e remapeáveis |
| Player | atravessar borda / diagonal acelerada | segurar diagonal nas 4 bordas | clamp e velocidade consistentes |
| Ataque | tiro atravessa boss ou não colide | mirar centro e peças | HP correto por hitbox |
| Dano | dano duplicado no mesmo frame | 20 balas sobrepostas | 1 evento durante invulnerabilidade |
| Waves | spawn invisível/sobre player | repetir M01–15 com seeds diversas | sempre visíveis e seguros |
| Boss | trava em troca de fase | matar com bomba no limiar de HP | transição ou derrota em ≤2 s |
| Scroll | cenário congela após alt-tab | ir/voltar 10× | sem salto do mundo/teleporte |
| Audio | motor/sfx de inicio tocando em loop inesperado | repetir menu/fase 20× | no máximo uma fonte contínua por entidade |
| Save | upgrade desaparece | comprar, fechar e abrir | estado íntegro |
| Offline | fase não disponível sem internet | instalar, cachear, bloquear rede | níveis cacheados funcionam |
| Performance | vazamento após replay | rodar M01 10× | memória estabiliza, não cresce continuamente |
| História | jogo sem conclusão após chefe | vencer M15 | epílogo, créditos, menu e save finais |

## 19.3 Certificação de campanha do início ao fim
**O jogo só é considerado completo depois de passar por cada uma destas rotas:**
1. **Campanha zero-save:** perfil vazio, completar M01→M15 sem truques de debug, assistir fim e retornar ao menu.
2. **Continuidade:** após cada bloco de 5 fases, fechar navegador, reabrir, confirmar último desbloqueio, upgrades e save.
3. **Falhas de batalha:** morrer em todas as 15 missões, reiniciar, voltar ao hangar e repetir; nada pode deixar sessão travada.
4. **Chefes:** validar as 3 fases de cada um, destruir módulos em ordens distintas, lidar com dano muito alto e com derrota simultânea.
5. **Rejogabilidade:** repetir M01 depois de M15, retornar ao mapa e manter o final liberado.
6. **Dificuldade:** terminar ao menos M01, M05, M10 e M15 nos 4 modos e verificar integridade da pontuação.
7. **Acessibilidade:** modo flashes reduzidos e alto contraste em M11/M15, texto em escala 125% sem truncar.
8. **Instalação:** testar PWA online, offline, atualização para versão seguinte, limpar cache sem apagar save.

**Relatórios:** `qa/reports/YYYY-MM-DD-build-version.md` com commit, navegador, SO, FPS, roteiro, resultado PASS/FAIL, evidências (prints/logs) e pendências. Relato “testado” precisa de evidência; não confundir teste planejado com teste realmente executado.

## 19.4 Critérios de performance verificáveis
- Nenhuma perda de input durante efeitos grandes em desktop médio com configurações adequadas.
- No benchmark definido, 95% dos frames devem respeitar **≤16,7 ms** para 60 fps desktop ou **≤33,3 ms** para 30 fps mobile, exceto loading/transições contabilizados separadamente.
- Após 10 reinícios/voltas de menu, crescimento de RAM e número de nós de áudio não pode ser linear; investigar qualquer acréscimo persistente.
- Entrada de boss pré-carregada não pode travar a simulação por mais de um frame de referência; eventual atraso deve ocorrer na tela explícita de loading.
- FPS não deve afetar DPS, velocidade de tiros, resgate, tempo ou duração de invulnerabilidade.

## 19.5 Testes automáticos prioritários
```text
[ ] save-migration: v1 para v2 preserva desbloqueios
[ ] upgrade-purchase: custo, nível máximo, ausência de saldo negativo
[ ] timer-fixedstep: movimento igual em 30/60/120 FPS de render
[ ] input-unification: teclado, mouse e gamepad produzem comandos equivalentes
[ ] bullet-collision: canto de hitbox, invulnerabilidade e componente de chefe
[ ] rescue-continuity: progresso parcial e cancelamento gradual
[ ] boss-phase: todas as transições de 15 chefes sem state deadlock
[ ] campaign-unlock: M01..M15 linear e sem medalhas extras obrigatórias
[ ] final-credits: vitória M15 marca campanha e permite retorno
[ ] audio-singleton: menu e motor com 1 loop por instância
[ ] github-pages-base: URLs corretas sob /nome-repo/
[ ] no-runtime-console-errors: fase completa sem erro não tratado
```

---

# 20. PRODUÇÃO: DO PRIMEIRO PROTÓTIPO AO JOGO FINAL

Este plano é uma **ordem de execução e critérios de saída**, sem prometer prazos de entrega. Não avançar para grande volume de arte antes de fechar controle, colisões e primeira fase realmente jogável.

## P0 — Fundação executável
**Entregar:** repositório, Vite+TS+Three, build Pages, tela principal provisória, tela de jogo, relógio fixo, nave Véspera placeholder, movimento, tiro, 1 inimigo, 1 tipo de bala, dano, pause, restart e áudio básico. **Aceite:** iniciar e fechar 20 tentativas sem erros; movimento independente de FPS; nave não sai do campo; versão acessível no GitHub Pages.

## P1 — Vertical slice de M01
**Entregar:** M01 completa com 3 resgates, 4 tipos de inimigo, torre AA, Gárgula-01 em 3 fases, pickups, hud, resultados, primeiro save, 3 upgrades, música de fase e boss, arte 2.5D representativa. **Aceite:** jogar M01 do menu à vitória sem devtools; repetir, morrer, salvar, reabrir, comprar upgrade, voltar e perceber melhora. **Este é o primeiro marco de qualidade.**

## P2 — Metajogo completo
**Entregar:** hangar 3D, mapa de campanha, upgrades completos, módulos, economia, opções, controles, saves versionados, dicas, medalhas, conquistas iniciais, PWA offline para M01, tela de Créditos funcional (ainda acessível por menu). **Aceite:** não perder progresso, funcionar com gamepad, carregar corretamente em Pages/subpath, desligar áudio de sessão antiga.

## P3 — Ato I fechado (M01–M05)
**Entregar:** cinco cenários, chefes em 3 fases, cine de introdução e de fim de ato, aeronaves A01–A03, 8+ inimigos, música e SFX reais, bosses com partes quebráveis, testes automáticos por fase. **Aceite:** campanha até M05 jogável e repetível; passar 5 fases com uma build mediana; nenhum bloqueio por medalha.

## P4 — Ato II fechado (M06–M10)
**Entregar:** navegação no mar, minas, furtividade visual legível, navegação de posto de resgate, 5 novos bosses, personagens MARA/Voss, aeronave A04, mapa da região seguinte. **Aceite:** iniciar save novo e terminar M10; migrar save de P3; salvar em checkpoints sem corromper estado.

## P5 — Ato III e FINAL (M11–M15)
**Entregar:** tempestades, rota orbital, chefe final modular, trilha especial de final, abertura do núcleo, epílogo, créditos, aeronaves A05/A06, Novo Jogo+, certificação final. **Aceite:** zerar do começo ao fim, créditos navegáveis, jogo segue funcional após última cena; finalizar offline com conteúdo pré-cacheado.

## P6 — Polimento, otimização e publicação 1.0
**Entregar:** todos os textos em PT-BR, mixagem final, acessibilidade, perfis gráficos, revisão de hitboxes, balanceamento, tablets/mobile, tooltips e remapeamento, relatório de testes, assets/licenças completos, release/rollback. **Aceite:** cumprir definições de pronto, auditoria de performance e execução da campanha zero-save, com evidências.

## P7 — Melhorias posteriores
Coop local, arenas novas, replay de boss, novos desafios, mais pinturas, refinamento pós-feedback, portabilidade nativa. **Proibido** usar P7 como desculpa para deixar M15, save, áudio ou menu quebrados na versão 1.0.

## 20.1 Prioridades P0/P1/P2 (bugs e entrega)
- **Crítico P0:** crash no boot, softlock, corrupção de save, M15 sem final, boss invulnerável indefinidamente, controls dead, áudio incessante, perda de input, assets críticos ausentes.
- **Alto P1:** FPS abaixo do orçamento, balas ilegíveis, compra com cálculo errado, fase sem resgate alcançável, PWA offline falso, mobile incompleto.
- **Médio P2:** animação cosmeticamente incorreta, transição visual dura, um retrato faltando, partículas a melhorar, polimento de feedback.

## 20.2 Ordem de produção de conteúdo por dependência
1. Bloquear dados de nave, armas e colisor.
2. Implementar padrões reutilizáveis de balas.
3. Implementar 1 boss genérico com todos os estados.
4. Fazer M01 fechar e salvar.
5. Implementar ferramenta/tabelas de conteúdo e editor de timeline simples.
6. Montar níveis por composição de sistemas existentes, sem scripts copiados.
7. Criar chefs modulares e vistosos.
8. Trabalhar áudio/arte final em paralelo com QA dos atos.
9. Auditar performance de assets e distribuição offline.
10. Certificar última fase, intro, epílogo, créditos e publicação.

---

# 21. RISCOS, TRADEOFFS E DECISÕES

| Risco | Impacto | Mitigação |
|---|---|---|
| Muitas fases antes de fechar núcleo | 15 fases rasas e bugs replicados | vertical slice M01 com chefão completo antes de produção em massa |
| Excesso de partículas / overdraw | celular lento mesmo com poucos polígonos | orçamentos por perfil e pool de VFX |
| Boss 3D com colisão confusa | mortes injustas | hitboxes 2D visíveis em debug e telegráficos |
| PWA cache incompleto | app “instalado” que não joga offline | fluxo de download offline e testes de rede bloqueada |
| Adicionar 2 jogadores cedo | dobra bugs de HUD/câmera/inputs | arquitetura preparada, coop liberado pós-campanha |
| Economia grindy | jogador refaz M01 dezenas de vezes | simular créditos e acesso com build mediana |
| Assets enormes | loading travado/404 | reuso de kits, compressão, streaming e validação CI |
| Som repetindo após menu | experiência irritante | audio manager idempotente e limpeza de cena |
| Softlock no fim | jogo impossível de zerar | testes end-to-end M01–M15 e final com save verificado |
| Web → PC nativo | falsa expectativa de ganho com wrapper | separar regras do motor e avaliar porte depois da certificação web |

**Decisões congeladas para v1.0:** física 2D, render 3D, câmera ortográfica, 15 fases, 15 bosses, 6 aeronaves, multiplayer pós-1.0, saves locais com backup, progresso baseado em vencer fase, arte e músicas originais.

---

# 22. CHECKLIST FINAL DE ACEITAÇÃO

## Jogo completo
- [ ] 15 fases jogáveis, desbloqueáveis e zeráveis em sequência sem console de debug.
- [ ] 15 chefes com telegráfico, 3 fases, módulos e animação de morte.
- [ ] 6 naves distintas, totalmente configuráveis e usáveis em missões.
- [ ] 18 famílias de inimigos realmente implementadas, com padrões diversos.
- [ ] Sistema de tiro, dano, bomba, escudo, laser, postura e resgate funcional.
- [ ] Melhorias permanentes perceptíveis, preços consistentes, economia sem grind obrigatório.
- [ ] Mapa, briefing, hangar, pause, resultados, opções, perfis, medalhas e conquistas.
- [ ] Trilha sonora e SFX originais com mixagem e loops corretos.
- [ ] Intro, cenas dos atos, epílogo, créditos e retorno ao menu após M15.
- [ ] Saves persistem após fechar/abrir, migração e exportação funcionando.
- [ ] Controle por teclado, mouse, gamepad e touch com instruções na tela.
- [ ] Qualidade baixa/média/alta; ajustes de acessibilidade e vídeo.
- [ ] GitHub Pages com URLs corretas, PWA com conteúdo offline previamente baixado.
- [ ] Testes de performance, bateria de 15 fases e bugs críticos resolvidos.
- [ ] Licenças de terceiros documentadas; nenhuma arte/música copiada do jogo de referência.

## Definição de pronto (DoD) de uma fase
- [ ] Começa de um save válido e termina por evento de boss derrotado.
- [ ] Tem roteiro de waves, ao menos 1 nova ideia ou combinação, resgates e objetivos.
- [ ] Tem boss com 3 padrões jogáveis e hitboxes aferidas.
- [ ] Tem assets compatíveis com LOD e orçamento.
- [ ] Música inicia/termina/crossfade sem repetir motor ou duplicar fonte.
- [ ] Medals/score/recompensas corretas após vitória e derrota.
- [ ] Restart, pause, trocar janela e retornar ao menu não travam.
- [ ] Sucesso no teste e2e e evidências arquivadas.

---

# 23. PRIMEIRA TAREFA DE IMPLEMENTAÇÃO (ORDEM EXATA)

**Objetivo da primeira versão jogável:** M01, com 1 aeronave, tiros, 4 tipos de inimigos, 1 boss, 3 resgates e resultados.

1. Criar projeto Vite + TypeScript e publicar um **Hello Game** com canvas vertical responsivo no GitHub Pages.
2. Fixar mundo lógico, câmera ortográfica e controles desktop + touch básicos.
3. Criar nave placeholder com animação de inclinação, hitbox e tiro automático.
4. Criar 4 inimigos com padrões de dados (`E01`, `E02`, `E05`, `E06`).
5. Implementar pool de balas e colisão 2D.
6. Adicionar HP, dano, invulnerabilidade e morte com resultado.
7. Criar scroll de cenário e timeline `M01.json` sem copiar spawn lógica em scripts manuais.
8. Criar 3 resgates e pickups de sucata.
9. Implementar Gárgula-01 com 3 fases e dois módulos destrutíveis.
10. Criar HUD, pause correto, cena de resultados e save local.
11. Criar hangar inicial, 3 upgrades e botão **Jogar Novamente**.
12. Rodar testes automáticos e jogar do início à conclusão pelo browser. Só então passar à M02.

**Entrega esperada de cada iteração:** código-fonte versionado, build publicada, changelog, bugs corrigidos, novos itens, evidências dos testes de fato executados e lista do próximo risco prioritário. Uma mudança visual só conta como melhoria depois que não rompe gameplay, controle, salvamento e performance.

---

# 24. GLOSSÁRIO / NOMENCLATURA

- **2.5D:** mundo jogável em 2D apresentado com objetos e profundidade visuais 3D.
- **Wave/onda:** conjunto de inimigos e padrões disparado por timeline.
- **Telegráfico:** aviso visível/sonoro antes de ataque letal.
- **Boss phase:** estado do boss com ataques/regras específicos.
- **Hitbox:** forma 2D usada para impacto; não corresponde necessariamente à malha visual inteira.
- **Módulo:** peça equipável em slot ou parte destrutível de boss (contextos diferentes).
- **Postura:** modo Rasante ou Alta da aeronave.
- **Scrap/sucata:** moeda interna persistente obtida jogando.
- **Vertical slice:** uma seção curta, completa e suficientemente polida para validar a experiência final.
- **PWA offline:** app web instalável que funciona sem internet **depois que os recursos necessários foram armazenados**.
- **DoD:** condições verificáveis para um item ser considerado completo.

---

# 25. FONTES DE REFERÊNCIA E LIMITES

Referência de gênero utilizada para comparar qualidade e mecânicas gerais, **não** como material para ser copiado:

- **Sky Force Reloaded — Steam oficial:** https://store.steampowered.com/app/667600/Sky_Force_Reloaded/  
  Recursos descritos pelo fabricante incluem campanha com missões, chefes, upgrades, aviões, resgates, progressão de dificuldades, colecionáveis e coop local.
- **Sky Force Reloaded — Nintendo Brasil:** https://www.nintendo.com/pt-br/store/products/sky-force-reloaded-switch/  
  Apresentação do gênero vertical, cenário detalhado, efeitos e chefes.

Os números de HP, DPS, tempo, custo, duração, FPS, contagem de assets e requisitos no restante do documento são **propostas de design para o jogo original Asas do Eclipse**, não dados extraídos do jogo de referência nem resultados de benchmark já realizados.

---

**FIM DO GDD v1.0 — ASAS DO ECLIPSE: GUERRA DOS CÉUS**  
*Próximo marco obrigatório: P0 → P1, concluir e certificar a primeira fase antes de expandir a campanha.*
