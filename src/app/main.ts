import "./style.css";
import { Clock } from "../core/Clock";
import { World } from "../gameplay/World";
import { Renderer } from "../render/Renderer";
import { InputRouter, type Commands } from "../input/InputRouter";
import { AudioManager } from "../audio/AudioManager";
import { SaveStore, buy, type Save } from "../persistence/SaveStore";
import { upgrades, cost, type Upgrade } from "../data/upgrades";
const ui = document.querySelector<HTMLDivElement>("#ui")!,
  stage = document.querySelector<HTMLDivElement>("#stage")!;
let renderer: Renderer;
try {
  renderer = new Renderer(stage);
} catch (e) {
  ui.innerHTML =
    '<div id="error"><h2>Seus céus ainda não abriram.</h2><p>Este protótipo precisa de WebGL2. Ative a aceleração gráfica ou experimente um navegador atualizado.</p></div>';
  throw e;
}
const store = new SaveStore();
let save: Save = store.load();
const audio = new AudioManager();
audio.setEnabled(save.settings.sound);
let world: World | null = null,
  screen = "menu",
  paused = false,
  resultPaid = false,
  last = performance.now(),
  hudTime = 0,
  modal = "";
const clock = new Clock();
let qaControl: Commands | null = null;
document.documentElement.dataset.version = "0.2.0";
const debug = new URLSearchParams(location.search).get("debug");
const input = new InputRouter(stage, togglePause);
const nf = new Intl.NumberFormat("pt-BR");
const fmt = (v: number) => nf.format(Math.round(v));
const time = (v: number) =>
  `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(Math.floor(v % 60)).padStart(2, "0")}`;
function btn(action: string, text: string, cls = "", extra = "") {
  return `<button data-action="${action}" class="${cls}" ${extra}>${text}</button>`;
}
function brand() {
  return '<div class="brand"><i class="emblem"><span>Λ</span></i> ESQUADRÃO AURORA</div>';
}
function footer() {
  return `<div class="footer"><span>FATIA VERTICAL · M01 · v0.2.0</span><span>${store.status} · SEM SERVIÇOS EXTERNOS</span></div>`;
}
function base(content: string) {
  return `<div class="screen">${brand()}<div class="top-right"><span>ASTERION / SETOR 01</span><span>◈ ${fmt(save.scrap)} SUCATAS</span></div>${content}${footer()}</div>`;
}
function show(next: string) {
  screen = next;
  modal = "";
  paused = false;
  audio.setPaused(false);
  input.clear();
  clock.reset();
  renderer.setMenu(next !== "game");
  if (next !== "game") audio.setMode("menu");
  renderScreen();
}
function menu() {
  show("menu");
}
function renderScreen() {
  if (screen === "menu")
    ui.innerHTML = base(
      `<div class="menu-copy"><div class="eyebrow">Ato I / Céu perdido</div><h1>ASAS DO<br><em>ECLIPSE</em></h1><div class="subtitle">GUERRA DOS CÉUS</div><p>O céu está fechado. Ainda existe uma rota.<br>Voe pela Aurora. Traga todos para casa.</p><div class="menu-nav">${btn("briefing", `<span>${save.cleared ? "JOGAR NOVAMENTE" : "INICIAR MISSÃO"}<small>01 / RUÍNAS DE ARKAN</small></span><span>↗</span>`, "primary launch")}${btn("hangar", "HANGAR <small>Aeronave e melhorias</small>")}${btn("options", "OPÇÕES <small>Áudio e controles</small>")}${btn("credits", "CRÉDITOS")}${btn("export", "EXPORTAR SAVE")}</div></div><div class="menu-detail"><div class="label">A01 / Caça de resistência</div><h3>VÉSPERA</h3><p>Projetada para resistir.<br>Preparada para recomeçar.</p><div class="rule"></div><div class="label">AUTOFIRE • 100 HP • ${upgrades.motor.effect(save.upgrades.motor)}</div></div>`,
    );
  else if (screen === "briefing")
    ui.innerHTML = base(
      `<section class="briefing">${btn("menu", "← VOLTAR", "back")}<div class="eyebrow">Missão 01 / Vale de Arkan</div><h2>Ruínas<br>de Arkan</h2><p>A rede NÓX tomou a represa. Abra o corredor de evacuação e neutralize a plataforma antiaérea Gárgula-01.</p><div class="facts"><div><span class="label">Duração prevista</span><b>6–7 minutos</b></div><div><span class="label">Aeronave</span><b>A01 Véspera</b></div><div><span class="label">Ameaças</span><b>Caças, tanques e AA</b></div><div><span class="label">Dificuldade</span><b>Normal</b></div></div><div class="objectives"><span class="label">Objetivos</span><p>◇ Derrotar Gárgula-01 e abrir a rota.</p><p>◇ Resgatar 3 civis: fique perto por 1,5 s.</p><p>◇ Destruir 70% / 95% dos alvos. Sobreviver.</p></div><div class="buttons">${btn("start", "INICIAR VOO ↗", "primary")}${btn("hangar", "PREPARAR NAVE")}</div></section>`,
    );
  else if (screen === "hangar")
    ui.innerHTML = base(
      `<section class="hangar">${btn("menu", "← MENU", "back")}<div class="eyebrow">Ícaro / Oficina da Aurora</div><header><div><h2>Pronta para<br>o próximo voo.</h2></div><div><div class="label">Sucatas</div><div class="balance">${fmt(save.scrap)}</div></div></header>${(
        Object.keys(upgrades) as Upgrade[]
      )
        .map((k) => {
          const u = upgrades[k],
            n = save.upgrades[k];
          return `<div class="upgrade"><div><h3>${u.name} <small> ${n}/${u.max}</small></h3><p>${u.description}</p><div class="preview"><span>${u.effect(n)}</span><span>→ ${n === u.max ? "MÁXIMO" : u.effect(n + 1)}</span></div></div>${btn("buy:" + k, n === u.max ? "MÁXIMO" : `MELHORAR<small>◈ ${cost(n)} sucatas</small>`, "", n >= u.max || save.scrap < cost(n) ? "disabled" : "")}</div>`;
        })
        .join(
          "",
        )}<p style="font-size:11px;margin:15px 0">Melhorias permanentes. Primeira vitória: 300 sucatas + bônus.<br>Em derrota, você mantém 60% da sucata coletada.</p><div class="buttons">${btn("briefing", "PREPARAR MISSÃO ↗", "primary")}</div>${store.status.startsWith("Não") ? `<p class="save-warning">${store.status}</p>` : ""}</section>`,
    );
  else if (screen === "options")
    ui.innerHTML = base(
      `<section class="options">${btn("menu", "← VOLTAR", "back")}<div class="eyebrow">Configuração de voo</div><h2>Você no controle.</h2><p><b>WASD / setas</b> · mover<br><b>Shift / botão direito</b> · Raio Lança (2 cargas)<br><b>E</b> · Bomba de Pulso (2 cargas)<br><b>Esc / P</b> · pausar<br><b>Mouse / toque</b> · arrastar para mover relativamente<br><b>Controle</b> · analógico / D-pad; A especial, B bomba, Start pausa</p><p>Disparo automático. Sua hitbox é o ponto ciano no centro da nave. Resgate mantendo-se no círculo por 1,5 s. O progresso decai gradualmente ao sair.</p><div class="buttons">${btn("sound", save.settings.sound ? "ÁUDIO: LIGADO" : "ÁUDIO: DESLIGADO")}${btn("export", "EXPORTAR SAVE")}</div><p>Postura fixa neste protótipo. Recomenda-se jogar na vertical. Dados salvos apenas neste navegador.</p></section>`,
    );
  else if (screen === "credits")
    ui.innerHTML = base(
      `<section class="options credits">${btn("menu", "← MENU", "back")}<div class="eyebrow">Uma rota original</div><h2>Asas do Eclipse</h2><p>Guerra dos Céus · Fatia vertical M01<br>Universo e design: GDD original fornecido pelo criador.<br>Implementação, modelos low-poly, interface e áudio sintetizado: produzidos para este protótipo.</p><p>Three.js — licença MIT.<br>Vite, TypeScript, Vitest e Playwright — ferramentas de desenvolvimento (licenças em ASSET_LICENSES.md).</p><p>Nenhuma arte, código, música ou padrão foi extraído de Sky Force. Este é um protótipo original em evolução, não a campanha completa.</p><div class="label">Próximo marco: validar M01 antes de expandir.</div></section>`,
    );
  else if (screen === "game") renderGame();
}
function start() {
  renderer.clearSession();
  world = new World(save, !!debug);
  resultPaid = false;
  qaControl = null;
  show("game");
  audio.setMode("game");
  if (debug === "boss") {
    world.jumpBoss();
    audio.setMode("boss");
  }
  updateHUD();
}
function renderGame() {
  ui.innerHTML = `<div class="field-ui"><div class="hud-top"><div><div class="label">Integridade</div><b id="hp">100 / 100</b><div class="hpbar" id="hpbar"><i></i></div></div><div class="score"><div class="label">Pontuação</div><b id="score">0</b><div class="hud-small"><span id="combo">x1,0</span><span id="time">00:00</span></div></div><div>${btn("pause", "Ⅱ", "icon", 'aria-label="Pausar"')}<div class="hud-small" id="rescues">0/3</div></div></div><div class="flight-strip"><span>M01 / ARKAN</span><span>◈ <b id="scrap">0</b></span><span>ALVOS <b id="elimination">0%</b></span></div><div id="boss"></div><div id="rescue-labels"></div><div class="radio" id="radio"></div>${debug ? '<div class="debug-tag">TESTE / SEM RECOMPENSAS DE PERFIL</div>' : ""}<div class="hud-bottom">${btn("bomb", '[E] PULSO <b id="bombs">2</b><small>LIMPA PROJÉTEIS</small>')}${btn("special", '[SHIFT] RAIO <b id="specials">2</b><small>FEIXE PERFURANTE</small>')}</div></div><div id="overlays"></div>`;
}
function text(id: string, value: string) {
  const e = document.getElementById(id);
  if (e) e.textContent = value;
}
function updateHUD() {
  if (screen !== "game" || !world) return;
  const w = world,
    p = w.player;
  text("hp", `${Math.ceil(p.hp)} / 100`);
  const bar = document.querySelector<HTMLElement>("#hpbar i");
  if (bar) bar.style.width = p.hp + "%";
  document.getElementById("hpbar")?.classList.toggle("low", p.hp <= 30);
  text("score", fmt(w.score));
  text("combo", "x" + w.combo.toFixed(1).replace(".", ","));
  text("time", time(w.time));
  text("rescues", `${w.rescued}/3 CIVIS`);
  text("side-rescue", `${w.rescued} / 3`);
  text("bombs", String(p.bombs));
  text("specials", String(p.specials));
  text("elimination", `${Math.round(w.elimination * 100)}%`);
  text("accuracy", `${Math.round(w.accuracy * 100)}%`);
  text("scrap", fmt(w.scrap));
  text("segment", w.segment);
  text("radio", w.message);
  document
    .getElementById("radio")
    ?.classList.toggle("visible", w.messageTime > 0);
  const labels = document.getElementById("rescue-labels");
  if (labels)
    labels.innerHTML = w.rescues
      .filter((r) => r.active)
      .map(
        (r) =>
          `<div class="rescue-label" style="left:${((r.x + 8) / 16) * 100}%;top:${((14 - r.y - 2) / 28) * 100}%">CIVIL ${r.progress > 0 ? `<b>${Math.floor(r.progress * 100)}%</b>` : "◈ 1,5 s"}</div>`,
      )
      .join("");
  const be = document.getElementById("boss");
  if (be) {
    const b = w.boss;
    be.innerHTML =
      b && !b.dead
        ? `<div class="boss-hud"><div class="boss-name"><span>GÁRGULA-01</span><span class="gold">FASE ${b.phase}</span></div><div class="bar"><i style="width:${b.hp / 6}%"></i></div><div class="part-bars"><span>CANHÃO E · ${Math.ceil(b.left)}<div class="bar"><i style="width:${b.left / 2}%"></i></div></span><span>${b.invul > 0 ? "TRANSIÇÃO · " + b.invul.toFixed(1) + " s" : `NÚCLEO · ${Math.ceil(b.hp)} / 600`}</span><span>CANHÃO D · ${Math.ceil(b.right)}<div class="bar"><i style="width:${b.right / 2}%"></i></div></span></div></div>`
        : "";
  }
}
function overlay(content: string) {
  const el = document.getElementById("overlays");
  if (el)
    el.innerHTML = `<div class="overlay"><div class="dialog">${content}</div></div>`;
}
function togglePause() {
  if (
    screen !== "game" ||
    !world ||
    world.state !== "playing" ||
    modal === "result"
  )
    return;
  if (paused) {
    paused = false;
    modal = "";
    document.getElementById("overlays")!.innerHTML = "";
    audio.setPaused(false);
    input.clear();
    clock.reset();
  } else {
    paused = true;
    modal = "pause";
    input.clear();
    audio.setPaused(true);
    overlay(
      `<div class="eyebrow">Voo suspenso</div><h2>Respire.<br>O céu espera.</h2><p>Simulação, resgates e ataques estão pausados.</p><div class="stack">${btn("resume", "CONTINUAR VOO", "primary")}${btn("restart-confirm", "REINICIAR MISSÃO")}${btn("pause-controls", "CONTROLES")}${btn("hangar-confirm", "VOLTAR AO HANGAR")}${btn("menu-confirm", "SAIR PARA O MENU")}</div>`,
    );
  }
}
function confirmLeave(target: string) {
  modal = "confirm";
  overlay(
    `<div class="eyebrow">Confirmar saída</div><h2>Encerrar tentativa?</h2><p>A sucata desta tentativa será perdida. Suas melhorias permanentes ficam salvas.</p><div class="buttons">${btn("leave:" + target, "ENCERRAR", "primary")}${btn("back-pause", "VOLTAR")}</div>`,
  );
}
function finish() {
  if (!world || resultPaid) return;
  resultPaid = true;
  const w = world,
    win = w.state === "victory";
  paused = true;
  audio.setMode("menu");
  input.clear();
  modal = "result";
  const medals = [
    { id: "clear", name: "MISSÃO CONCLUÍDA", ok: win },
    {
      id: "elimination",
      name: "85% DOS ALVOS",
      ok: win && w.elimination >= 0.85,
    },
    { id: "rescue", name: "TODOS OS CIVIS", ok: win && w.rescued === 3 },
    { id: "survive", name: "SEM PERDER NAVE", ok: win },
    { id: "ace", name: "ÁS · SEM DANO", ok: win && w.damageTaken === 0 },
  ];
  const base = win ? (save.cleared ? 180 : 300) : 0;
  const bonus = win
    ? Math.round(
        base *
          ((w.rescued === 3 ? 0.15 : 0) +
            (w.elimination >= 0.85 ? 0.1 : 0) +
            (w.damageTaken === 0 ? 0.1 : 0)),
      )
    : 0;
  const earned = win ? w.scrap + base + bonus : Math.floor(w.scrap * 0.6);
  if (!w.debug) {
    save.scrap += earned;
    save.attempts++;
    save.bestScore = Math.max(save.bestScore, w.score);
    if (win) save.cleared = true;
    save.medals = [
      ...new Set([
        ...save.medals,
        ...medals.filter((m) => m.ok).map((m) => m.id),
      ]),
    ];
    store.write(save);
  }
  const out = document.getElementById("overlays")!;
  out.innerHTML = `<div class="overlay"><div class="dialog report"><div class="eyebrow">Relatório da operação / M01</div><h2>${win ? "Corredor liberado." : "Ainda há uma rota."}</h2><p>${win ? "Lina: Arkan está livre. Ícaro: trouxe peças? O motor pode ficar melhor." : `Derrubado por: ${w.lastDamage}.<br>Saia da linha de mira antes do feixe. Use a bomba para limpar projéteis.`}</p><div class="stats-grid">${[
    ["TEMPO", time(w.time)],
    ["PRECISÃO", `${Math.round(w.accuracy * 100)}%`],
    ["RESGATES", `${w.rescued} / 3`],
    ["PONTUAÇÃO", fmt(w.score)],
    ["ALVOS", `${w.kills} / ${w.spawned}`],
    ["DANO RECEBIDO", fmt(w.damageTaken)],
  ]
    .map(
      ([l, v]) =>
        `<div class="stat-item"><span class="label">${l}</span><b>${v}</b></div>`,
    )
    .join(
      "",
    )}</div><div class="medals">${medals.map((m) => `<span class="medal ${m.ok ? "earned" : ""}">${m.ok ? "◆" : "◇"} ${m.name}</span>`).join("")}</div><div class="label">ELIMINAÇÃO M01: ${w.elimination >= 0.7 ? "◆" : "◇"} 70% · ${w.elimination >= 0.95 ? "◆" : "◇"} 95% &nbsp; CANHÕES: ${w.parts}/2</div><div class="earned-scrap"><div><span class="label">${w.debug ? "TESTE · SEM GANHOS REAIS" : win ? "Sucata garantida + coleta + bônus" : "Sucata mantida · 60% da coleta"}</span><p style="margin:4px 0 0;font-size:10px">${win ? `${base} base + ${w.scrap} coleta + ${bonus} bônus` : `${w.scrap} coletadas nesta tentativa`}</p></div><b>+${w.debug ? 0 : fmt(earned)}</b></div><div class="buttons">${btn("start", win ? "JOGAR NOVAMENTE" : "TENTAR NOVAMENTE", "primary")}${btn("hangar", "HANGAR")}${btn("menu", "MENU")}</div><p class="${store.status.startsWith("Não") ? "save-warning" : "label"}" style="margin-bottom:0">${store.status}</p>${store.status.startsWith("Não") ? btn("export", "EXPORTAR BACKUP") : ""}</div></div>`;
}
function exportSave() {
  const blob = new Blob([JSON.stringify(save, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "asas-do-eclipse-save.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
ui.addEventListener("click", async (e) => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>(
    "button[data-action]",
  );
  if (!button || button.disabled) return;
  await audio.unlock();
  if (!button.isConnected) return;
  audio.sfx("ui");
  const action = button.dataset.action!;
  if (["menu", "briefing", "hangar", "options", "credits"].includes(action)) {
    show(action);
    return;
  }
  if (action === "start") {
    if (screen === "game" && !resultPaid) return;
    start();
  } else if (action === "pause" || action === "resume") togglePause();
  else if (action === "bomb") input.bomb = true;
  else if (action === "special") input.special = true;
  else if (action === "sound") {
    save.settings.sound = !save.settings.sound;
    audio.setEnabled(save.settings.sound);
    store.write(save);
    renderScreen();
  } else if (action === "export") exportSave();
  else if (action.startsWith("buy:")) {
    const k = action.split(":")[1] as Upgrade,
      n = save.upgrades[k];
    ui.insertAdjacentHTML(
      "beforeend",
      `<div class="overlay" id="purchase"><div class="dialog"><div class="eyebrow">Melhoria permanente</div><h2>${upgrades[k].name}</h2><p>${upgrades[k].effect(n)} → ${upgrades[k].effect(n + 1)}<br>Custo: ${cost(n)} sucatas. Saldo após compra: ${save.scrap - cost(n)}.</p><div class="buttons">${btn("confirm-buy:" + k, "CONFIRMAR", "primary")}${btn("cancel-buy", "VOLTAR")}</div></div></div>`,
    );
  } else if (action.startsWith("confirm-buy:")) {
    const k = action.split(":")[1] as Upgrade;
    if (buy(save, k)) {
      store.write(save);
      audio.sfx("pickup");
    }
    renderScreen();
  } else if (action === "cancel-buy")
    document.getElementById("purchase")?.remove();
  else if (action.endsWith("-confirm")) confirmLeave(action.split("-")[0]);
  else if (action.startsWith("leave:")) {
    const target = action.split(":")[1];
    if (target === "restart") {
      resultPaid = true;
      start();
    } else show(target);
  } else if (action === "back-pause") {
    paused = false;
    togglePause();
  } else if (action === "pause-controls")
    overlay(
      `<div class="eyebrow">Controles</div><h2>Comandos de voo</h2><p>WASD / setas: mover<br>Shift / A: especial (2 cargas)<br>E / B: bomba (2 cargas)<br>Esc / P / Start: pausa<br>Mouse / toque: arraste relativo<br>Resgate: mantenha-se próximo por 1,5 s.</p>${btn("back-pause", "VOLTAR À PAUSA", "primary")}`,
    );
});
document.addEventListener("visibilitychange", () => {
  if (
    document.hidden &&
    screen === "game" &&
    !paused &&
    world?.state === "playing"
  )
    togglePause();
  clock.reset();
  last = performance.now();
});
function simulate(dt: number) {
  if (!world) return;
  const command = qaControl || input.sample(dt, world.speed);
  if (paused) return;
  const previousX = world.player.x,
    previousY = world.player.y;
  world.tick(dt, command);
  if (!qaControl)
    input.consumeDrag(
      world.player.x - previousX,
      world.player.y - previousY,
      world.player.x,
      world.player.y,
    );
  for (const ev of world.events) audio.sfx(ev);
  world.events.length = 0;
  if (world.boss && !world.boss.dead && audio.mode !== "boss")
    audio.setMode("boss");
  if (world.state === "victory" || world.state === "defeat") finish();
}
function frame(now: number) {
  const delta = Math.min(0.1, (now - last) / 1000);
  last = now;
  const alpha = clock.advance(delta, paused || screen !== "game", simulate);
  renderer.render(
    world,
    paused ? 1 : alpha,
    paused && screen === "game" ? 0 : delta,
  );
  hudTime += delta;
  if (hudTime > 0.1) {
    hudTime = 0;
    updateHUD();
  }
  requestAnimationFrame(frame);
}
menu();
requestAnimationFrame(frame);
// Explicit debug-only QA surface: controls and deterministic stepping, never god-mode or reward grants.
if (debug) {
  (window as any).__AURORA__ = {
    state: () => ({
      screen,
      paused,
      state: world?.state,
      time: world?.time,
      player: world ? { ...world.player } : null,
      boss: world?.boss ? { ...world.boss } : null,
      enemies: world?.enemies.map((e) => ({ ...e })),
      rescues: world?.rescues.map((r) => ({ ...r })),
      bullets: world?.pool.items
        .filter((b) => b.active && !b.friendly)
        .map((b) => ({ ...b })),
      pickups: world?.pickups.map((p) => ({ ...p })),
      lasers: world?.lasers.map((l) => ({ ...l })),
      score: world?.score,
      scrap: world?.scrap,
      drawCalls: renderer.renderCalls,
      memory: { ...renderer.renderer.info.memory },
      visual: {
        version: "0.2.0",
        quality: renderer.quality.level,
        viewport: renderer.metrics,
      },
      save,
      loops: audio.loops.size,
    }),
    step: (ticks: number, c: Commands) => {
      if (screen !== "game" || paused) return;
      qaControl = c;
      for (let i = 0; i < Math.min(ticks, 36000) && !paused; i++)
        simulate(1 / 60);
      qaControl = null;
      updateHUD();
    },
    start,
  };
}
