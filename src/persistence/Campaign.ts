import type { Save } from "./SaveStore";
import type { StageId } from "../data/stages";
export interface StageRecord {
  cleared: boolean;
  bestScore: number;
  medals: string[];
}
export interface Campaign {
  stages: Partial<Record<StageId, StageRecord>>;
  lastStage: StageId;
}
export const emptyRecord = (): StageRecord => ({
  cleared: false,
  bestScore: 0,
  medals: [],
});
/** Lazy additive migration: legacy M01 fields remain authoritative until a stage record exists. */
export function record(s: Save, id: StageId): StageRecord {
  return (
    s.campaign?.stages[id] ||
    (id === "M01"
      ? { cleared: s.cleared, bestScore: s.bestScore, medals: s.medals }
      : emptyRecord())
  );
}
export function available(s: Save, id: string) {
  return id === "M01" || (id === "M02" && record(s, "M01").cleared);
}
export function rememberStage(s: Save, id: StageId) {
  if (!s.campaign)
    s.campaign = {
      stages: { M01: { ...record(s, "M01"), medals: [...s.medals] } },
      lastStage: id,
    };
  s.campaign.lastStage = id;
}
export function completeAttempt(
  s: Save,
  id: StageId,
  won: boolean,
  score: number,
  medals: string[],
) {
  const before = record(s, id);
  rememberStage(s, id);
  s.campaign!.stages[id] = {
    cleared: before.cleared || won,
    bestScore: Math.max(before.bestScore, score),
    medals: [...new Set([...before.medals, ...medals])],
  };
  if (id === "M01") {
    s.cleared = s.campaign!.stages.M01!.cleared;
    s.bestScore = s.campaign!.stages.M01!.bestScore;
    s.medals = [...s.campaign!.stages.M01!.medals];
  }
  s.attempts++;
}
