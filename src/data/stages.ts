import M01 from "./stages/M01.json";
import M02 from "./stages/M02.json";
export type StageId = "M01" | "M02";
export interface Stage {
  id: string;
  title: string;
  scrollSpeed: number;
  durationTargetSeconds: number;
  bossEntryAtSeconds: number;
  waves: { atSeconds: number; enemy: string; pattern: string; count: number }[];
  rescues: { atSeconds: number; laneX: number }[];
  repairAtSeconds: number;
  convoys?: { atSeconds: number; laneX: number }[];
}
export const stages: Record<StageId, Stage> = { M01, M02 };
export const stageInfo = {
  M01: {
    name: "Ruínas de Arkan",
    boss: "Gárgula-01",
    biome: "Vale verde / represa",
    intro:
      "A rede NÓX tomou a represa. Abra o corredor de evacuação e neutralize a plataforma antiaérea Gárgula-01.",
    risk: "Caças, tanques e torres AA",
    duration: "6–7 minutos",
    base: 300,
  },
  M02: {
    name: "Estrada de Ferro Fantasma",
    boss: "Serpente de Ferro",
    biome: "Cânion ocre / ferrovia",
    intro:
      "Siga a ferrovia pelo cânion. Resgate os técnicos nos depósitos e intercepte o comboio aerodeslizante. Suri procura coordenadas de uma estação Farol.",
    risk: "Raptor, baterias Arpão e minas Semeador",
    duration: "6–8 minutos",
    base: 410,
  },
};
export const actNodes = [
  {
    id: "M01",
    name: "Ruínas de Arkan",
    brief: "Abra a rota da represa e evacue os civis.",
  },
  {
    id: "M02",
    name: "Estrada de Ferro Fantasma",
    brief: "Atravesse o cânion e recupere o mapa da rede NÓX.",
  },
  {
    id: "M03",
    name: "Fortaleza do Vento",
    brief: "Montanhas, ventos e um duelo contra Ciclone. Em produção.",
  },
  {
    id: "M04",
    name: "Costa das Cinzas",
    brief: "Recupere o porto e encontre o primeiro sinal Farol. Em produção.",
  },
  {
    id: "M05",
    name: "O Céu Está Fechado",
    brief: "A metrópole está sitiada pelo Colosso Âmbar. Em produção.",
  },
];
