import {
  hangarScreen,
  briefingScreen,
  optionsPanel,
  bossHud,
  upgradeEffect,
} from "./ScreenParts";
import {
  aircraft,
  selectedAircraft,
  shipAvailable,
  type AircraftId,
} from "../data/aircraft";
import { preferences, type Preferences } from "../persistence/Preferences";
import "./style.css";
import { stages, stageInfo, type StageId } from "../data/stages";
import {
  record,
  available,
  rememberStage,
  completeAttempt,
} from "../persistence/Campaign";
import { campaignMap } from "./CampaignMap";
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
audio.configure(preferences(save));
renderer.configure(preferences(save));
renderer.setAircraft(selectedAircraft(save));
let world: World | null = null,
  screen = "menu",
  paused = false,
  resultPaid = false,
  last = performance.now(),
  hudTime = 0,
  modal = "";
const clock = new Clock();
let qaControl: Commands | null = null;
let hitStop = 0;
document.documentElement.dataset.version = "0.4.0";
const debug = new URLSearchParams(location.search).get("debug");
const requested = new URLSearchParams(location.search).get("stage");
let selectedStage: StageId =
  debug && (requested === "M02" || requested === "M03")
    ? requested
    : save.campaign?.lastStage || (save.cleared ? "M02" : "M01");
if (!debug && !available(save, selectedStage)) selectedStage = "M01";
let mapNode: string = selectedStage;
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
  return `<div class="footer"><span>ATO I · M01 + M02 + M03 · v0.4.0</span><span>${store.status} · SEM SERVIÇOS EXTERNOS</span></div>`;
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
  renderer.setPresentation(next);
  if (next === "briefing" || next === "map") renderer.setStage(selectedStage);
  if (next !== "game") audio.setMode("menu");
  renderScreen();
}
function menu() {
  show("menu");
}
function renderScreen() {
  if (screen === "menu")
    ui.innerHTML = base(
      `<div class="menu-copy"><div class="eyebrow">Ato I / Céu perdido</div><h1>ASAS DO<br><em>ECLIPSE</em></h1><div class="subtitle">GUERRA DOS CÉUS</div><p>O céu está fechado. Ainda existe uma rota.<br>Voe pela Aurora. Traga todos para casa.</p><div class="menu-nav">${btn("briefing", `<span>${save.cleared ? "JOGAR NOVAMENTE" : "INICIAR MISSÃO"}<small>${selectedStage} / ${stageInfo[selectedStage].name.toUpperCase()}</small></span><span>↗</span>`, "primary launch")}${btn("map", "CAMPANHA <small>Mapa do Ato I</small>")}${btn("hangar", "HANGAR <small>Aeronave e melhorias</small>")}${btn("options", "OPÇÕES <small>Áudio e controles</small>")}${btn("credits", "CRÉDITOS")}${btn("export", "EXPORTAR SAVE")}</div></div><div class="menu-detail"><div class="label">A01 / Caça de resistência</div><h3>${aircraft[selectedAircraft(save)].name.toUpperCase()}</h3><p>Projetada para resistir.<br>Preparada para recomeçar.</p><div class="rule"></div><div class="label">AUTOFIRE • 100 HP • ${upgrades.motor.effect(save.upgrades.motor)}</div></div>`,
    );
  else if (screen === "map") ui.innerHTML = base(campaignMap(save, mapNode));
  else if (screen === "briefing")
    ui.innerHTML = base(briefingScreen(save, selectedStage));
  else if (screen === "hangar") ui.innerHTML = base(hangarScreen(save));
  else if (screen === "options")
    ui.innerHTML = base(
      '<section class="options-v4">' + optionsPanel(save) + "</section>",
    );
  else if (screen === "credits")
    ui.innerHTML = base(
      `<section class="options credits">${btn("menu", "← MENU", "back")}<div class="eyebrow">Uma rota original</div><h2>Asas do Eclipse</h2><p>Guerra dos Céus · Fatia vertical M01 + M02 + M03<br>Universo e design: GDD original fornecido pelo criador.<br>Implementação, modelos low-poly, interface e áudio sintetizado: produzidos para este protótipo.</p><p>Three.js — licença MIT.<br>Vite, TypeScript, Vitest e Playwright — ferramentas de desenvolvimento (licenças em ASSET_LICENSES.md).</p><p>Nenhuma arte, código, música ou padrão foi extraído de Sky Force. Este é um protótipo original em evolução, não a campanha completa.</p><div class="label">Próximo marco: validar as três missões antes de M04.</div></section>`,
    );
  else if (screen === "game") renderGame();
  renderer.layoutPreview();
}
function start() {
  renderer.clearSession();
  if (!debug && !available(save, selectedStage)) {
    show("map");
    return;
  }
  renderer.setStage(selectedStage);
  renderer.setAircraft(selectedAircraft(save));
  audio.setStage(selectedStage);
  hitStop = 0;
  world = new World(save, !!debug, selectedStage);
  if (!debug) {
    rememberStage(save, selectedStage);
    store.write(save);
  }
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
  ui.innerHTML = `<div class="field-ui"><div class="hud-top"><div><div class="label">Integridade</div><b id="hp">100 / 100</b><div class="hpbar" id="hpbar"><i></i></div></div><div class="score"><div class="label">Pontuação</div><b id="score">0</b><div class="hud-small"><span id="combo">x1,0</span><span id="time">00:00</span></div></div><div>${btn("pause", "Ⅱ", "icon", 'aria-label="Pausar"')}<div class="hud-small" id="rescues">0/3</div></div></div><div class="flight-strip"><span>${selectedStage === "M01" ? "M01 / ARKAN" : selectedStage === "M02" ? "M02 / CÂNION" : "M03 / FORTALEZA"}</span><span>◈ <b id="scrap">0</b></span><span>ALVOS <b id="elimination">0%</b></span></div><div id="boss"></div><div id="rescue-labels"></div><div id="convoy-labels"></div><div class="radio" id="radio"></div>${debug ? '<div class="debug-tag">TESTE / SEM RECOMPENSAS DE PERFIL</div>' : ""}<div class="hud-bottom">${btn("bomb", '[E] PULSO <b id="bombs">2</b><small>LIMPA PROJÉTEIS</small>')}${btn("posture", '[Q] ALTITUDE <b id="posture-name">RASANTE</b><small id="posture-time">+20% SOLO</small>', "posture-button")}${btn("special", '[SHIFT] RAIO <b id="specials">2</b><small>FEIXE PERFURANTE</small>')}</div></div><div id="overlays"></div>`;
}
function text(id: string, value: string) {
  const e = document.getElementById(id);
  if (e) e.textContent = value;
}
function updateHUD() {
  if (screen !== "game" || !world) return;
  const w = world,
    p = w.player;
  text("hp", `${Math.ceil(p.hp)} / ${p.maxHp}`);
  const bar = document.querySelector<HTMLElement>("#hpbar i");
  if (bar) bar.style.width = (p.hp / p.maxHp) * 100 + "%";
  document.getElementById("hpbar")?.classList.toggle("low", p.hp <= 30);
  text("score", fmt(w.score));
  text("combo", "x" + w.combo.toFixed(1).replace(".", ","));
  text("time", time(w.time));
  text("rescues", `${w.rescued}/${w.mission.rescues.length} CIVIS`);
  text("side-rescue", `${w.rescued} / 3`);
  text("bombs", String(p.bombs));
  text("specials", String(p.specials));
  text("elimination", `${Math.round(w.elimination * 100)}%`);
  text("accuracy", `${Math.round(w.accuracy * 100)}%`);
  text("scrap", fmt(w.scrap));
  text("segment", w.segment);
  text("posture-name", p.posture.toUpperCase());
  text(
    "posture-time",
    p.transition > 0
      ? "TROCANDO · " + p.transition.toFixed(1) + "s"
      : p.postureCooldown > 0
        ? "RECARGA · " + p.postureCooldown.toFixed(1) + "s"
        : p.posture === "rasante"
          ? "+20% SOLO · COLETA 2,0"
          : "+15% AR · EVITA SOLO",
  );
  document
    .querySelector(".posture-button")
    ?.classList.toggle("high", p.posture === "alta");
  const convoyLabels = document.getElementById("convoy-labels");
  if (convoyLabels)
    convoyLabels.innerHTML = w.convoys
      .filter((c) => c.active && c.hp > 0)
      .map(
        (c) =>
          `<div class="rescue-label convoy-label" style="left:${((c.x + 8) / 16) * 100}%;top:${((14 - c.y - 1.9) / 28) * 100}%">◈ MUNIÇÃO · ${Math.ceil(c.hp)}</div>`,
      )
      .join("");
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
  if (be) be.innerHTML = bossHud(w);
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
      `<div class="eyebrow">Voo suspenso</div><h2>Respire.<br>O céu espera.</h2><p>Simulação, resgates e ataques estão pausados.</p><div class="stack">${btn("resume", "CONTINUAR VOO", "primary")}${btn("restart-confirm", "REINICIAR MISSÃO")}${btn("pause-controls", "CONTROLES")}${btn("pause-options", "OPÇÕES")}${btn("hangar-confirm", "VOLTAR AO HANGAR")}${btn("menu-confirm", "SAIR PARA O MENU")}</div>`,
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
    {
      id: "rescue",
      name: "TODOS OS CIVIS",
      ok: win && w.rescued === w.mission.rescues.length,
    },
    { id: "survive", name: "SEM PERDER NAVE", ok: win },
    { id: "ace", name: "ÁS · SEM DANO", ok: win && w.damageTaken === 0 },
  ];
  const base = win
    ? Math.round(
        stageInfo[w.stageId].base * (record(save, w.stageId).cleared ? 0.6 : 1),
      )
    : 0;
  const bonus = win
    ? Math.round(
        base *
          ((w.rescued === w.mission.rescues.length ? 0.15 : 0) +
            (w.elimination >= 0.85 ? 0.1 : 0) +
            (w.damageTaken === 0 ? 0.1 : 0)),
      )
    : 0;
  const ammoBonus =
    win && w.stageId === "M02" && w.ammoDestroyed === 2 ? 80 : 0;
  const earned = win
    ? w.scrap + base + bonus + ammoBonus
    : Math.floor(w.scrap * 0.6);
  if (!w.debug) {
    save.scrap += earned;
    completeAttempt(
      save,
      w.stageId,
      win,
      w.score,
      medals.filter((m) => m.ok).map((m) => m.id),
    );
    store.write(save);
  }
  const out = document.getElementById("overlays")!;
  out.innerHTML = `<div class="overlay"><div class="dialog report"><div class="eyebrow">Relatório da operação / ${w.stageId}</div><h2>${win ? (w.stageId === "M02" ? "O mapa está conosco." : w.stageId === "M03" ? "O vento mudou." : "Corredor liberado.") : "Ainda há uma rota."}</h2><p>${win ? (w.stageId === "M02" ? "Suri: encontrei coordenadas de uma estação Farol no trem. A próxima rota leva à Fortaleza do Vento." : w.stageId === "M03" ? "Lina: Fortaleza libertada. Bóreas pode voltar a voar pela Aurora." : "Lina: Arkan está livre. Ícaro: trouxe peças? O motor pode ficar melhor.") : `Derrubado por: ${w.lastDamage}.<br>Saia da linha de mira antes do feixe. Use a bomba para limpar projéteis.`}</p><div class="stats-grid">${[
    ["TEMPO", time(w.time)],
    ["PRECISÃO", `${Math.round(w.accuracy * 100)}%`],
    ["RESGATES", `${w.rescued} / ${w.mission.rescues.length}`],
    ["PONTUAÇÃO", fmt(w.score)],
    ["ALVOS", `${w.kills} / ${w.spawned}`],
    ["DANO RECEBIDO", fmt(w.damageTaken)],
    ["COMBO MÁXIMO", "x" + w.maxCombo.toFixed(1).replace(".", ",")],
    ["SUBCOMPONENTES", String(w.parts + w.wingParts)],
  ]
    .map(
      ([l, v]) =>
        `<div class="stat-item"><span class="label">${l}</span><b>${v}</b></div>`,
    )
    .join(
      "",
    )}</div><div class="medals">${medals.map((m) => `<span class="medal ${m.ok ? "earned" : ""}">${m.ok ? "◆" : "◇"} ${m.name}<small>${({ clear: "Vitória no Normal", elimination: "Eliminar pelo menos 85%", rescue: `Resgatar ${w.mission.rescues.length}/${w.mission.rescues.length} civis`, survive: "Concluir sem morrer", ace: "Concluir sem sofrer dano" } as Record<string, string>)[m.id]}</small></span>`).join("")}</div><div class="label">ELIMINAÇÃO ${w.stageId}: ${w.elimination >= 0.7 ? "◆" : "◇"} 70% · ${w.elimination >= 0.95 ? "◆" : "◇"} 95% &nbsp; ${w.stageId === "M02" ? "VAGÕES" : w.stageId === "M03" ? "ROTORES" : "CANHÕES"}: ${w.parts}/${w.stageId === "M02" ? 3 : 2}${w.stageId === "M02" ? ` · MUNIÇÃO ${w.ammoDestroyed}/2 · BÔNUS +${ammoBonus}` : ""}</div>${win && w.stageId === "M03" ? `<div class="aircraft-reward">✦ A02 BÓREAS ${w.debug ? "· RECOMPENSA NA CAMPANHA" : "DESBLOQUEADA"}<small>80 HP · 9,7 un/s · esquiva reativa</small></div>` : ""}<div class="earned-scrap"><div><span class="label">${w.debug ? "TESTE · SEM GANHOS REAIS" : win ? "Sucata garantida + coleta + bônus" : "Sucata mantida · 60% da coleta"}</span><p style="margin:4px 0 0;font-size:10px">${win ? `${base} base + ${w.scrap} coleta + ${bonus + ammoBonus} bônus` : `${w.scrap} coletadas nesta tentativa`}</p></div><b>+${w.debug ? 0 : fmt(earned)}</b></div><div class="buttons">${btn("start", win ? "JOGAR NOVAMENTE" : "TENTAR NOVAMENTE", "primary")}${win && w.stageId !== "M03" ? btn("next-stage", "PRÓXIMA MISSÃO ↗") : btn("map", "MAPA")}${btn("hangar", "HANGAR")}${btn("menu", "MENU")}</div><p class="${store.status.startsWith("Não") ? "save-warning" : "label"}" style="margin-bottom:0">${store.status}</p>${store.status.startsWith("Não") ? btn("export", "EXPORTAR BACKUP") : ""}</div></div>`;
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
  if (
    ["menu", "briefing", "hangar", "options", "credits", "map"].includes(action)
  ) {
    show(action);
    return;
  }
  if (action.startsWith("map-select:")) {
    mapNode = action.split(":")[1];
    if (mapNode === "M01" || mapNode === "M02" || mapNode === "M03")
      renderer.setStage(mapNode);
    renderScreen();
    return;
  }
  if (action.startsWith("map-play:")) {
    const id = action.split(":")[1];
    if ((id === "M01" || id === "M02" || id === "M03") && available(save, id)) {
      selectedStage = id;
      renderer.setStage(id);
      show("briefing");
    }
    return;
  }
  if (action === "next-stage") {
    selectedStage = world?.stageId === "M01" ? "M02" : "M03";
    mapNode = selectedStage;
    renderer.setStage(selectedStage);
    show("briefing");
    return;
  }
  if (action.startsWith("ship:")) {
    const id = action.split(":")[1] as AircraftId;
    if ((id === "A01" || id === "A02") && shipAvailable(save, id)) {
      save.aircraft = id;
      store.write(save);
      renderer.setAircraft(id);
      renderScreen();
    }
    return;
  }
  if (action === "pause-options") {
    modal = "pause-options";
    overlay(optionsPanel(save, true));
    return;
  }
  if (action === "start") {
    if (screen === "game" && !resultPaid) return;
    start();
  } else if (action === "pause" || action === "resume") togglePause();
  else if (action === "bomb") input.bomb = true;
  else if (action === "special") input.special = true;
  else if (action === "posture") input.posture = true;
  else if (action === "sound") {
    save.settings.sound = !save.settings.sound;
    audio.setEnabled(save.settings.sound);
    store.write(save);
    if (paused && screen === "game") overlay(optionsPanel(save, true));
    else renderScreen();
  } else if (action === "export") exportSave();
  else if (action.startsWith("buy:")) {
    const k = action.split(":")[1] as Upgrade,
      n = save.upgrades[k] || 0;
    ui.insertAdjacentHTML(
      "beforeend",
      `<div class="overlay" id="purchase"><div class="dialog"><div class="eyebrow">Melhoria permanente</div><h2>${upgrades[k].name}</h2><p>${upgradeEffect(save, k, n)} → ${upgradeEffect(save, k, n + 1)}<br>Custo: ${cost(n)} sucatas. Saldo após compra: ${save.scrap - cost(n)}.</p><div class="buttons">${btn("confirm-buy:" + k, "CONFIRMAR", "primary")}${btn("cancel-buy", "VOLTAR")}</div></div></div>`,
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
      `<div class="eyebrow">Controles</div><h2>Comandos de voo</h2><p>WASD / setas: mover<br>Q / LB: Rasante ↔ Alta (0,4 s; recarga 4 s)<br>Espaço / RT / segurar mouse: tiro manual<br>Shift / A: especial (2 cargas)<br>E / B: bomba (2 cargas)<br>Esc / P / Start: pausa<br>Mouse / toque: arraste relativo<br>Resgate: mantenha-se próximo por 1,5 s.</p>${btn("back-pause", "VOLTAR À PAUSA", "primary")}`,
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
ui.addEventListener("input", (e) => {
  const el = e.target as HTMLInputElement;
  if (el.dataset.option === "music" || el.dataset.option === "effects") {
    const o = document.getElementById("out-" + el.dataset.option);
    if (o) o.textContent = el.value + "%";
  }
});
ui.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement,
    key = el.dataset.option as keyof Preferences;
  if (
    ![
      "music",
      "effects",
      "autoFire",
      "showHitbox",
      "vibration",
      "quality",
    ].includes(key)
  )
    return;
  const p = preferences(save);
  if (key === "music" || key === "effects") p[key] = Number(el.value) / 100;
  else if (key === "quality") p.quality = el.value as Preferences["quality"];
  else p[key] = el.checked;
  save.settings.options = p;
  store.write(save);
  audio.configure(p);
  renderer.configure(p);
  if (world) world.options = { ...p };
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
  for (const ev of world.events) {
    audio.sfx(ev);
    if (ev === "hit" || ev === "explosion") {
      if (!qaControl) hitStop = Math.max(hitStop, ev === "hit" ? 0.04 : 0.025);
      if (world.options.vibration && ev === "hit") input.rumble();
    }
  }
  world.events.length = 0;
  if (world.boss && !world.boss.dead && audio.mode !== "boss")
    audio.setMode("boss");
  if (world.state === "victory" || world.state === "defeat") finish();
}
function frame(now: number) {
  const delta = Math.min(0.1, (now - last) / 1000);
  last = now;
  const stopping = hitStop > 0;
  hitStop = Math.max(0, hitStop - delta);
  const alpha = clock.advance(
    delta,
    paused || screen !== "game" || stopping,
    simulate,
  );
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
      selectedStage,
      stageId: world?.stageId,
      ammoDestroyed: world?.ammoDestroyed,
      convoys: world?.convoys.map((c) => ({ ...c })),
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
      shots: world?.shots,
      hits: world?.hits,
      damageTaken: world?.damageTaken,
      scrap: world?.scrap,
      drawCalls: renderer.renderCalls,
      memory: { ...renderer.renderer.info.memory },
      visual: {
        version: "0.4.0",
        quality: renderer.quality.level,
        viewport: renderer.metrics,
      },
      save,
      loops: audio.loops.size,
      music: {
        stage: audio.stage,
        mode: audio.mode,
        buses: audio.buses.length,
      },
      options: preferences(save),
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
