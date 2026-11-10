export const upgrades = {
  cadencia: {
    name: "Sincronizador de disparo",
    max: 5,
    description: "+6% de cadência por nível",
    effect: (n: number) => `${(6 * (1 + 0.06 * n)).toFixed(2)} tiros/s`,
  },
  blindagem: {
    name: "Blindagem laminada",
    max: 5,
    description: "+10 HP por nível",
    effect: (n: number) => `${100 + 10 * n} HP`,
  },
  motor: {
    name: "Motor de íons",
    max: 4,
    description: "+3% de velocidade por nível",
    effect: (n: number) => `${(8.2 * (1 + n * 0.03)).toFixed(2)} un/s`,
  },
  canhao: {
    name: "Canhão Aurora",
    max: 5,
    description: "+10% de dano por nível",
    effect: (n: number) => `${(10 * (1 + n * 0.1)).toFixed(0)} dano`,
  },
  ima: {
    name: "Coletor magnético",
    max: 4,
    description: "+0,35 un de alcance por nível",
    effect: (n: number) => `${(1.575 + n * 0.35).toFixed(2)} un`,
  },
};
export type Upgrade = keyof typeof upgrades;
export function cost(level: number) {
  return Math.round((120 + 80 * level ** 1.5) / 10) * 10;
}
