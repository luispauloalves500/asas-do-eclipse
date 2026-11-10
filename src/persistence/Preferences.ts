export interface Preferences {
  music: number;
  effects: number;
  autoFire: boolean;
  showHitbox: boolean;
  vibration: boolean;
  quality: "auto" | "baixa" | "media" | "alta";
}
export const defaults: Preferences = {
  music: 0.65,
  effects: 0.8,
  autoFire: true,
  showHitbox: true,
  vibration: false,
  quality: "auto",
};
export function preferences(s: {
  settings: { options?: Partial<Preferences> };
}): Preferences {
  return normalizePreferences(s.settings.options);
}
export function normalizePreferences(raw: any): Preferences {
  const p = { ...defaults };
  if (!raw || typeof raw !== "object") return p;
  for (const key of ["music", "effects"] as const)
    if (typeof raw[key] === "number" && Number.isFinite(raw[key]))
      p[key] = Math.max(0, Math.min(1, raw[key]));
  for (const key of ["autoFire", "showHitbox", "vibration"] as const)
    if (typeof raw[key] === "boolean") p[key] = raw[key];
  if (["auto", "baixa", "media", "alta"].includes(raw.quality))
    p.quality = raw.quality;
  return p;
}
