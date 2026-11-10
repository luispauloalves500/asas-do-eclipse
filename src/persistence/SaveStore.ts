import { upgrades, cost, type Upgrade } from "../data/upgrades";
export interface Save {
  schemaVersion: 2;
  scrap: number;
  upgrades: Record<Upgrade, number>;
  cleared: boolean;
  bestScore: number;
  medals: string[];
  settings: { sound: boolean };
  attempts: number;
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
    s.upgrades[k] = finite(
      d.upgrades?.[k] ?? d.hangar?.globalUpgrades?.[k],
      upgrades[k].max,
    );
  s.medals = Array.isArray(d.medals)
    ? d.medals.filter((m: unknown) => typeof m === "string").slice(0, 8)
    : [];
  s.settings.sound = d.settings?.sound !== false;
  return s;
}
export function buy(s: Save, k: Upgrade) {
  const n = s.upgrades[k],
    price = cost(n);
  if (n >= upgrades[k].max || s.scrap < price) return false;
  s.scrap -= price;
  s.upgrades[k]++;
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
