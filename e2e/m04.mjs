import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import assert from "node:assert/strict";
mkdirSync("release/screenshots/v0.5", { recursive: true });
const base = process.env.GAME_URL || "http://localhost:4176/";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const errors = [];
const monitor = (p) => {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
};
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
monitor(page);
await page.goto(base + "?debug=qa&stage=M04");
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
// Freeze real time so screenshot waits never play unattended frames; all progress is via step().
await page.evaluate(() => window.__AURORA__.hold(true));
/** Accelerated fixed-step pilot: real Commands, damage enabled. `until` names a scene to stop on. */
const pilotFor =
  (pg) =>
  async (stop = 9999, until = "") =>
    pg.evaluate(
      ([stop, until]) => {
        const qa = window.__AURORA__;
        const m = (window.pilotMetrics ||= {
          phases: [],
          enemies: [],
          patterns: [],
          postures: [],
          minHP: 100,
          totalSteps: 0,
          phaseStart: 0,
          lastPhase: 0,
          maxApproach: 0,
        });
        const phases = new Set(m.phases),
          kinds = new Set(m.enemies),
          patterns = new Set(m.patterns),
          postures = new Set(m.postures);
        let steps = 0;
        while (steps++ < 20000) {
          const s = qa.state(),
            p = s.player;
          for (const e of s.enemies) kinds.add(e.kind);
          postures.add(p.posture);
          m.maxApproach = Math.max(m.maxApproach, s.approach || 0);
          const torps = s.bullets.filter((b) => b.style === "torpedo");
          if (torps.length) patterns.add("torpedos de superfície");
          if (s.lasers.some((l) => l.source === "Hidra • pista segura"))
            patterns.add("pista segura");
          if (s.lasers.some((l) => l.shape === "circle"))
            patterns.add("obus sob fogo");
          if (s.bullets.some((b) => b.source === "Bastião • torre AA"))
            patterns.add("torres AA");
          if (s.bullets.some((b) => b.source === "Bastião • barragem costeira"))
            patterns.add("barragem costeira");
          if (s.lasers.some((l) => l.owner === -40))
            patterns.add("raio da plataforma");
          if (s.time >= stop || (s.state !== "playing" && s.state !== "dying"))
            break;
          if (
            until === "torpedo" &&
            torps.length >= 7 &&
            torps.every((t) => Number.isNaN(t.laneX)) &&
            s.lasers.some((l) => l.source === "Hidra • pista segura")
          )
            break;
          if (
            until === "dock" &&
            s.rescues.some((r) => r.active) &&
            s.lasers.some((l) => l.shape === "circle" && l.age > 0.5)
          )
            break;
          if (
            until === "beam" &&
            s.lasers.some((l) => l.owner === -40 && l.age > 0.7)
          )
            break;
          let tx = 0,
            ty = -8;
          const r = s.rescues.find((r) => r.active);
          const b = s.boss;
          if (r) {
            tx = r.x;
            ty = Math.max(-10, Math.min(6.5, r.y));
          } else if (p.hp < 85 && s.pickups.some((k) => k.kind === "repair")) {
            const kit = s.pickups.find((k) => k.kind === "repair");
            tx = kit.x;
            ty = Math.min(6.5, kit.y);
          } else if (b && !b.dead) {
            phases.add(b.phase);
            if (b.phase !== m.lastPhase) {
              m.phaseStart = s.time;
              m.lastPhase = b.phase;
            }
            const wait = b.phase === 1 ? b.age < 8 : s.time - m.phaseStart < 6;
            const cm = b.casemates;
            const order = [0, 2, 1].filter((i) => cm[i] > 0);
            const xs = [-4.2, 0, 4.2];
            tx = wait ? 6.4 : order.length ? b.x + xs[order[0]] : b.x;
            // A pilot reads the telegraph: during a platform-beam warning, go to the marked gap.
            if (s.lasers.some((l) => l.owner === -40)) tx = b.gapX;
            m.wait = wait;
          } else {
            // Light objective pressure: sit under the lowest live target so it does not escape.
            const live = s.enemies
              .filter((e) => e.active && e.y < 11 && e.y > p.y + 2)
              .sort((a, c) => a.y - c.y)[0];
            if (live) tx = Math.max(-6.4, Math.min(6.4, live.x));
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
          const alta = p.posture === "alta";
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
              const ap = (v, g, a) => v + Math.max(-a, Math.min(a, g - v));
              vx = ap(vx, d[0] * 8.2, (d[0] ? 35 : 40) * dt);
              vy = ap(vy, d[1] * 8.2, (d[1] ? 35 : 40) * dt);
              px = Math.max(-6.87, Math.min(6.87, px + vx * dt));
              py = Math.max(-11.67, Math.min(6.67, py + vy * dt));
              cost += Math.hypot(px - tx, py - ty) * 0.035;
              for (const q of s.bullets) {
                if (q.hazard === "ground_only" && alta) continue;
                let bx = q.x + q.vx * t;
                if (!Number.isNaN(q.laneX) && q.laneX !== null)
                  bx =
                    Math.abs(q.laneX - q.x) <= 7 * t
                      ? q.laneX
                      : q.x + Math.sign(q.laneX - q.x) * 7 * t;
                const dist = Math.hypot(bx - px, q.y + q.vy * t - py),
                  rad = q.r + 0.7;
                if (dist < rad) cost += (rad - dist) * 80;
              }
              for (const e of s.enemies) {
                const dist = Math.hypot(e.x - px, e.y - 1.1 * t - py);
                if (dist < e.r + 0.65) cost += (e.r + 0.65 - dist) * 80;
              }
              if (b && !b.dead)
                for (const [i, x] of [-4.2, 0, 4.2].entries())
                  if (b.casemates[i] > 0) {
                    const dist = Math.hypot(b.x + x - px, b.y - 1 - py);
                    if (dist < 2) cost += (2 - dist) * 80;
                  }
              for (const l of s.lasers) {
                if (
                  l.duration > 0 &&
                  !l.visualOnly &&
                  l.age + t > l.warn &&
                  l.age + t < l.warn + 0.15 + l.duration
                ) {
                  const ax = l.x,
                    ay = l.y,
                    lx = l.tx - ax,
                    ly = l.ty - ay,
                    l2 = lx * lx + ly * ly;
                  const u =
                    l2 < 1e-6
                      ? 0
                      : Math.max(
                          0,
                          Math.min(1, ((px - ax) * lx + (py - ay) * ly) / l2),
                        );
                  const dist = Math.hypot(px - ax - u * lx, py - ay - u * ly);
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
            s.bullets.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < 4) &&
            p.bombs > 0;
          const special =
            !!b &&
            !b.dead &&
            !m.wait &&
            b.invul === 0 &&
            Math.abs(p.x - tx) < 0.7 &&
            p.specials > 0 &&
            p.beam === 0;
          const threatSolo =
            torps.some((q) => q.y > p.y - 1) || (b && !b.dead && b.phase === 2);
          const desired = threatSolo || (b && !b.dead) ? "alta" : "rasante";
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
          m.totalSteps++;
          const after = qa.state();
          if (after.player.hp < p.hp) {
            m.damage ||= {};
            const k = after.lastDamage + (b ? " [boss P" + b.phase + "]" : "");
            m.damage[k] = (m.damage[k] || 0) + (p.hp - after.player.hp);
          }
          m.minHP = Math.min(m.minHP, p.hp);
        }
        Object.assign(m, {
          phases: [...phases],
          enemies: [...kinds],
          patterns: [...patterns],
          postures: [...postures],
        });
        return { ...m, state: qa.state() };
      },
      [stop, until],
    );
const pilot = pilotFor(page);
const shot = async (name) => {
  await page.waitForTimeout(250);
  await page.screenshot({ path: "release/screenshots/v0.5/" + name });
};
await pilot(60);
await shot("02a-m04-cliffs.png");
await pilot(170, "torpedo");
await shot("02-m04-hidras-torpedos.png");
await pilot(372, "dock");
await shot("03-m04-docas-resgate-sob-fogo.png");
await pilot(402);
await shot("04-bastiao-delta.png");
await pilot(9999, "beam");
await shot("04b-bastiao-raio-plataforma.png");
const result = await pilot();
const s = result.state;
const summary = {
  state: s.state,
  time: s.time,
  hp: s.player.hp,
  rescued: s.rescues.filter((r) => r.rescued).length,
  phases: result.phases.sort(),
  patterns: result.patterns,
  enemies: result.enemies.sort(),
  casemates: s.boss?.casemates,
  escaped: s.escaped,
  hidra: s.hidra,
  shellsFired: s.shellsFired,
  maxApproach: result.maxApproach,
  minHP: result.minHP,
  damage: result.damage,
  postures: result.postures,
  steps: result.totalSteps,
};
console.log(JSON.stringify({ errors, ...summary }, null, 2));
assert.equal(s.state, "victory");
assert.equal(summary.rescued, 3);
assert.deepEqual(summary.phases, [1, 2, 3]);
for (const k of ["E01", "E05", "E06", "E07", "E11"])
  assert.ok(summary.enemies.includes(k), k);
for (const pat of [
  "torpedos de superfície",
  "pista segura",
  "obus sob fogo",
  "torres AA",
  "barragem costeira",
  "raio da plataforma",
])
  assert.ok(summary.patterns.includes(pat), pat);
assert.deepEqual(s.boss.casemates, [0, 0, 0]);
assert.equal(summary.maxApproach, 1);
await page.waitForTimeout(400);
await shot("05-m04-resultado.png");
const resultText = await page.locator(".report").textContent();
assert.match(resultText, /FAROL IDENTIFICADO/);
assert.match(resultText, /CASAMATAS: 3\/3/);
// Mobile portrait: M04 boss scene, fullscreen canvas.
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 1,
});
const touch = await mobile.newPage();
monitor(touch);
await touch.goto(base + "?debug=qa&stage=M04");
await touch.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await touch.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await touch.evaluate(() => window.__AURORA__.hold(true));
await pilotFor(touch)(175, "torpedo");
await touch.waitForTimeout(300);
assert.equal((await touch.locator("canvas").boundingBox()).height, 844);
assert.match(await touch.locator(".flight-strip").textContent(), /M04/);
await touch.screenshot({ path: "release/screenshots/v0.5/06-m04-mobile.png" });
await touch.goto(base + "?debug=boss&stage=M04");
await touch
  .getByRole("button", { name: /JOGAR NOVAMENTE|INICIAR MISSÃO/ })
  .first()
  .click();
await touch.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await touch.evaluate(() =>
  window.__AURORA__.step(260, { x: 0, y: 0, bomb: false, special: false }),
);
await touch.waitForTimeout(300);
await touch.screenshot({
  path: "release/screenshots/v0.5/07-bastiao-mobile.png",
});
await mobile.close();
assert.deepEqual(errors, []);
writeFileSync(
  "release/full-m04-qa-v05.json",
  JSON.stringify(
    {
      mode: "Accelerated fixed-step, real inputs, damage enabled, no profile rewards",
      browser: browser.version(),
      errors,
      ...summary,
    },
    null,
    2,
  ),
);
await browser.close();
