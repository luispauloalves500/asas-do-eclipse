import { mkdirSync } from "node:fs";
mkdirSync("release/screenshots/v0.4", { recursive: true });
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto("http://localhost:4176/?debug=qa&stage=M03");
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
const pilot = async (stop = 9999) =>
  page.evaluate((stop) => {
    const qa = window.__AURORA__;
    let steps = 0,
      lastTarget = 0,
      seen = new Set(),
      seenEnemies = new Set(),
      repairSeen = false,
      minHP = 100;
    const metrics = (window.pilotMetrics ||= {
      seen: [],
      enemies: [],
      minHP: 100,
      repairSeen: false,
      phaseStart: 345,
      lastPhase: 0,
    });
    seen = new Set(metrics.seen);
    seenEnemies = new Set(metrics.enemies);
    minHP = metrics.minHP;
    repairSeen = metrics.repairSeen;
    metrics.totalSteps ||= 0;
    const patterns = new Set(metrics.patterns || []);
    while (steps++ < 16000) {
      const s = qa.state(),
        p = s.player;
      for (const e of s.enemies) seenEnemies.add(e.kind);
      if (s.bullets.some((b) => b.style === "missile" && b.homing > 0))
        patterns.add("mísseis guiados");
      if (
        s.bullets.some(
          (b) => b.style === "missile" && b.homing <= 0 && b.arm <= 0,
        )
      )
        patterns.add("mísseis balísticos");
      if (s.boss?.phase === 2 && Math.abs(s.boss.wind) > 0.3)
        patterns.add("vento lateral");
      if (s.bullets.some((b) => b.source.includes("espiral dupla")))
        patterns.add("espiral dupla");
      metrics.postures = [...new Set([...(metrics.postures || []), p.posture])];
      if (s.pickups.some((p) => p.kind === "repair")) repairSeen = true;
      if (s.time >= stop || (s.state !== "playing" && s.state !== "dying"))
        break;
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
        const b = s.boss;
        seen.add(b.phase);
        if (b.phase !== metrics.lastPhase) {
          metrics.phaseStart = s.time;
          metrics.lastPhase = b.phase;
        }
        const wait =
          b.phase === 1
            ? b.age < 9
            : s.time - metrics.phaseStart < (b.phase === 2 ? 7 : 6);
        tx = wait
          ? 6.7
          : b.phase < 3
            ? b.x
            : b.left > 0
              ? b.x - 2.7
              : b.right > 0
                ? b.x + 2.7
                : b.x;
        ty = -8;
        metrics.wait = wait;
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
            if (b.hazard === "ground_only" && p.posture === "alta") continue;
            const dist = Math.hypot(b.x + b.vx * t - px, b.y + b.vy * t - py);
            if (dist < 1) cost += (1 - dist) * 80;
          }
          for (const e of s.enemies) {
            const speed = { E03: 2.7, E04: 2.2, E10: 1.05 }[e.kind] || 1.1;
            let ex = e.x,
              ey = e.y - speed * t;
            if (e.kind === "E04" && e.state === "ATTACK") {
              ex += e.dashVX * t;
              ey = e.y + e.dashVY * t;
            }
            if (e.kind === "E04" && e.state === "TELEGRAPH") {
              ey = e.y;
              if (t > e.timer) {
                const dx = e.aimX - e.x,
                  dy = e.aimY - e.y,
                  len = Math.hypot(dx, dy) || 1;
                ex += (dx / len) * 12 * (t - e.timer);
                ey += (dy / len) * 12 * (t - e.timer);
              }
            }
            const dist = Math.hypot(ex - px, ey - py);
            if (dist < e.r + 0.65) cost += (e.r + 0.65 - dist) * 80;
          }
          for (const l of s.lasers) {
            if (
              l.duration > 0 &&
              l.age + t > l.warn &&
              l.age + t < l.warn + 0.15 + l.duration
            ) {
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
        !metrics.wait &&
        s.boss.invul === 0 &&
        Math.abs(p.x - tx) < 0.7 &&
        p.specials > 0 &&
        p.beam === 0;
      const desired =
        s.time < 20
          ? "rasante"
          : s.time < 60
            ? "alta"
            : s.time < 90
              ? "rasante"
              : "alta";
      qa.step(3, {
        x: best[0],
        y: best[1],
        bomb,
        special,
        posture:
          p.posture !== desired &&
          p.transition === 0 &&
          p.postureCooldown === 0,
      });
      metrics.totalSteps++;
      minHP = Math.min(minHP, p.hp);
    }
    Object.assign(metrics, {
      seen: [...seen],
      enemies: [...seenEnemies],
      minHP,
      repairSeen,
      patterns: [...patterns],
    });
    return {
      steps: metrics.totalSteps,
      patterns: [...patterns],
      minHP,
      phases: [...seen],
      enemies: [...seenEnemies],
      repairSeen,
      postures: metrics.postures,
      state: qa.state(),
    };
  }, stop);
await pilot(242);
await page.screenshot({ path: "release/screenshots/v0.4/05-m03-posture.png" });
await pilot(362);
await page.screenshot({ path: "release/screenshots/v0.4/06-ciclone.png" });
const result = await pilot();
writeFileSync(
  "release/full-m03-qa-v04.json",
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
      state: result.state.state,
      time: result.state.time,
      hp: result.state.player.hp,
      rescued: result.state.rescues.filter((r) => r.rescued).length,
      phases: result.phases,
      patterns: result.patterns,
      enemies: result.enemies,
      rotors: [result.state.boss?.left, result.state.boss?.right],
      postures: result.postures,
    },
    null,
    2,
  ),
);
assert.equal(result.state.state, "victory");
assert.equal(result.state.rescues.filter((r) => r.rescued).length, 2);
assert.deepEqual(result.phases, [1, 2, 3]);
assert.deepEqual(result.enemies.sort(), ["E03", "E04", "E06", "E10"]);
assert.deepEqual(result.postures, ["rasante", "alta"]);
for (const pattern of [
  "mísseis guiados",
  "mísseis balísticos",
  "vento lateral",
  "espiral dupla",
])
  assert.ok(result.patterns.includes(pattern), pattern);
assert.equal(result.state.boss.left, 0);
assert.equal(result.state.boss.right, 0);
assert.deepEqual(errors, []);
await page.waitForTimeout(300);
await page.screenshot({ path: "release/screenshots/v0.4/07-m03-results.png" });
await browser.close();
