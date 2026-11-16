import type { World, Boss } from "./World";
import { overlaps } from "./Collision2D";
/** Bastião Delta: stationary coastal fortress. Three casemates own their attacks; the command core owns the platform beam. */
export const BASTION = { core: 1100, casemate: 260, beamGap: 2.6 };
export const casemates = [
  { x: -4.2, dy: -0.5, r: 1.0 },
  { x: 0, dy: -1.7, r: 1.0 },
  { x: 4.2, dy: -0.5, r: 1.0 },
];
export const casemateOwner = (i: number) => -41 - i;
export const coreOffset = 0.9;
const gaps = [-3.6, 2.4, 0, -1.4, 3.6];
export function createBastion(): Boss {
  return {
    kind: "bastiao",
    x: 0,
    y: 18,
    py: 18,
    hp: BASTION.core,
    left: 0,
    right: 0,
    casemates: [BASTION.casemate, BASTION.casemate, BASTION.casemate],
    phase: 1,
    invul: 1.5,
    age: 0,
    cycle: 1.6,
    dead: false,
    deathTime: 0,
    attackIndex: 0,
    gapX: 0,
    aimX: 0,
    aimY: -9,
  };
}
function aaBurst(w: World, b: Boss, i: number, tx: number, ty: number) {
  const c = casemates[i],
    x = b.x + c.x,
    y = b.y + c.dy - 0.6,
    base = Math.atan2(ty - y, tx - x);
  for (const off of [-0.13, 0, 0.13]) {
    const q = w.pool.spawn(
      x,
      y,
      Math.cos(base + off) * 7,
      Math.sin(base + off) * 7,
      false,
      18,
      "Bastião • torre AA",
    );
    q.owner = casemateOwner(i);
  }
}
function barrage(w: World, b: Boss, i: number) {
  const c = casemates[i];
  for (let k = -2; k <= 2; k++) {
    const a = -Math.PI / 2 + k * 0.25 + (i - 1) * 0.08;
    const q = w.pool.spawn(
      b.x + c.x,
      b.y + c.dy - 0.6,
      Math.cos(a) * 5,
      Math.sin(a) * 5,
      false,
      22,
      "Bastião • barragem costeira",
    );
    q.style = "wide";
    q.r = 0.34;
    q.hazard = "ground_only";
    q.owner = casemateOwner(i);
  }
}
/** Two beam slabs leave one corridor of BASTION.beamGap around gapX. */
export function beamSlabs(gapX: number) {
  const half = BASTION.beamGap / 2,
    left = { from: -7.8, to: gapX - half },
    right = { from: gapX + half, to: 7.8 };
  return [left, right]
    .filter((s) => s.to - s.from > 0.2)
    .map((s) => ({ x: (s.from + s.to) / 2, width: s.to - s.from }));
}
export function updateBastion(w: World, dt: number) {
  const b = w.boss!;
  if (b.dead) return;
  const cm = b.casemates!;
  b.py = b.y;
  b.age += dt;
  b.y = Math.max(7.2, b.y - 2.6 * dt);
  b.invul = Math.max(0, b.invul - dt);
  b.flash = Math.max(0, (b.flash || 0) - dt);
  for (const [i, c] of casemates.entries())
    if (
      cm[i] > 0 &&
      overlaps({ id: -45, x: b.x + c.x, y: b.y + c.dy, r: c.r }, w.player)
    )
      w.hurt(35, "Bastião Delta (casamata)", casemateOwner(i));
  if (b.y > 7.2 || b.invul > 0) return;
  const before = b.cycle;
  b.cycle -= dt;
  const live = cm.map((hp, i) => (hp > 0 ? i : -1)).filter((i) => i >= 0);
  const crossed = (t: number) => before > t && b.cycle <= t;
  if (b.phase === 1) {
    if (crossed(0.55)) {
      b.aimX = w.player.x;
      b.aimY = w.player.y;
      for (const i of live) {
        const c = casemates[i];
        w.addLaser(
          b.x + c.x,
          b.y + c.dy - 0.6,
          b.aimX,
          b.aimY,
          0.03,
          0.55,
          0,
          "Bastião • mira AA",
          casemateOwner(i),
        );
      }
    }
    if (b.cycle <= 0) {
      for (const i of live) aaBurst(w, b, i, b.aimX!, b.aimY!);
      b.cycle = 2.5;
      w.events.push("shot");
    }
  } else if (b.phase === 2) {
    if (crossed(0.6))
      w.say("BARRAGEM COSTEIRA • triângulos SOLO: Alta passa por cima.", 2.5);
    if (b.cycle <= 0) {
      for (const i of live) barrage(w, b, i);
      if (cm[1] > 0) aaBurst(w, b, 1, w.player.x, w.player.y);
      b.cycle = 3.4;
      w.events.push("missile");
    }
  } else {
    if (b.cycle <= 0) {
      b.gapX = gaps[(b.attackIndex || 0) % gaps.length];
      b.attackIndex = (b.attackIndex || 0) + 1;
      for (const s of beamSlabs(b.gapX))
        w.addLaser(
          s.x,
          b.y - 1.2,
          s.x,
          -16,
          s.width,
          1.25,
          0.85,
          "Bastião • raio da plataforma",
          -40,
        );
      w.say("RAIO DA PLATAFORMA • entre na faixa livre marcada.", 2.5);
      w.events.push("laser");
      b.cycle = 4.8;
    }
    if (crossed(2.3) && live.length)
      for (const i of live) aaBurst(w, b, i, w.player.x, w.player.y);
  }
}
export function hitBastion(w: World, part: number | "core", damage: number) {
  const b = w.boss!;
  const cm = b.casemates!;
  if (b.dead || b.invul > 0) return;
  if (part === "core") {
    if (b.hp <= 0) return;
    b.hp = Math.max(0, b.hp - damage);
  } else {
    if (cm[part] <= 0) return;
    cm[part] = Math.max(0, cm[part] - damage);
    if (cm[part] === 0) {
      const owner = casemateOwner(part);
      w.parts++;
      w.productive(700);
      w.effect(b.x + casemates[part].x, b.y + casemates[part].dy, 2.2);
      w.events.push("explosion");
      for (const q of w.pool.items) if (q.owner === owner) q.active = false;
      w.lasers = w.lasers.filter((l) => l.owner !== owner);
      w.say("CASAMATA DESTRUÍDA • ataques desta torre desativados");
    }
  }
  b.flash = 0.085;
  if (b.hp === 0) {
    cm.fill(0);
    w.defeatBoss();
    w.say(
      "Suri: o farol da costa respondeu! Sinal Farol identificado — é uma das estações originais.",
      6,
    );
    return;
  }
  const broken = cm.filter((hp) => hp <= 0).length;
  const phase = Math.max(
    b.hp <= BASTION.core * 0.3 ? 3 : b.hp <= BASTION.core * 0.65 ? 2 : 1,
    broken >= 2 ? 3 : broken === 1 ? 2 : 1,
  );
  if (phase > b.phase) {
    b.phase = phase;
    b.invul = 0.9;
    b.cycle = 1.6;
    w.pool.clear(true);
    w.lasers = [];
    w.events.push("laser");
    w.say(`BASTIÃO DELTA • FASE ${phase} — transição 0,9 s`, 2);
  }
}
