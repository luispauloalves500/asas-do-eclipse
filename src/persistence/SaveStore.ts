import { normalizePreferences, type Preferences } from "./Preferences";
import type { AircraftId } from "../data/aircraft";
import type { Campaign } from "./Campaign";
import { upgrades, cost, type Upgrade } from "../data/upgrades";
export interface Save {
  schemaVersion: 2;
  scrap: number;
  upgrades: Record<"motor" | "canhao" | "ima", number> &
    Partial<Record<"cadencia" | "blindagem", number>>;
  cleared: boolean;
  bestScore: number;
  medals: string[];
  settings: { sound: boolean; options?: Preferences };
  aircraft?: AircraftId;
  attempts: number;
  campaign?: Campaign;
}
export const fresh = (): Save => ({
  schemaVersion: 2,
  scrap: 0,
  upgrades: { motor: 0, canhao: 0, ima: 0 },
  cleared: false,
  bestScore: 0,
  medals: [],
  settings: { sound: true },
  attempts: 0,
});
const finite = (v: unknown, max = 1e9) =>
  typeof v === "number" && Number.isFinite(v)
    ? Math.min(max, Math.max(0, Math.floor(v)))
    : 0;
export function migrate(raw: unknown): Save {
  if (!raw || typeof raw !== "object") throw new Error("Save inválido");
  const d = raw as Record<string, any>;
  if (d.schemaVersion !== 1 && d.schemaVersion !== 2)
    throw new Error("Versão desconhecida");
  const s = fresh();
  s.scrap = finite(d.scrap ?? d.economy?.scrap);
  s.cleared = !!(d.cleared ?? d.campaign?.cleared?.M01);
  s.bestScore = finite(d.bestScore);
  s.attempts = finite(d.attempts);
  for (const k of Object.keys(upgrades) as Upgrade[])
    if (["motor", "canhao", "ima"].includes(k) || d.upgrades?.[k] !== undefined)
      s.upgrades[k] = finite(
        d.upgrades?.[k] ?? d.hangar?.globalUpgrades?.[k],
        upgrades[k].max,
      );
  s.medals = Array.isArray(d.medals)
    ? d.medals.filter((m: unknown) => typeof m === "string").slice(0, 8)
    : [];
  s.settings.sound = d.settings?.sound !== false;
  if (d.settings?.options)
    s.settings.options = normalizePreferences(d.settings.options);
  if (d.campaign?.stages) {
    s.campaign = {
      lastStage: ["M01", "M02", "M03"].includes(d.campaign.lastStage)
        ? d.campaign.lastStage
        : "M01",
      stages: {},
    };
    for (const id of ["M01", "M02", "M03"] as const) {
      const v = d.campaign.stages[id];
      if (v && typeof v === "object")
        s.campaign.stages[id] = {
          cleared: v.cleared === true,
          bestScore: finite(v.bestScore),
          medals: Array.isArray(v.medals)
            ? v.medals.filter((m: unknown) => typeof m === "string").slice(0, 8)
            : [],
        };
    }
    if (s.campaign.stages.M01) {
      s.cleared = s.campaign.stages.M01.cleared;
      s.bestScore = s.campaign.stages.M01.bestScore;
      s.medals = [...s.campaign.stages.M01.medals];
    }
    if (s.campaign.lastStage === "M02" && !s.cleared)
      s.campaign.lastStage = "M01";
  }
  if (s.campaign?.lastStage === "M03" && !s.campaign.stages.M02?.cleared)
    s.campaign.lastStage = s.cleared ? "M02" : "M01";
  if (d.aircraft)
    s.aircraft =
      d.aircraft === "A02" && s.campaign?.stages.M03?.cleared ? "A02" : "A01";
  return s;
}
export function buy(s: Save, k: Upgrade) {
  const n = s.upgrades[k] || 0,
    price = cost(n);
  if (n >= upgrades[k].max || s.scrap < price) return false;
  s.scrap -= price;
  s.upgrades[k] = n + 1;
  return true;
}
export class SaveStore {
  status = "Salvo localmente";
  key = "aurora.asas.save";
  load() {
    for (const key of [this.key, this.key + ".backup"])
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const s = migrate(JSON.parse(raw));
          if (key.endsWith("backup")) this.status = "Backup recuperado";
          return s;
        }
      } catch {
        this.status = "Save inválido; usando backup";
      }
    return fresh();
  }
  write(s: Save) {
    try {
      const text = JSON.stringify(s);
      migrate(JSON.parse(text));
      localStorage.setItem(this.key + ".pending", text);
      const old = localStorage.getItem(this.key);
      if (old) localStorage.setItem(this.key + ".backup", old);
      localStorage.setItem(this.key, text);
      localStorage.removeItem(this.key + ".pending");
      this.status = "Salvo localmente";
      return true;
    } catch {
      this.status = "Não foi possível salvar. Exporte um backup.";
      return false;
    }
  }
}
