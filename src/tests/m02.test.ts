import { tileOffset } from "../core/Scrolling";
import { describe, it, expect } from "vitest";
import M02 from "../data/stages/M02.json";
import { World } from "../gameplay/World";
import { fresh, migrate } from "../persistence/SaveStore";
import { record, available, completeAttempt } from "../persistence/Campaign";
const none = { x: 0, y: 0, special: false, bomb: false };
describe("Roteiro M02", () => {
  it("segue os quatro segmentos do GDD e deixa terminar os três resgates", () => {
    expect(
      M02.waves
        .filter((w) => w.atSeconds < 105)
        .every((w) => ["E01", "E03"].includes(w.enemy)),
    ).toBe(true);
    expect(
      M02.waves
        .filter((w) => w.atSeconds >= 105 && w.atSeconds < 200)
        .every((w) => ["E05", "E07"].includes(w.enemy)),
    ).toBe(true);
    expect(
      M02.waves
        .filter((w) => w.atSeconds >= 200)
        .every((w) => w.enemy === "E08"),
    ).toBe(true);
    expect(M02.rescues).toHaveLength(3);
    expect(M02.rescues.at(-1)!.atSeconds + 34).toBeLessThan(
      M02.bossEntryAtSeconds,
    );
    expect(M02.bossEntryAtSeconds).toBe(345);
    expect(M02.convoys).toHaveLength(2);
  });
  it("eventos de resgate e vagões são criados uma única vez", () => {
    const w = new World(fresh(), true, "M02");
    w.time = 241;
    w.director();
    expect(w.convoys).toHaveLength(2);
    expect(w.rescues).toHaveLength(1);
    w.director();
    expect(w.convoys).toHaveLength(2);
    expect(w.rescues).toHaveLength(1);
  });
  it("vagão destruído pontua uma vez; fuga não bloqueia vitória", () => {
    const w = new World(fresh(), true, "M02");
    w.time = 130;
    w.director();
    const c = w.convoys[0];
    w.hitConvoy(c, 80);
    w.hitConvoy(c, 80);
    expect(w.ammoDestroyed).toBe(1);
    expect(w.scrap).toBe(40);
    w.time = 240;
    w.director();
    w.convoys[1].y = -17.99;
    w.updateConvoys(1);
    expect(w.ammoEscaped).toBe(1);
    expect(w.state).toBe("playing");
  });
});
describe("Campanha e saves legados", () => {
  it("M02 exige apenas vitória de M01, não medalhas opcionais; M03 segue em produção", () => {
    const s = fresh();
    expect(available(s, "M02")).toBe(false);
    completeAttempt(s, "M01", false, 100, []);
    expect(available(s, "M02")).toBe(false);
    completeAttempt(s, "M01", true, 200, ["clear"]);
    expect(available(s, "M02")).toBe(true);
    completeAttempt(s, "M02", true, 500, ["clear"]);
    expect(available(s, "M03")).toBe(false);
    expect(record(s, "M01").bestScore).toBe(200);
    expect(record(s, "M02").bestScore).toBe(500);
  });
  it("v0.1/v0.2 desbloqueiam M02 e preservam moeda/upgrades/recordes", () => {
    const old = {
      ...fresh(),
      scrap: 610,
      cleared: true,
      bestScore: 30000,
      medals: ["clear", "ace"],
      upgrades: { motor: 2, canhao: 3, ima: 1 },
    };
    const s = migrate(old);
    expect(available(s, "M02")).toBe(true);
    expect(record(s, "M01").bestScore).toBe(30000);
    completeAttempt(s, "M02", true, 12000, ["clear", "rescue"]);
    const loaded = migrate(JSON.parse(JSON.stringify(s)));
    expect(loaded.scrap).toBe(610);
    expect(loaded.upgrades).toEqual(old.upgrades);
    expect(record(loaded, "M01").medals).toEqual(old.medals);
    expect(record(loaded, "M02").cleared).toBe(true);
  });
});
describe("Novos padrões", () => {
  it("Raptor mira o histórico de 0,65 s e não a posição atual", () => {
    const w = new World(fresh(), true, "M02");
    w.time = 1;
    w.positionHistory = [
      { time: 0.35, x: -4, y: -9 },
      { time: 0.8, x: 5, y: -8 },
    ];
    w.player.x = 6;
    w.spawnEnemy("E03", 0, 5);
    w.enemies[0].state = "ACQUIRE_TARGET";
    w.enemies[0].timer = 0;
    w.updateEnemies(0.01);
    expect(w.enemies[0].aimX).toBe(-4);
    expect(w.lasers[0].duration).toBe(0);
  });
  it("Arpão cria quatro tiros largos divergentes com abertura central", () => {
    const w = new World(fresh());
    w.spawnEnemy("E07", 0, 8);
    w.enemies[0].aimX = 0;
    w.enemyFire(w.enemies[0]);
    const bullets = w.pool.items.filter((b) => b.active);
    expect(bullets).toHaveLength(4);
    expect(bullets.every((b) => b.style === "wide" && b.r === 0.34)).toBe(true);
    expect(bullets.every((b) => Math.abs(b.vx) > 0)).toBe(true);
  });
  it("mina não causa dano antes de materializar em 0,6 s", () => {
    const w = new World(fresh());
    w.player.x = 0;
    w.player.y = 0;
    const b = w.spawnMine(0, 0, 3, "Teste");
    w.updateProjectiles(0.59);
    expect(w.player.hp).toBe(100);
    expect(b.arm).toBeGreaterThan(0);
    w.updateProjectiles(0.02);
    expect(w.player.hp).toBe(80);
  });
  it("faixas de minas do boss mantêm o corredor central aberto", () => {
    const w = new World(fresh(), true, "M02");
    w.startBoss();
    w.boss!.y = 6.2;
    w.boss!.invul = 0;
    w.boss!.cycle = 0;
    w.updateBoss(1 / 60);
    const mines = w.pool.items.filter((b) => b.active && b.style === "mine");
    expect(mines).toHaveLength(2);
    expect(mines.every((b) => Math.abs(b.x) >= 4 && b.arm === 0.6)).toBe(true);
  });
});
describe("Serpente de Ferro modular", () => {
  it("junta dourada recebe dano no vagão associado sem duplicar no reator", () => {
    const w = new World(fresh(), true, "M02");
    w.startBoss();
    const b = w.boss!;
    b.y = 6.2;
    b.invul = 0;
    w.updateBoss(1 / 60);
    const a = b.cars![0],
      c = b.cars![1];
    w.pool.spawn((a.x + c.x) / 2, (a.y + c.y) / 2, 0, 0, true, 10, "teste");
    w.updateProjectiles(1 / 60);
    expect(c.hp).toBe(190);
    expect(b.hp).toBe(900);
  });
  it("aviso sem duração nunca causa dano, mesmo no limite exato", () => {
    const w = new World(fresh());
    w.addLaser(0, 5, 0, -15, 0.03, 0.9, 0, "somente aviso", -20);
    w.player.x = 0;
    w.player.y = -8;
    w.updateLasers(1.05);
    expect(w.player.hp).toBe(100);
  });

  it("destruir vagões não duplica dano no reator; fases e vitória não travam", () => {
    const w = new World(fresh(), true, "M02");
    w.startBoss();
    const b = w.boss!;
    b.invul = 0;
    w.hitCar(1, 200);
    expect(b.hp).toBe(900);
    expect(b.phase).toBe(2);
    expect(b.invul).toBeLessThanOrEqual(1.5);
    b.invul = 0;
    w.hitCar(2, 200);
    expect(b.phase).toBe(3);
    b.invul = 0;
    w.hitCar(0, 9999);
    expect(b.dead).toBe(true);
    expect(b.cars!.every((c) => c.hp === 0)).toBe(true);
    for (let i = 0; i < 220; i++) w.tick(1 / 60, none);
    expect(w.state).toBe("victory");
    expect(w.pool.items.some((b) => b.active)).toBe(false);
  });
  it("destruir um vagão remove armas e projéteis pertencentes a ele", () => {
    const w = new World(fresh(), true, "M02");
    w.startBoss();
    w.boss!.invul = 0;
    const mine = w.spawnMine(4, 4, -21, "Serpente");
    w.addLaser(0, 5, 0, -10, 1, 1.2, 1, "Serpente", -21);
    w.hitCar(1, 200);
    expect(mine.active).toBe(false);
    expect(w.lasers.some((l) => l.owner === -21)).toBe(false);
    w.boss!.invul = 0;
    w.boss!.y = 6.2;
    w.boss!.cycle = 0;
    w.updateBoss(1 / 60);
    expect(w.lasers.every((l) => l.owner !== -21)).toBe(true);
  });
  it("P3 anuncia a corrida e só movimenta vagões vivos", () => {
    const w = new World(fresh(), true, "M02");
    w.startBoss();
    const b = w.boss!;
    b.invul = 0;
    b.phase = 3;
    b.y = 6.2;
    b.cycle = 0;
    w.updateBoss(1 / 60);
    expect(
      w.lasers.some((l) => l.source.includes("corrida") && l.warn >= 0.9),
    ).toBe(true);
    const c = b.cars!.find((c) => c.dash > -10)!;
    for (let i = 0; i < 100; i++) w.updateBoss(1 / 60);
    expect(c.y).toBeLessThan(2);
  });
});

describe("Terreno contínuo", () => {
  it("nenhuma lacuna nos trilhos/rio ao reciclar tiles, inclusive em portrait", () => {
    for (let scroll = 0; scroll < 224; scroll += 0.25) {
      const centers = [tileOffset(0, scroll), tileOffset(1, scroll)].sort(
        (a, b) => a - b,
      );
      expect(centers[0] - 28).toBeLessThanOrEqual(-20);
      expect(centers[1] + 28).toBeGreaterThanOrEqual(20);
      expect(centers[0] + 28).toBeCloseTo(centers[1] - 28);
    }
  });
});
