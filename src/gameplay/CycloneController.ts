import type { World, Boss } from "./World";
import { overlaps } from "./Collision2D";
export function createCyclone(): Boss {
  return {
    kind: "ciclone",
    x: 0,
    y: 18,
    py: 18,
    hp: 900,
    left: 240,
    right: 240,
    phase: 1,
    invul: 1.5,
    age: 0,
    cycle: 2,
    dead: false,
    deathTime: 0,
    attackIndex: 0,
    wind: 0,
    spiralShots: 0,
    spiralClock: 0,
  };
}
function missile(w: World, x: number, y: number, owner: number) {
  const m = w.pool.spawn(x, y, 0, -7, false, 23, "Ciclone • míssil");
  m.style = "missile";
  m.arm = 0.9;
  m.homing = 1.2;
  m.owner = owner;
  w.events.push("missile");
}
export function updateCyclone(w: World, dt: number) {
  const b = w.boss!;
  if (b.dead) return;
  b.py = b.y;
  b.age += dt;
  b.y = Math.max(6.8, b.y - 2.8 * dt);
  b.x = Math.sin(b.age * 0.42) * 0.8;
  b.invul = Math.max(0, b.invul - dt);
  b.flash = Math.max(0, (b.flash || 0) - dt);
  b.wind = b.phase === 2 ? Math.sin(b.age * 0.7) : 0;
  if (overlaps({ id: -30, x: b.x, y: b.y, r: 1.25 }, w.player))
    w.hurt(35, "Ciclone • fuselagem", -30);
  if (b.y > 6.8 || b.invul > 0) return;
  if (b.phase === 3 && (b.spiralShots || 0) > 0) {
    b.spiralClock = (b.spiralClock || 0) - dt;
    if (b.spiralClock <= 0) {
      for (const [offset, hp, owner] of [
        [-2.7, b.left, -31],
        [2.7, b.right, -32],
      ])
        if (hp > 0) {
          const x = b.x + offset,
            y = b.y - 0.5;
          for (let i = 0; i < 12; i++) {
            const a = (i * Math.PI) / 6 + b.age * 0.33,
              vx = Math.cos(a) * 5.8,
              vy = Math.sin(a) * 5.8;
            const atBottom = vy < -0.2 ? x + vx * ((-8 - y) / vy) : 99;
            if (Math.abs(atBottom) < 1.25) continue;
            const q = w.pool.spawn(
              x,
              y,
              vx,
              vy,
              false,
              20,
              "Ciclone • espiral dupla",
            );
            q.owner = owner;
          }
        }
      b.spiralShots!--;
      b.spiralClock = 0.42;
    }
  }
  b.cycle -= dt;
  if (b.cycle > 0) return;
  const live = [
    { hp: b.left, x: b.x - 2.7, id: -31 },
    { hp: b.right, x: b.x + 2.7, id: -32 },
  ].filter((r) => r.hp > 0);
  if (b.phase === 1) {
    if (live.length) {
      const r = live[(b.attackIndex || 0) % live.length];
      missile(w, r.x, b.y - 0.5, r.id);
    }
    b.cycle = 4.2;
    w.say(
      "CICLONE • mísseis alternados: guiam por 1,2 s, depois seguem retos.",
      3,
    );
  } else if (b.phase === 2) {
    for (const r of live) missile(w, r.x, b.y - 0.5, r.id);
    b.cycle = 5.2;
    w.say("VENTO LATERAL VISUAL • mantenha sua rota. O controle é seu.", 3);
  } else {
    b.spiralShots = 3;
    b.spiralClock = 0.9;
    b.cycle = 4.8;
    w.events.push("laser");
    w.say("CICLONE • espirais duplas. Procure a brecha entre os arcos.", 3);
  }
  b.attackIndex = (b.attackIndex || 0) + 1;
}
export function hitCyclone(
  w: World,
  part: "left" | "right" | "core",
  damage: number,
) {
  const b = w.boss!;
  const key = part === "core" ? "hp" : part;
  if (b.dead || b.invul > 0 || b[key] <= 0) return;
  b[key] = Math.max(0, b[key] - damage);
  b.flash = 0.085;
  if (part !== "core" && b[key] === 0) {
    const owner = part === "left" ? -31 : -32;
    w.parts++;
    w.productive(600);
    w.effect(b.x + (part === "left" ? -2.7 : 2.7), b.y, 2);
    w.events.push("explosion");
    for (const q of w.pool.items) if (q.owner === owner) q.active = false;
    w.say("ROTOR DESTRUÍDO • emissor desativado");
  }
  if (b.hp === 0) {
    b.left = b.right = 0;
    w.defeatBoss();
    w.say(
      "Lina: base libertada. Ícaro, o Bóreas está pronto para voltar a voar!",
      6,
    );
    return;
  }
  const broken = Number(b.left === 0) + Number(b.right === 0);
  const phase = Math.max(
    b.hp <= 270 ? 3 : b.hp <= 585 ? 2 : 1,
    broken === 2 ? 3 : broken === 1 ? 2 : 1,
  );
  if (phase > b.phase) {
    b.phase = phase;
    b.invul = 0.9;
    b.cycle = 1.6;
    b.spiralShots = 0;
    w.pool.clear(true);
    w.lasers = [];
    w.events.push("laser");
    w.say(`CICLONE • FASE ${phase} — transição 0,9 s`, 2);
  }
}
