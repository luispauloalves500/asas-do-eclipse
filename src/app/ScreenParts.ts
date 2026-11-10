import type { Save } from "../persistence/SaveStore";
import { aircraft, selectedAircraft, shipAvailable } from "../data/aircraft";
import { upgrades, type Upgrade, cost } from "../data/upgrades";
import { stageInfo, stages, type StageId } from "../data/stages";
import { preferences } from "../persistence/Preferences";
import type { World } from "../gameplay/World";
const number = (n: number, d = 0) =>
  n.toLocaleString("pt-BR", { maximumFractionDigits: d });
export function upgradeEffect(save: Save, key: Upgrade, n: number) {
  const a = aircraft[selectedAircraft(save)];
  if (key === "motor") return number(a.speed * (1 + 0.03 * n), 2) + " un/s";
  if (key === "canhao")
    return number(10 * a.damage * (1 + 0.1 * n), 1) + " dano";
  if (key === "blindagem") return a.hp + 10 * n + " HP";
  if (key === "cadencia") return number(6 * (1 + 0.06 * n), 2) + " tiros/s";
  return `R ${number(2 + 0.35 * n, 2)} / A ${number(1.5 * (1 + 0.05 * (selectedAircraft(save) === "A01" ? 1 : 0)) + 0.35 * n, 2)}`;
}
export function hangarScreen(save: Save) {
  const id = selectedAircraft(save),
    a = aircraft[id];
  return `<section class="hangar-v4"><header><div><button data-action="menu" class="back">← MENU</button><div class="eyebrow">Ícaro / Oficina da Aurora</div><h2>Seu próximo voo.</h2></div><div class="balance">◈ ${number(save.scrap)}<small>SUCATAS DISPONÍVEIS</small></div></header><div class="aircraft-list"><div class="label">Aeronaves</div>${(["A01", "A02"] as const).map((key) => `<button data-action="ship:${key}" class="aircraft-card ${key === id ? "selected" : ""}" ${shipAvailable(save, key) ? "" : "disabled"}><small>${key} / ${key === id ? "EQUIPADA" : shipAvailable(save, key) ? "DISPONÍVEL" : "VENÇA M03"}</small><b>${aircraft[key].name.toUpperCase()}</b><span>${aircraft[key].role}</span><small>${aircraft[key].hp} HP · ${number(aircraft[key].speed, 1)} un/s</small></button>`).join("")}<p>Trocar não compra nada.<br>Melhorias globais servem para ambas as naves.</p><button data-action="briefing" class="primary">PREPARAR MISSÃO ↗</button></div><div class="ship-window"><div class="preview-title"><span class="label">${id} / Modelo 3D</span><h3>${a.name.toUpperCase()}</h3><p>${a.passive}</p></div><div class="ship-stats">${[
    [
      "Integridade",
      upgradeEffect(save, "blindagem", save.upgrades.blindagem || 0),
    ],
    ["Velocidade", upgradeEffect(save, "motor", save.upgrades.motor)],
    ["Canhão", upgradeEffect(save, "canhao", save.upgrades.canhao)],
    ["Cadência", upgradeEffect(save, "cadencia", save.upgrades.cadencia || 0)],
  ]
    .map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`)
    .join(
      "",
    )}</div></div><div class="upgrade-tree"><div class="eyebrow">Melhorias globais / cinco sistemas</div>${(
    Object.keys(upgrades) as Upgrade[]
  )
    .map((k) => {
      const u = upgrades[k],
        n = save.upgrades[k] || 0;
      return `<div class="upgrade-card"><div class="upgrade-heading"><h3>${u.name}</h3><span>${n}/${u.max}</span></div><p>${u.description}</p><div class="level-track">${Array.from({ length: u.max }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</div><div class="stat-comparison"><b>${upgradeEffect(save, k, n)}</b><span>→</span><b class="gold">${n === u.max ? "MÁXIMO" : upgradeEffect(save, k, n + 1)}</b></div><button data-action="buy:${k}" ${n >= u.max || save.scrap < cost(n) ? "disabled" : ""}>${n === u.max ? "NO MÁXIMO" : `MELHORAR <small>◈ ${cost(n)}</small>`}</button></div>`;
    })
    .join(
      "",
    )}<p class="economy-note">Primeira vitória: M01 300 · M02 410 · M03 520 + coleta e bônus. Em derrota, mantém 60% da coleta.</p></div></section>`;
}
export function briefingScreen(save: Save, id: StageId) {
  const info = stageInfo[id],
    a = aircraft[selectedAircraft(save)];
  const intel = {
    M01: "Canhões laterais: 200 HP cada. Núcleo: 600 HP. Desarmar as laterais reduz fogo AA. Afaste-se do feixe central.",
    M02: "Três vagões de 200 HP e reator de 900 HP. As juntas douradas recebem dano modular. Minas → jato elétrico → corridas anunciadas.",
    M03: "Rotores: 240 HP cada. Fuselagem: 900 HP. Mísseis guiam por 1,2 s; depois são balísticos. Vento apenas visual no Normal; espirais com brechas.",
  };
  return `<section class="briefing-v4"><div class="briefing-copy"><button data-action="map" class="back">← MAPA</button><div class="eyebrow">${id} / ${info.biome}</div><h2>${info.name}</h2><p>${info.intro}</p><div class="briefing-facts"><div><small>Duração</small><b>${info.duration}</b></div><div><small>Aeronave</small><b>${a.name} · Normal</b></div></div><div class="objectives"><div class="eyebrow">Objetivos da operação</div><p>◇ Derrotar ${info.boss}.</p><p>◇ Resgatar ${stages[id].rescues.length} civis · 1,5 s dentro do círculo.</p><p>◇ ${id === "M02" ? "Destruir dois vagões de munição antes da fuga." : id === "M03" ? "Aprender Rasante/Alta e liberar A02 Bóreas." : "Eliminar ≥85% dos alvos para a medalha."}</p></div><div class="briefing-threats"><span class="label">Ameaças identificadas</span><p>${info.risk}</p></div><div class="buttons"><button data-action="start" class="primary">INICIAR VOO ↗</button><button data-action="hangar">PREPARAR NAVE</button></div></div><div class="intel-column"><div class="intel-window"><span class="label">RECONHECIMENTO / MODELO 3D</span></div><div class="boss-intel"><span class="eyebrow">Inteligência do chefe</span><h3>${info.boss.toUpperCase()}</h3><p>${intel[id]}</p><small>Aviso de entrada · transição de até 1,5 s · destruir módulos desliga ataques.</small></div></div></section>`;
}
export function optionsPanel(save: Save, pause = false) {
  const p = preferences(save);
  return `<div class="options-content"><div class="eyebrow">Configuração de voo</div><h2>Do seu jeito.</h2><div class="settings-grid"><fieldset><legend>Áudio</legend>${(["music", "effects"] as const).map((k) => `<label class="range-option"><span>${k === "music" ? "Música" : "Efeitos"} <output id="out-${k}">${Math.round(p[k] * 100)}%</output></span><input aria-label="${k === "music" ? "Volume música" : "Volume efeitos"}" data-option="${k}" type="range" min="0" max="100" step="5" value="${Math.round(p[k] * 100)}"></label>`).join("")}<button data-action="sound">ÁUDIO: ${save.settings.sound ? "LIGADO" : "DESLIGADO"}</button></fieldset><fieldset><legend>Voo e visual</legend>${(["autoFire", "showHitbox", "vibration"] as const).map((k) => `<label class="switch-option"><span>${{ autoFire: "Disparo automático", showHitbox: "Mostrar hitbox", vibration: "Vibração (quando suportada)" }[k]}</span><input data-option="${k}" type="checkbox" ${p[k] ? "checked" : ""}></label>`).join("")}<label class="select-option">Qualidade<select data-option="quality">${[
    ["auto", "Automática"],
    ["baixa", "Baixa"],
    ["media", "Média"],
    ["alta", "Alta"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${p.quality === v ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></label><small>A qualidade adapta o custo visual em FPS baixo; nunca reduz projéteis ou altera física.</small></fieldset></div><p class="controls-summary">WASD / setas / arrastar: mover · Espaço / RT: tiro manual<br>Q / LB: altitude · Shift / A: raio · E / B: bomba · P / Esc: pausa<br>Rasante: +20% contra solo, coleta 2,0. Alta: +15% contra ar, ignora perigos SOLO. Troca: 0,4 s, sem imunidade; recarga de 4 s.</p><div class="buttons"><button data-action="${pause ? "back-pause" : "menu"}" class="primary">${pause ? "VOLTAR À PAUSA" : "← VOLTAR"}</button><button data-action="export">EXPORTAR SAVE</button></div></div>`;
}
export function bossHud(w: World) {
  const b = w.boss;
  if (!b) return "";
  const name = stageInfo[w.stageId].boss.toUpperCase();
  if (b.dead)
    return `<div class="safe-zone"><b>ROTA LIBERADA</b><span>ZONA SEGURA · recolha as peças</span><i style="width:${Math.min(100, (b.deathTime / 3.5) * 100)}%"></i></div>`;
  const max = w.stageId === "M01" ? 600 : 900,
    parts = b.cars
      ? b.cars.map((c, i) => ({
          label: i === 0 ? "Reator" : "Vagão " + i,
          hp: c.hp,
          max: c.maxHp,
        }))
      : [
          {
            label: w.stageId === "M03" ? "Rotor E" : "Canhão E",
            hp: b.left,
            max: w.stageId === "M03" ? 240 : 200,
          },
          { label: "Núcleo", hp: b.hp, max },
          {
            label: w.stageId === "M03" ? "Rotor D" : "Canhão D",
            hp: b.right,
            max: w.stageId === "M03" ? 240 : 200,
          },
        ];
  return `${b.age < 2.7 ? `<div class="boss-alert"><small>ASSINATURA HOSTIL DETECTADA</small><strong>ALERTA</strong><span>${name}</span></div>` : ""}<div class="boss-hud"><div class="boss-name"><b>${name}</b><span class="phase-dots">${[1, 2, 3].map((p) => `<i class="${b.phase === p ? "current" : ""}">${p}</i>`).join("")}</span></div><div class="bar main-boss-bar"><i style="width:${(b.hp / max) * 100}%"></i></div><div class="part-bars">${parts.map((p) => `<span class="${p.hp === 0 ? "destroyed" : ""}">${p.label} · ${Math.ceil(p.hp)}<div class="bar"><i style="width:${(p.hp / p.max) * 100}%"></i></div></span>`).join("")}</div><div class="boss-status">${b.invul > 0 ? "BLINDAGEM EM TRANSIÇÃO · " + b.invul.toFixed(1) + " s" : w.stageId === "M03" && b.phase === 2 ? "VENTO VISUAL · CONTROLES PRESERVADOS" : "PONTOS FRACOS EXPOSTOS"} · FASE ${b.phase}</div></div>`;
}
