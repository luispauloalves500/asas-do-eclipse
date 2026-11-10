import type { World, Boss } from "./World";
import { overlaps } from "./Collision2D";
export interface BossCar {
  id: number;
  x: number;
  y: number;
  px: number;
  py: number;
  r: number;
  hp: number;
  maxHp: number;
  dash: number;
}
export function createSerpent(): Boss {
  return {
    x: 0,
    y: 18,
    py: 18,
    hp: 900,
    left: 0,
    right: 0,
    phase: 1,
    invul: 1.5,
    age: 0,
    cycle: 2,
    dead: false,
    deathTime: 0,
    cars: Array.from({ length: 4 }, (_, i) => ({
      id: -20 - i,
      x: -3.6 + i * 2.4,
      y: 18,
      px: -3.6 + i * 2.4,
      py: 18,
      r: i === 0 ? 1 : 0.86,
      hp: i === 0 ? 900 : 200,
      maxHp: i === 0 ? 900 : 200,
      dash: -10,
    })),
    attackIndex: 0,
  };
}
export function updateSerpent(w: World, dt: number) {
  const b = w.boss!;
  if (b.dead || !b.cars) return;
  b.py = b.y;
  b.age += dt;
  b.flash = Math.max(0, (b.flash || 0) - dt);
  b.y = Math.max(6.2, b.y - 2.8 * dt);
  b.invul = Math.max(0, b.invul - dt);
  for (const [i, c] of b.cars.entries()) {
    c.px = c.x;
    c.py = c.y;
    c.x = -3.6 + i * 2.4 + Math.sin(b.age * 0.7) * 0.55;
    c.y = b.y + Math.sin(b.age * 0.8 - i * 0.7) * 0.35;
    if (c.dash > -10) {
      c.dash += dt;
      if (c.dash > 0 && c.dash < 2.8)
        c.y -= Math.sin((c.dash / 2.8) * Math.PI) * 10;
      if (c.dash >= 2.8) c.dash = -10;
    }
    if (c.hp > 0 && overlaps({ id: c.id, x: c.x, y: c.y, r: c.r }, w.player))
      w.hurt(35, "Serpente • vagão em corrida", c.id);
  }
  b.cars[0].hp = b.hp;
  if (b.y > 6.2 || b.invul > 0) return;
  b.cycle -= dt;
  if (b.cycle > 0) return;
  const alive = b.cars.map((c, i) => ({ c, i })).filter((v) => v.c.hp > 0);
  if (b.phase === 1) {
    for (const { c, i } of alive) {
      if (i === 0 || i === 3)
        w.spawnMine(
          i === 0 ? -4 : 4,
          c.y - 1,
          c.id,
          "Serpente • mina ferroviária",
        );
    }
    w.events.push("laser");
    b.cycle = 4.5;
    w.say("SERPENTE • minas nos trilhos. O corredor central está aberto.");
  } else if (b.phase === 2) {
    const emitters = alive.filter((v) => v.i === 1 || v.i === 2);
    if (emitters.length) {
      const { c } = emitters[(b.attackIndex || 0) % emitters.length];
      w.addLaser(
        c.x,
        c.y - 1,
        c.x,
        -15,
        1.25,
        1.2,
        1,
        "Serpente • jato elétrico",
        c.id,
      );
      w.events.push("laser");
    }
    b.cycle = 4.8;
    b.attackIndex = (b.attackIndex || 0) + 1;
  } else {
    const { c } = alive[(b.attackIndex || 0) % alive.length];
    c.dash = -1;
    w.events.push("laser");
    w.addLaser(
      c.x,
      c.y,
      c.x,
      -8,
      0.03,
      0.9,
      0,
      "Serpente • aviso de corrida",
      c.id,
    );
    for (const v of alive)
      if (v.c !== c) {
        const bullet = w.pool.spawn(
          v.c.x,
          v.c.y - 1,
          0,
          -7,
          false,
          20,
          "Serpente • descarga",
        );
        bullet.owner = v.c.id;
      }
    b.cycle = 4.8;
    b.attackIndex = (b.attackIndex || 0) + 1;
    w.say("SERPENTE • corrida anunciada. Saia da faixa marcada.");
  }
}
export function hitSerpent(w: World, index: number, damage: number) {
  const b = w.boss!,
    c = b.cars?.[index];
  if (!c || b.dead || b.invul > 0 || c.hp <= 0) return;
  c.hp = Math.max(0, c.hp - damage);
  b.flash = 0.08;
  if (index === 0) b.hp = c.hp;
  else if (c.hp === 0) {
    w.parts++;
    w.productive(600);
    w.effect(c.x, c.y, 1.8);
    w.events.push("explosion");
    w.say("VAGÃO DESTRUÍDO • ataque desativado");
    w.lasers = w.lasers.filter((l) => l.owner !== c.id);
    for (const bullet of w.pool.items)
      if (bullet.owner === c.id) bullet.active = false;
  }
  if (b.hp <= 0) {
    for (const car of b.cars!) car.hp = 0;
    w.defeatBoss();
    w.say(
      "Suri: encontrei o mapa NÓX. Estas coordenadas levam a uma estação Farol.",
      7,
    );
    return;
  }
  const broken = b.cars!.slice(1).filter((c) => c.hp <= 0).length;
  const phase = Math.max(
    b.hp <= 270 ? 3 : b.hp <= 585 ? 2 : 1,
    broken >= 2 ? 3 : broken >= 1 ? 2 : 1,
  );
  if (phase > b.phase) {
    b.phase = phase;
    b.invul = 0.9;
    b.cycle = 1;
    w.pool.clear(true);
    w.lasers = [];
    for (const car of b.cars!) car.dash = -10;
    w.say(`SERPENTE DE FERRO • FASE ${phase} — transição 0,9 s`);
    w.events.push("laser");
  }
}
