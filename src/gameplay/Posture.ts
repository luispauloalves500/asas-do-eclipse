export type Posture = "rasante" | "alta";
export interface FlightPosture {
  posture: Posture;
  targetPosture: Posture;
  transition: number;
  postureCooldown: number;
  altitude: number;
  invul: number;
}
export function advancePosture(p: FlightPosture, dt: number, pressed = false) {
  p.postureCooldown = Math.max(0, p.postureCooldown - dt);
  if (pressed && p.postureCooldown === 0 && p.transition === 0) {
    p.targetPosture = p.posture === "rasante" ? "alta" : "rasante";
    p.transition = 0.4;
    p.postureCooldown = 4;
  }
  if (p.transition > 0) {
    p.transition = Math.max(0, p.transition - dt);
    const t = 1 - p.transition / 0.4;
    p.altitude = p.targetPosture === "alta" ? t : 1 - t;
    if (p.transition < 1e-8) {
      p.transition = 0;
      p.posture = p.targetPosture;
      p.altitude = p.posture === "alta" ? 1 : 0;
    }
  }
}
export function postureDamage(
  posture: Posture,
  ground: boolean,
  damage: number,
) {
  return (
    damage *
    (ground ? (posture === "rasante" ? 1.2 : 1) : posture === "alta" ? 1.15 : 1)
  );
}
export function hazardHits(
  posture: Posture,
  hazard: "universal" | "ground_only",
) {
  return hazard !== "ground_only" || posture !== "alta";
}
