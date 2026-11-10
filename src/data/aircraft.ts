import type { Save } from "../persistence/SaveStore";
export type AircraftId = "A01" | "A02";
export const aircraft = {
  A01: {
    name: "Véspera",
    role: "Caça de resistência",
    hp: 100,
    speed: 8.2,
    damage: 1,
    passive: "Coletor de longo alcance · estável e resistente",
  },
  A02: {
    name: "Bóreas",
    role: "Interceptador leve",
    hp: 80,
    speed: 9.7,
    damage: 0.92,
    passive: "+10% cadência por 3 s após uma esquiva próxima",
  },
};
export function shipAvailable(s: Save, id: AircraftId) {
  return id === "A01" || s.campaign?.stages.M03?.cleared === true;
}
export function selectedAircraft(s: Save): AircraftId {
  return s.aircraft === "A02" && shipAvailable(s, "A02") ? "A02" : "A01";
}
