import { describe, it, expect, vi, beforeEach } from "vitest";
import { World } from "../gameplay/World";
import { fresh, migrate, SaveStore, buy } from "../persistence/SaveStore";
import { advancePosture, postureDamage, hazardHits } from "../gameplay/Posture";
import { preferences } from "../persistence/Preferences";
import { completeAttempt, available, record } from "../persistence/Campaign";
import { selectedAircraft, shipAvailable } from "../data/aircraft";
import m03 from "../data/stages/M03.json";
beforeEach(() => {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => data.get(k) || null,
    setItem: (k: string, v: string) => data.set(k, v),
    removeItem: (k: string) => data.delete(k),
  });
});
const none = { x: 0, y: 0, special: false, bomb: false };
describe("Postura Rasante / Alta", () => {
  it("troca em 0,4 s, cooldown 4 s e nenhuma invulnerabilidade nova", () => {
    const w = new World(fresh()),
      p = w.player;
    advancePosture(p, 0.1, true);
    expect(p.posture).toBe("rasante");
    expect(p.altitude).toBeCloseTo(0.25);
    expect(p.invul).toBe(0);
    for (let i = 0; i < 3; i++) advancePosture(p, 0.1);
    expect(p.posture).toBe("alta");
    advancePosture(p, 0.1, true);
    expect(p.targetPosture).toBe("alta");
    advancePosture(p, 3.7);
    advancePosture(p, 0.4, true);
    expect(p.posture).toBe("rasante");
  });
  it("aplica +20% solo / +15% ar sem multiplicar os dois", () => {
    expect(postureDamage("rasante", true, 100)).toBe(120);
    expect(postureDamage("alta", false, 100)).toBeCloseTo(115);
    expect(postureDamage("rasante", false, 100)).toBe(100);
    expect(postureDamage("alta", true, 100)).toBe(100);
  });
  it("perigo SOLO passa por baixo em Alta e balas universais não", () => {
    for (const posture of ["rasante", "alta"] as const) {
      const w = new World(fresh());
      w.player.posture = posture;
      w.player.x = w.player.y = 0;
      const q = w.pool.spawn(0, 0, 0, 0, false, 20, "solo");
      q.hazard = "ground_only";
      w.updateProjectiles(1 / 60);
      expect(w.player.hp).toBe(posture === "alta" ? 100 : 80);
      expect(hazardHits(posture, "universal")).toBe(true);
      w.player.invul = 0;
      w.pool.spawn(0, 0, 0, 0, false, 15, "universal");
      w.updateProjectiles(1 / 60);
      expect(w.player.hp).toBe(posture === "alta" ? 85 : 65);
    }
  });
  it("transição não protege de projétil de solo antes de completar", () => {
    const w = new World(fresh());
    w.player.x = w.player.y = 0;
    advancePosture(w.player, 0.2, true);
    const q = w.pool.spawn(0, 0, 0, 0, false, 20, "solo");
    q.hazard = "ground_only";
    w.updateProjectiles(1 / 60);
    expect(w.player.hp).toBe(80);
  });
  it("Rasante coleta a 2 un e Alta mantém raio menor", () => {
    for (const posture of ["rasante", "alta"] as const) {
      const w = new World(fresh());
      w.player.posture = posture;
      w.player.x = w.player.y = 0;
      w.spawnPickup("scrap", 1.9, 0);
      w.updatePickups(0.1);
      expect(w.pickups[0].x < 1.9).toBe(posture === "rasante");
    }
  });
  it("tiro manual só dispara com comando quando auto-fire é desligado", () => {
    const w = new World(fresh());
    w.options.autoFire = false;
    for (let i = 0; i < 30; i++) w.tick(1 / 60, none);
    expect(w.shots).toBe(0);
    w.tick(1 / 60, { ...none, fire: true });
    expect(w.shots).toBe(1);
  });
});
describe("M03 e campanha", () => {
  it("timeline segue treino → caçadores → AA/bombardeiros → Ciclone", () => {
    expect(m03.waves.filter((w) => w.atSeconds < 90)).toHaveLength(0);
    expect(
      m03.waves
        .filter((w) => w.atSeconds >= 90 && w.atSeconds < 210)
        .every((w) => ["E03", "E04"].includes(w.enemy)),
    ).toBe(true);
    expect(
      m03.waves
        .filter((w) => w.atSeconds >= 210)
        .every((w) => ["E06", "E10"].includes(w.enemy)),
    ).toBe(true);
    expect(m03.bossEntryAtSeconds).toBe(350);
    expect(m03.rescues).toHaveLength(2);
    expect(m03.rescues[1].atSeconds + 34).toBeLessThan(350);
  });
  it("M03 abre após M02; Bóreas só após M03 sem exigir medalhas extras", () => {
    const s = fresh();
    expect(available(s, "M03")).toBe(false);
    completeAttempt(s, "M01", true, 1, ["clear"]);
    completeAttempt(s, "M02", true, 2, ["clear"]);
    expect(available(s, "M03")).toBe(true);
    expect(shipAvailable(s, "A02")).toBe(false);
    completeAttempt(s, "M03", true, 3, ["clear"]);
    expect(shipAvailable(s, "A02")).toBe(true);
    expect(available(s, "M04")).toBe(false);
    expect(record(s, "M02").bestScore).toBe(2);
  });
  it("Bóreas tem HP80, velocidade9,7 e dano0,92x; seleção validada", () => {
    const s = fresh();
    s.aircraft = "A02";
    expect(selectedAircraft(s)).toBe("A01");
    completeAttempt(s, "M03", true, 5, ["clear"]);
    const w = new World(s, true, "M03");
    expect(w.player.hp).toBe(80);
    expect(w.speed).toBe(9.7);
    expect(w.damage).toBeCloseTo(9.2);
    expect(migrate(s).aircraft).toBe("A02");
  });
  it("esquiva próxima concede cadência por 3 s sem imunidade", () => {
    const s = fresh();
    completeAttempt(s, "M03", true, 1, ["clear"]);
    s.aircraft = "A02";
    const w = new World(s);
    w.player.x = w.player.y = 0;
    w.player.vx = 5;
    w.pool.spawn(0.9, 0, 0, 0, false, 20, "esquiva");
    w.updateProjectiles(1 / 60);
    expect(w.player.dodgeBoost).toBe(3);
    expect(w.player.invul).toBe(0);
    expect(w.player.hp).toBe(80);
  });
  it("opções persistem e migração preserva as três missões e upgrades", () => {
    const s = fresh();
    completeAttempt(s, "M01", true, 200, ["clear"]);
    completeAttempt(s, "M02", true, 300, ["clear"]);
    completeAttempt(s, "M03", true, 400, ["clear"]);
    s.settings.options = {
      music: 0.35,
      effects: 0.7,
      autoFire: false,
      showHitbox: false,
      vibration: true,
      quality: "media",
    };
    s.aircraft = "A02";
    s.scrap = 1000;
    buy(s, "blindagem");
    buy(s, "cadencia");
    const store = new SaveStore();
    expect(store.write(s)).toBe(true);
    const loaded = store.load();
    expect(preferences(loaded)).toEqual(s.settings.options);
    expect(loaded.aircraft).toBe("A02");
    expect(loaded.upgrades.blindagem).toBe(1);
    expect(new World(loaded).player.maxHp).toBe(90);
    expect(new World(loaded).fireRate).toBeCloseTo(6.36);
    expect(record(loaded, "M03").cleared).toBe(true);
  });
  it("opções inválidas são sanitizadas sem afetar save legado", () => {
    const s = migrate({
      ...fresh(),
      settings: {
        sound: true,
        options: {
          music: 5,
          effects: -10,
          quality: "extrema",
          autoFire: "não",
        },
      },
    });
    expect(preferences(s)).toMatchObject({
      music: 1,
      effects: 0,
      quality: "auto",
      autoFire: true,
    });
  });
});
describe("Lâmina e Aríete", () => {
  it("Lâmina anuncia a investida antes de mover rapidamente", () => {
    const w = new World(fresh(), true, "M03");
    w.spawnEnemy("E04", 0, 8);
    const e = w.enemies[0];
    e.state = "ACQUIRE_TARGET";
    e.timer = 0;
    w.updateEnemies(1 / 60);
    expect(e.state).toBe("TELEGRAPH");
    const y = e.y;
    w.updateEnemies(0.4);
    expect(e.y).toBe(y);
    w.updateEnemies(0.51);
    expect(e.state).toBe("ATTACK");
    w.updateEnemies(0.1);
    expect(e.y).toBeLessThan(y - 0.7);
  });
  it("asas são alvos separados; destruí-las remove o bombardeio associado", () => {
    const w = new World(fresh());
    w.spawnEnemy("E10", 0, 6);
    const e = w.enemies[0];
    w.pool.spawn(-1.35, 6, 0, 0, true, 10, "teste");
    w.updateProjectiles(1 / 60);
    expect(e.wings![0]).toBe(35);
    expect(e.hp).toBe(180);
    w.hitEnemyWing(e, 0, 100);
    w.enemyFire(e);
    const bombs = w.pool.items.filter((q) => q.active && !q.friendly);
    expect(bombs).toHaveLength(1);
    expect(bombs[0].hazard).toBe("ground_only");
    expect(bombs[0].owner).toBe(100000 + e.id * 2 + 1);
  });
});
describe("Ciclone universal e modular", () => {
  it("míssil guia por no máximo 1,2 s após aviso e então fica balístico", () => {
    const w = new World(fresh(), true, "M03");
    w.startBoss();
    const b = w.boss!;
    b.y = 6.8;
    b.invul = 0;
    b.cycle = 0;
    w.updateBoss(1 / 60);
    const q = w.pool.items.find((q) => q.active && q.style === "missile")!;
    expect(q.arm).toBe(0.9);
    expect(q.homing).toBe(1.2);
    for (let i = 0; i < 135; i++) w.updateProjectiles(1 / 60);
    expect(q.homing).toBe(0);
    const vx = q.vx,
      vy = q.vy;
    w.player.x = -6;
    w.player.y = -4;
    w.updateProjectiles(0.05);
    expect(q.vx).toBe(vx);
    expect(q.vy).toBe(vy);
  });
  it("vento lateral é visual e nunca altera posição/velocidade do jogador", () => {
    const a = new World(fresh(), true, "M03"),
      b = new World(fresh(), true, "M03");
    a.startBoss();
    b.startBoss();
    a.boss!.wind = 1;
    b.boss!.wind = -1;
    for (let i = 0; i < 30; i++) {
      a.movePlayer(1 / 60, { ...none, x: 0.5 });
      b.movePlayer(1 / 60, { ...none, x: 0.5 });
    }
    expect(a.player.x).toBe(b.player.x);
    expect(a.player.vx).toBe(b.player.vx);
  });
  it("espiral dupla reserva corredor de 2,5 un no plano inferior", () => {
    const w = new World(fresh(), true, "M03");
    w.startBoss();
    const b = w.boss!;
    b.y = 6.8;
    b.invul = 0;
    b.phase = 3;
    b.cycle = 0;
    for (let i = 0; i < 80; i++) w.updateBoss(1 / 60);
    const qs = w.pool.items.filter((q) => q.active);
    expect(qs.length).toBeGreaterThan(12);
    for (const q of qs)
      if (q.vy < -0.2)
        expect(
          Math.abs(q.x + q.vx * ((-8 - q.y) / q.vy)),
        ).toBeGreaterThanOrEqual(1.25);
  });
  it("rotor destruído limpa seus mísseis e não duplica dano na fuselagem", () => {
    const w = new World(fresh(), true, "M03");
    w.startBoss();
    const b = w.boss!;
    b.y = 6.8;
    b.invul = 0;
    b.cycle = 0;
    w.updateBoss(1 / 60);
    expect(w.pool.items.some((q) => q.active && q.owner === -31)).toBe(true);
    w.hitBoss("left", 240);
    expect(b.hp).toBe(900);
    expect(b.phase).toBe(2);
    expect(b.invul).toBeLessThanOrEqual(1.5);
    expect(w.pool.items.some((q) => q.active && q.owner === -31)).toBe(false);
  });
  it("morte limpa todas as armas, oferece zona segura e conclui em 3,5 s", () => {
    const w = new World(fresh(), true, "M03");
    w.startBoss();
    w.boss!.invul = 0;
    w.hitBoss("core", 99999);
    expect(w.boss!.left).toBe(0);
    expect(w.boss!.right).toBe(0);
    for (let i = 0; i < 220; i++) w.tick(1 / 60, none);
    expect(w.state).toBe("victory");
    expect(w.pool.items.some((q) => q.active)).toBe(false);
  });
});
