import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://localhost:4176/?debug=qa");
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
const result = await page.evaluate(() => {
  const qa = window.__AURORA__;
  let steps = 0,
    lastTarget = 0,
    seen = new Set(),
    minHP = 100;
  while (steps++ < 16000) {
    const s = qa.state(),
      p = s.player;
    if (s.state !== "playing" && s.state !== "dying") break;
    let tx = 6.7,
      ty = -8;
    const r = s.rescues.find((r) => r.active);
    if (r) {
      tx = r.x;
      ty = Math.max(-10, Math.min(6.5, r.y));
    } else if (p.hp < 90 && s.pickups.some((p) => p.kind === "repair")) {
      const kit = s.pickups.find((p) => p.kind === "repair");
      tx = kit.x;
      ty = Math.min(6.5, kit.y);
    } else if (s.boss) {
      seen.add(s.boss.phase);
      tx = s.boss.left > 0 ? -2.6 : s.boss.right > 0 ? 2.6 : 0;
      ty = -5;
    }
    const dx = tx - p.x,
      dy = ty - p.y,
      len = Math.hypot(dx, dy) || 1;
    const dirs = [
      [dx / len, dy / len],
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [0.707, 0.707],
      [-0.707, 0.707],
      [0.707, -0.707],
      [-0.707, -0.707],
    ];
    let best = dirs[0],
      bestCost = 1e9;
    for (const d of dirs) {
      let cost = 0,
        px = p.x,
        py = p.y,
        vx = p.vx,
        vy = p.vy;
      for (let ti = 1; ti <= 30; ti++) {
        const dt = 1 / 60,
          t = ti * dt;
        const approach = (v, t, a) => v + Math.max(-a, Math.min(a, t - v));
        vx = approach(vx, d[0] * 8.2, (d[0] ? 35 : 40) * dt);
        vy = approach(vy, d[1] * 8.2, (d[1] ? 35 : 40) * dt);
        px = Math.max(-6.87, Math.min(6.87, px + vx * dt));
        py = Math.max(-11.67, Math.min(6.67, py + vy * dt));
        cost += Math.hypot(px - tx, py - ty) * 0.035;
        for (const b of s.bullets) {
          const dist = Math.hypot(b.x + b.vx * t - px, b.y + b.vy * t - py);
          if (dist < 1) cost += (1 - dist) * 80;
        }
        for (const e of s.enemies) {
          const speed = e.kind === "E01" ? 2.4 : e.kind === "E02" ? 2 : 1.1;
          const dist = Math.hypot(e.x - px, e.y - speed * t - py);
          if (dist < e.r + 0.65) cost += (e.r + 0.65 - dist) * 80;
        }
        for (const l of s.lasers) {
          if (l.age + t > l.warn && l.age + t < l.warn + 0.15 + l.duration) {
            const ax = l.x,
              ay = l.y,
              dx = l.tx - ax,
              dy = l.ty - ay;
            const u = Math.max(
              0,
              Math.min(
                1,
                ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy),
              ),
            );
            const dist = Math.hypot(px - ax - u * dx, py - ay - u * dy);
            if (dist < l.width / 2 + 0.75)
              cost += (l.width / 2 + 0.75 - dist) * 100;
          }
        }
      }
      if (cost < bestCost) {
        bestCost = cost;
        best = d;
      }
    }
    const bomb =
      p.hp <= 45 &&
      s.bullets.some((b) => Math.hypot(b.x - p.x, b.y - p.y) < 4) &&
      p.bombs > 0;
    const special =
      !!s.boss &&
      s.boss.invul === 0 &&
      Math.abs(p.x - tx) < 0.7 &&
      p.specials > 0 &&
      p.beam === 0;
    qa.step(3, { x: best[0], y: best[1], bomb, special });
    minHP = Math.min(minHP, p.hp);
  }
  return { steps, minHP, phases: [...seen], state: qa.state() };
});
assert.equal(result.state.state, "victory");
assert.equal(result.state.boss.left, 0);
assert.equal(result.state.boss.right, 0);
assert.equal(result.state.rescues.filter((r) => r.rescued).length, 3);
assert.deepEqual(result.phases, [1, 2, 3]);
assert.deepEqual(errors, []);
writeFileSync(
  "release/full-mission-qa.json",
  JSON.stringify(
    {
      mode: "Accelerated fixed-step, real inputs, damage enabled, no profile rewards",
      errors,
      ...result,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      errors,
      time: result.state.time,
      phases: result.phases,
      hp: result.state.player.hp,
      rescued: result.state.rescues.filter((r) => r.rescued).length,
      cannons: [result.state.boss.left, result.state.boss.right],
      state: result.state.state,
    },
    null,
    2,
  ),
);
await page.waitForTimeout(500);
await page.screenshot({ path: "release/screenshots/04-result.png" });
await browser.close();
