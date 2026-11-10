import { describe, it, expect, beforeEach, vi } from "vitest";
import { Clock } from "../core/Clock";
import {
  overlaps,
  SpatialHash,
  segmentDistance,
} from "../gameplay/Collision2D";
import { rescueProgress } from "../gameplay/RescueSystem";
import { SaveStore, fresh, migrate, buy } from "../persistence/SaveStore";
import { World } from "../gameplay/World";
import { BulletPool } from "../gameplay/EntityPool";
import mission from "../data/stages/M01.json";
import { InputRouter } from "../input/InputRouter";
import { viewport } from "../core/Viewport";
import { Quality } from "../render/Quality";
const none = { x: 0, y: 0, special: false, bomb: false };
describe("Relógio fixo", () => {
  for (const fps of [30, 60, 120])
    it(`simulação igual em ${fps} fps`, () => {
      const c = new Clock();
      let x = 0;
      for (let i = 0; i < fps * 10; i++)
        c.advance(1 / fps, false, (dt) => (x += 8.2 * dt));
      expect(x).toBeCloseTo(82, 7);
    });
  it("limita catch-up a 0,1 s e pausa integralmente", () => {
    const c = new Clock();
    let ticks = 0;
    c.advance(5, false, () => ticks++);
    expect(ticks).toBe(6);
    c.advance(10, true, () => ticks++);
    expect(ticks).toBe(6);
    c.reset();
    expect(c.accumulator).toBe(0);
  });
});
describe("Colisão XY", () => {
  it("trata tangência e margem", () => {
    expect(
      overlaps(
        { id: 1, x: 0, y: 0, r: 0.33 },
        { id: 2, x: 0.52, y: 0, r: 0.19 },
      ),
    ).toBe(true);
    expect(
      overlaps(
        { id: 1, x: 0, y: 0, r: 0.33 },
        { id: 2, x: 0.53, y: 0, r: 0.19 },
      ),
    ).toBe(false);
  });
  it("hash retorna cada entidade uma vez através das bordas", () => {
    const h = new SpatialHash();
    h.insert({ id: 3, x: 2, y: 2, r: 1.4 });
    h.insert({ id: 4, x: 9, y: 9, r: 0.2 });
    const set = h.query({ id: 1, x: 1, y: 1, r: 0.5 });
    expect([...set].map((x) => x.id)).toEqual([3]);
  });
  it("laser mede segmento, não reta infinita", () => {
    expect(segmentDistance(1, 2, 0, 0, 0, 4)).toBe(1);
    expect(segmentDistance(0, 7, 0, 0, 0, 4)).toBe(3);
  });
  it("pool reutiliza projéteis e bomba respeita clearable", () => {
    const p = new BulletPool(),
      b = p.spawn(0, 0, 0, 1, false, 10, "test"),
      c = p.spawn(0, 0, 0, 1, false, 10, "test", false);
    p.clear(true);
    expect(b.active).toBe(false);
    expect(c.active).toBe(true);
    expect(p.spawn(0, 0, 0, 1, true, 10, "test")).toBe(b);
  });
});
describe("Resgate", () => {
  it("requer 1,5 s dentro e decai gradualmente", () => {
    let p = rescueProgress(0, true, 0.75);
    expect(p).toBe(0.5);
    p = rescueProgress(p, false, 0.3);
    expect(p).toBeCloseTo(0.4);
    expect(rescueProgress(p, true, 0.9)).toBe(1);
    expect(rescueProgress(0.1, false, 5)).toBe(0);
  });
  it("três resgates cabem antes da entrada do chefe", () => {
    expect(mission.rescues).toHaveLength(3);
    expect(mission.rescues.at(-1)!.atSeconds + 34).toBeLessThan(
      mission.bossEntryAtSeconds,
    );
  });
});
describe("Save e melhorias", () => {
  beforeEach(() => {
    const data = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => data.get(k) || null,
      setItem: (k: string, v: string) => data.set(k, v),
      removeItem: (k: string) => data.delete(k),
    });
  });
  it("migra v1 preservando desbloqueios e economia", () => {
    const s = migrate({
      schemaVersion: 1,
      economy: { scrap: 425 },
      campaign: { cleared: { M01: true } },
      hangar: { globalUpgrades: { motor: 2, ima: 1 } },
      settings: { sound: false },
    });
    expect(s.schemaVersion).toBe(2);
    expect(s.cleared).toBe(true);
    expect(s.scrap).toBe(425);
    expect(s.upgrades.motor).toBe(2);
    expect(s.settings.sound).toBe(false);
  });
  it("grava, carrega e recupera backup após corrupção", () => {
    const st = new SaveStore(),
      s = fresh();
    s.scrap = 321;
    expect(st.write(s)).toBe(true);
    s.scrap = 400;
    st.write(s);
    expect(st.load().scrap).toBe(400);
    localStorage.setItem(st.key, "oops");
    expect(st.load().scrap).toBe(321);
    expect(st.status).toContain("Backup");
  });
  it("dados inválidos não causam valores negativos ou upgrades infinitos", () => {
    const s = migrate({
      schemaVersion: 2,
      scrap: -2,
      upgrades: { motor: 900, canhao: -2, ima: "8" },
    });
    expect(s.scrap).toBe(0);
    expect(s.upgrades).toEqual({ motor: 4, canhao: 0, ima: 0 });
    expect(() => migrate({ schemaVersion: 99 })).toThrow();
  });
  it("compra atômica, limite e efeito perceptível", () => {
    const s = fresh();
    expect(buy(s, "motor")).toBe(false);
    s.scrap = 1000;
    const before = new World(s);
    expect(buy(s, "motor")).toBe(true);
    expect(s.scrap).toBe(880);
    expect(new World(s).speed).toBeGreaterThan(before.speed);
    s.upgrades.motor = 4;
    expect(buy(s, "motor")).toBe(false);
  });
});
describe("M01 / regras de combate", () => {
  it("dano simultâneo conta uma vez e identifica origem", () => {
    const w = new World(fresh());
    for (let i = 0; i < 20; i++) w.hurt(15, "Vespa", 4);
    expect(w.player.hp).toBe(85);
    expect(w.damageLog).toHaveLength(1);
    expect(w.damageLog[0].entityId).toBe(4);
  });
  it("movimento normalizado e clamp impedem sair do campo", () => {
    const w = new World(fresh());
    for (let i = 0; i < 600; i++)
      w.tick(1 / 60, { ...none, x: Math.SQRT1_2, y: Math.SQRT1_2 });
    expect(w.player.x).toBeCloseTo(6.87);
    expect(w.player.y).toBeCloseTo(6.67);
  });
  it("módulo não duplica dano no núcleo e deixa de disparar", () => {
    const w = new World(fresh());
    w.startBoss();
    w.boss!.invul = 0;
    w.hitBoss("left", 200);
    expect(w.boss!.left).toBe(0);
    expect(w.boss!.hp).toBe(600);
    expect(w.parts).toBe(1);
    w.boss!.phase = 2;
    w.boss!.y = 6.5;
    w.boss!.cycle = 0;
    w.updateBoss(1 / 60);
    expect(w.lasers.some((l) => l.owner === -2)).toBe(false);
    expect(w.lasers.some((l) => l.owner === -3)).toBe(true);
  });
  it("fases têm transição limitada e grande dano no limiar não trava", () => {
    const w = new World(fresh());
    w.startBoss();
    w.boss!.invul = 0;
    w.hitBoss("core", 220);
    expect(w.boss!.phase).toBe(2);
    expect(w.boss!.invul).toBeLessThanOrEqual(1.5);
    w.boss!.invul = 0;
    w.hitBoss("core", 210);
    expect(w.boss!.phase).toBe(3);
    w.boss!.invul = 0;
    w.hitBoss("core", 9999);
    expect(w.boss!.dead).toBe(true);
    for (let i = 0; i < 220; i++) w.tick(1 / 60, none);
    expect(w.state).toBe("victory");
    expect(w.pool.items.some((b) => b.active)).toBe(false);
  });
  it("morte mostra derrota após câmera lenta sem reiniciar", () => {
    const w = new World(fresh());
    w.hurt(100, "Laser", 2);
    expect(w.state).toBe("dying");
    for (let i = 0; i < 34; i++) w.tick(1 / 60, none);
    expect(w.state).toBe("defeat");
    expect(w.time).toBe(0);
  });
  it("Raio Lança e bomba consomem cargas apenas uma vez por comando", () => {
    const w = new World(fresh());
    w.tick(1 / 60, { ...none, special: true, bomb: true });
    expect(w.player.specials).toBe(1);
    expect(w.player.bombs).toBe(1);
    expect(w.player.beam).toBe(1.2);
    w.tick(1 / 60, none);
    expect(w.player.specials).toBe(1);
    expect(w.player.bombs).toBe(1);
  });
});

describe("Entrada relativa", () => {
  it("preserva gesto rápido entre ticks e respeita bordas", () => {
    const win = new EventTarget(),
      stage = new EventTarget() as EventTarget & {
        clientHeight: number;
        setPointerCapture: () => void;
      };
    stage.clientHeight = 1000;
    stage.setPointerCapture = () => {};
    vi.stubGlobal("window", win);
    vi.stubGlobal("navigator", { getGamepads: () => [] });
    const input = new InputRouter(stage as unknown as HTMLElement, () => {}),
      w = new World(fresh());
    const pointer = (type: string, x: number, y: number) =>
      stage.dispatchEvent(
        Object.assign(new Event(type), {
          button: 0,
          pointerId: 1,
          clientX: x,
          clientY: y,
        }),
      );
    pointer("pointerdown", 100, 300);
    pointer("pointermove", 200, 300);
    pointer("pointerup", 200, 300);
    for (let i = 0; i < 90; i++) {
      const x = w.player.x,
        y = w.player.y;
      w.tick(1 / 60, input.sample(1 / 60, w.speed));
      input.consumeDrag(w.player.x - x, w.player.y - y, w.player.x, w.player.y);
    }
    expect(w.player.x).toBeCloseTo(2.8, 1);
    input.pointerDriven = true;
    input.dragX = 50;
    input.consumeDrag(0, 0, 6.87, -9);
    expect(input.dragX).toBe(0);
    vi.unstubAllGlobals();
  });
});

// v0.2 presentation regressions do not alter the combat simulation.
describe("Viewport e qualidade v0.2", () => {
  it("mantém 16×28 inteiros e preenche 16:9 com mundo estendido", () => {
    const v = viewport(1600, 900);
    expect(v.fieldHeight).toBeCloseTo(900);
    expect(v.fieldWidth).toBeCloseTo((900 * 16) / 28);
    expect(v.worldWidth).toBeGreaterThan(16);
    expect(v.worldHeight).toBeCloseTo(28);
  });
  it("em retrato mantém campo completo e estende mundo acima/abaixo", () => {
    const v = viewport(390, 844);
    expect(v.fieldWidth).toBe(390);
    expect(v.fieldHeight).toBe(682.5);
    expect(v.worldWidth).toBe(16);
    expect(v.worldHeight).toBeGreaterThan(28);
  });
  it("reduz só apresentação sob frame time alto", () => {
    const q = new Quality();
    for (let i = 0; i < 240; i++) q.sample(1 / 20);
    expect(q.level).toBeLessThan(1);
    expect(q.level).toBeGreaterThanOrEqual(0.55);
    const before = q.level;
    q.sample(0);
    expect(q.level).toBe(before);
  });
  it("save real v0.1 permanece compatível sem perda de saldo, medalhas ou upgrades", () => {
    const legacy = {
      schemaVersion: 2,
      scrap: 465,
      upgrades: { motor: 2, canhao: 1, ima: 3 },
      cleared: true,
      bestScore: 12775,
      medals: ["clear", "rescue", "survive"],
      settings: { sound: false },
      attempts: 4,
    };
    expect(migrate(legacy)).toEqual(legacy);
  });
});
