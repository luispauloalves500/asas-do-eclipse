import { describe, it, expect, vi, beforeEach } from "vitest";
import { World, torpedoLanes, laneCenter } from "../gameplay/World";
import { fresh, migrate } from "../persistence/SaveStore";
import { completeAttempt, available, record } from "../persistence/Campaign";
import {
  BASTION,
  beamSlabs,
  casemateOwner,
  hitBastion,
  updateBastion,
} from "../gameplay/BastionController";
import { isGround, enemies } from "../data/enemies";
import { stageInfo } from "../data/stages";
import m04 from "../data/stages/M04.json";
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) || null,
    setItem: (k: string, v: string) => data.set(k, v),
    removeItem: (k: string) => data.delete(k),
  });
});
const none = { x: 0, y: 0, special: false, bomb: false };
const dt = 1 / 60;
function bossReady() {
  const w = new World(fresh(), true, "M04");
  w.jumpBoss();
  w.player.invul = 999;
  for (let i = 0; i < 600 && (w.boss!.y > 7.2 || w.boss!.invul > 0); i++)
    updateBastion(w, dt);
  w.player.invul = 0;
  w.pool.clear(true);
  w.lasers = [];
  return w;
}
describe("M04 Costa das Cinzas • timeline", () => {
  it("segue baterias → Hidras/drones → docas sob fogo → Bastião", () => {
    const at = (a: number, b: number) =>
      m04.waves.filter((w) => w.atSeconds >= a && w.atSeconds < b);
    expect(at(0, 120).every((w) => ["E05", "E06"].includes(w.enemy))).toBe(
      true,
    );
    expect(at(120, 270).every((w) => ["E11", "E01"].includes(w.enemy))).toBe(
      true,
    );
    expect(
      at(120, 270).filter((w) => w.enemy === "E11").length,
    ).toBeGreaterThanOrEqual(4);
    expect(at(270, 390).some((w) => w.enemy === "E07")).toBe(true);
    expect(m04.rescues).toHaveLength(3);
    for (const r of m04.rescues) {
      expect(r.atSeconds).toBeGreaterThanOrEqual(270);
      expect(r.atSeconds + 34).toBeLessThan(m04.bossEntryAtSeconds);
    }
    expect(m04.bossEntryAtSeconds).toBe(390);
    expect(stageInfo.M04.boss).toBe("Bastião Delta");
  });
  it("torres de solo morrem com tiro normal e alvos de superfície recebem bônus Rasante", () => {
    expect(isGround("E11") && isGround("E06") && isGround("E05")).toBe(true);
    expect(isGround("E01")).toBe(false);
    const w = new World(fresh(), true, "M04");
    w.spawnEnemy("E06", 0, -4);
    for (let i = 0; i < 60 * 8 && w.enemies[0].active; i++) {
      w.enemies[0].y = -4;
      w.player.invul = 999;
      w.tick(dt, none);
    }
    expect(w.enemies[0].active).toBe(false);
    expect(w.weaponDamage(true, 100)).toBeGreaterThan(
      w.weaponDamage(false, 100),
    );
  });
});
describe("E11 Hidra • torpedos de superfície", () => {
  it("telegrafa uma pista segura de 3,8 un e o muro de torpedos a respeita", () => {
    for (const safeSide of [0, 1]) {
      const w = new World(fresh(), true, "M04");
      w.spawnEnemy("E11", 0, 9);
      const e = w.enemies[0];
      e.state = "ACQUIRE_TARGET";
      e.timer = 0;
      w.updateEnemies(dt);
      expect(e.state).toBe("TELEGRAPH");
      const band = w.lasers.find((l) => l.source === "Hidra • pista segura")!;
      expect(band.width).toBeCloseTo(3.2);
      expect(band.visualOnly).toBe(true);
      expect(band.warn + band.duration).toBeGreaterThan(4);
      expect(enemies.E11.warning).toBeGreaterThanOrEqual(1);
      const safe = e.aimX;
      w.player.y = -6;
      w.player.x = safeSide ? safe : laneCenter(e.aimY === 1 ? 4 : 0);
      for (let i = 0; i < 60 * 6; i++) {
        w.updateEnemies(dt);
        w.updateProjectiles(dt);
      }
      const torps = w.pool.items.filter((b) => b.style === "torpedo");
      expect(torps.length).toBe(7);
      if (safeSide) expect(w.player.hp).toBe(100);
      else expect(w.player.hp).toBeLessThan(100);
    }
  });
  it("faixas: 7 torpedos, corredor livre entre as faixas vizinhas", () => {
    for (let s = 1; s <= 6; s++) {
      const lanes = torpedoLanes(s),
        c = laneCenter(s) + 0.8;
      expect(lanes).toHaveLength(7);
      const nearest = Math.min(...lanes.map((x) => Math.abs(x - c)));
      expect(nearest - 0.5).toBeGreaterThanOrEqual(1.9 - 1e-9);
      expect(lanes.every((x) => Math.abs(x) <= 6.4 + 1e-9)).toBe(true);
    }
  });
  it("em Alta os torpedos passam por baixo (perigo SOLO)", () => {
    const w = new World(fresh(), true, "M04");
    w.player.posture = "alta";
    w.player.x = w.player.y = 0;
    const q = w.pool.spawn(
      0,
      0,
      0,
      0,
      false,
      22,
      "Hidra • torpedo de superfície",
    );
    q.style = "torpedo";
    q.hazard = "ground_only";
    w.updateProjectiles(dt);
    expect(w.player.hp).toBe(100);
  });
});
describe("Pressão leve e resgates sob fogo", () => {
  it("inimigo que escapa conta fuga e reduz combo sem falhar a missão", () => {
    const w = new World(fresh(), true, "M04");
    w.combo = 3;
    w.spawnEnemy("E01", 0, -16.95);
    w.updateEnemies(0.1);
    expect(w.escaped).toBe(1);
    expect(w.combo).toBeCloseTo(2.5);
    expect(w.state).toBe("playing");
  });
  it("obus telegrafa círculo ≥1,1 s sobre a nave durante o resgate e só fere quem fica", () => {
    for (const stay of [true, false]) {
      const w = new World(fresh(), true, "M04");
      w.rescues.push({
        id: 999,
        x: 5.4,
        y: -20,
        px: 5.4,
        py: -20,
        progress: 0,
        active: true,
        age: 0,
        rescued: false,
      });
      w.shellClock = 0;
      w.player.x = 1;
      w.player.y = -5;
      w.updateShelling(dt);
      const l = w.lasers.find((l) => l.shape === "circle")!;
      expect(l.warn).toBeGreaterThanOrEqual(1.1);
      expect(l.x).toBe(1);
      if (!stay) w.player.x = 3;
      for (let i = 0; i < 90; i++) w.updateLasers(dt);
      expect(w.player.hp).toBe(stay ? 80 : 100);
    }
  });
  it("câmera de aproximação limitada à cena das docas", () => {
    const w = new World(fresh(), true, "M04");
    w.time = 300;
    expect(w.approach).toBe(1);
    w.time = 100;
    expect(w.approach).toBe(0);
  });
});
describe("Bastião Delta", () => {
  it("entrada com ALERTA e blindagem ≤1,5 s; P1 AA com mira anunciada", () => {
    const w = new World(fresh(), true, "M04");
    w.jumpBoss();
    expect(w.boss!.kind).toBe("bastiao");
    expect(w.boss!.invul).toBeLessThanOrEqual(1.5);
    expect(w.boss!.casemates).toEqual([260, 260, 260]);
    const r = bossReady();
    for (let i = 0; i < 120; i++) updateBastion(r, dt);
    expect(r.lasers.some((l) => l.source === "Bastião • mira AA")).toBe(true);
    expect(
      r.pool.items.some((b) => b.active && b.source === "Bastião • torre AA"),
    ).toBe(true);
  });
  it("destruir uma casamata remove seus ataques e projéteis", () => {
    const w = bossReady();
    const stray = w.pool.spawn(-4, 5, 0, -1, false, 18, "Bastião • torre AA");
    stray.owner = casemateOwner(0);
    hitBastion(w, 0, 9999);
    expect(w.boss!.casemates![0]).toBe(0);
    expect(w.parts).toBe(1);
    expect(stray.active).toBe(false);
    expect(w.boss!.phase).toBe(2);
    expect(w.boss!.invul).toBeLessThanOrEqual(1.5);
    w.player.invul = 999;
    for (let i = 0; i < 60 * 8; i++) {
      updateBastion(w, dt);
      w.updateProjectiles(dt);
      w.updateLasers(dt);
      expect(
        w.pool.items.some((b) => b.active && b.owner === casemateOwner(0)),
      ).toBe(false);
    }
    expect(
      w.pool.items.some((b) => b.active && b.owner === casemateOwner(2)),
    ).toBe(true);
  });
  it("P3: raio da plataforma deixa brecha segura de 2,6 un com aviso", () => {
    for (const g of [-3.6, 0, 3.6]) {
      const slabs = beamSlabs(g);
      for (const s of slabs) {
        const lo = s.x - s.width / 2,
          hi = s.x + s.width / 2;
        expect(
          hi <= g - BASTION.beamGap / 2 + 1e-9 ||
            lo >= g + BASTION.beamGap / 2 - 1e-9,
        ).toBe(true);
      }
    }
    for (const inside of [true, false]) {
      const w = bossReady();
      hitBastion(w, 0, 9999);
      hitBastion(w, 2, 0); // no-op during transition
      w.boss!.invul = 0;
      hitBastion(w, 2, 9999);
      expect(w.boss!.phase).toBe(3);
      w.pool.clear(true);
      let beam = false;
      for (let i = 0; i < 60 * 12 && !beam; i++) {
        updateBastion(w, dt);
        beam = w.lasers.some((l) => l.owner === -40);
      }
      expect(beam).toBe(true);
      const ls = w.lasers.filter((l) => l.owner === -40);
      expect(ls[0].warn).toBeGreaterThanOrEqual(1);
      w.pool.clear(true);
      w.player.y = -6;
      w.player.x = inside
        ? w.boss!.gapX!
        : w.boss!.gapX! + (w.boss!.gapX! > 0 ? -3 : 3);
      for (let i = 0; i < 60 * 2.4; i++) w.updateLasers(dt);
      expect(w.player.hp).toBe(inside ? 100 : 62);
    }
  });
  it("comando destruído: sequência segura de 3,5 s, depois vitória", () => {
    const w = bossReady();
    hitBastion(w, "core", 99999);
    expect(w.boss!.dead).toBe(true);
    expect(w.boss!.casemates).toEqual([0, 0, 0]);
    for (let i = 0; i < 60 * 3; i++) w.tick(dt, none);
    expect(w.state).toBe("playing");
    for (let i = 0; i < 60; i++) w.tick(dt, none);
    expect(w.state).toBe("victory");
  });
  it("bomba atinge as três casamatas", () => {
    const w = bossReady();
    w.tick(dt, { ...none, bomb: true });
    expect(w.boss!.casemates!.every((hp) => hp < 260)).toBe(true);
  });
});
describe("Campanha M04", () => {
  it("M04 abre só após M03 e o save migra o registro", () => {
    const s = fresh();
    completeAttempt(s, "M01", true, 1, ["clear"]);
    completeAttempt(s, "M02", true, 2, ["clear"]);
    expect(available(s, "M04")).toBe(false);
    completeAttempt(s, "M03", true, 3, ["clear"]);
    expect(available(s, "M04")).toBe(true);
    completeAttempt(s, "M04", true, 4, ["clear", "rescue"]);
    const m = migrate(JSON.parse(JSON.stringify(s)));
    expect(record(m, "M04")).toMatchObject({ cleared: true, bestScore: 4 });
    expect(available(m, "M05")).toBe(false);
  });
  it("lastStage M04 sem M03 concluída volta para a rota liberada", () => {
    const s = fresh();
    completeAttempt(s, "M01", true, 1, ["clear"]);
    const m = migrate({
      ...JSON.parse(JSON.stringify(s)),
      campaign: { ...s.campaign, lastStage: "M04" },
    });
    expect(m.campaign!.lastStage).toBe("M02");
  });
});
