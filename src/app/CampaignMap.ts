import { actNodes, stageInfo, type StageId } from "../data/stages";
import { record, available } from "../persistence/Campaign";
import type { Save } from "../persistence/SaveStore";
export function campaignMap(save: Save, selected: string) {
  const data = actNodes.find((n) => n.id === selected) || actNodes[0],
    implemented = selected === "M01" || selected === "M02",
    canPlay = implemented && available(save, selected),
    rec = implemented
      ? record(save, selected as StageId)
      : { cleared: false, bestScore: 0, medals: [] };
  const info = implemented ? stageInfo[selected as StageId] : null;
  const progress = ["M01", "M02"].filter(
    (id) => record(save, id as StageId).cleared,
  ).length;
  return `<section class="campaign-map"><div class="map-heading"><button data-action="menu" class="back">← MENU</button><div class="eyebrow">Ato I / Céu perdido</div><h2>Uma rota.<br>Cinco sinais.</h2><p>Campanha ${progress}/15 · Ato I ${progress}/5<br>Versão atual: duas missões jogáveis.</p></div><div class="route">${actNodes
    .map((n, i) => {
      const live = n.id === "M01" || n.id === "M02",
        r = live ? record(save, n.id as StageId) : null,
        open = live && available(save, n.id);
      return `<button data-action="map-select:${n.id}" class="route-node ${selected === n.id ? "selected" : ""} ${open ? "open" : "locked"}"><span class="node-number">${String(i + 1).padStart(2, "0")}</span><span class="node-copy"><b>${n.name}</b><small>${r?.cleared ? "CONCLUÍDA" : open ? "ROTA DISPONÍVEL" : live ? "CONCLUA M01 NO NORMAL" : "EM PRODUÇÃO"} · RECORDE ${r?.bestScore || 0}</small><span class="node-medals">${["clear", "elimination", "rescue", "survive", "ace"].map((m) => (r?.medals.includes(m) ? "◆" : "◇")).join(" ")}</span></span><span class="node-arrow">${open ? "↗" : "◇"}</span></button>`;
    })
    .join(
      "",
    )}</div><div class="map-card"><div class="eyebrow">Inteligência / ${data.id}</div><h2>${data.name}</h2><p>${data.brief}</p><div class="rule"></div><div class="map-facts"><div><span class="label">Cenário</span><b>${info?.biome || "Rota não liberada"}</b></div><div><span class="label">Ameaça central</span><b>${info?.boss || "Dados incompletos"}</b></div><div><span class="label">Melhor pontuação</span><b>${rec.bestScore.toLocaleString("pt-BR")}</b></div><div><span class="label">Medalhas</span><b>${rec.medals.length} / 5</b></div></div><p class="map-note">${!implemented ? "Esta missão será construída nas próximas versões." : !canPlay ? "Vença Ruínas de Arkan no Normal. Não é necessário conseguir todas as medalhas." : info?.intro}</p><button data-action="map-play:${data.id}" class="primary" ${canPlay ? "" : "disabled"}>${canPlay ? "JOGAR · VER BRIEFING ↗" : implemented ? "ROTA BLOQUEADA" : "EM PRODUÇÃO"}</button></div></section>`;
}
