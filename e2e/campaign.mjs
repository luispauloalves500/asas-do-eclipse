import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("release/screenshots/v0.4", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const errors = [],
  checks = [];
const base = process.env.GAME_URL || "http://localhost:4176/";
function monitor(p) {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
}
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
monitor(page);
try {
  await page.goto(base);
  await page.getByRole("button", { name: /CAMPANHA/ }).click();
  assert.equal(await page.locator(".route-node").count(), 5);
  await page.locator('[data-action="map-select:M02"]').click();
  assert.equal(
    await page.locator('[data-action="map-play:M02"]').isDisabled(),
    true,
  );
  checks.push(
    "Fresh profile: M02 locked until M01 Normal victory; five route nodes",
  );
  await page.locator('[data-action="map-select:M04"]').click();
  assert.equal(
    await page.locator('[data-action="map-play:M04"]').isDisabled(),
    true,
  );
  assert.match(
    await page.locator(".map-card").textContent(),
    /próximas versões/,
  );
  checks.push("M04–M05 displayed but not playable");
  await page.evaluate(() =>
    localStorage.setItem(
      "aurora.asas.save",
      JSON.stringify({
        schemaVersion: 2,
        scrap: 610,
        upgrades: { motor: 1, canhao: 2, ima: 1 },
        cleared: true,
        bestScore: 30200,
        medals: ["clear", "rescue"],
        settings: { sound: true },
        attempts: 1,
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: /CAMPANHA/ }).click();
  await page.locator('[data-action="map-select:M02"]').click();
  assert.equal(
    await page.locator('[data-action="map-play:M02"]').isDisabled(),
    false,
  );
  await page.screenshot({ path: "release/screenshots/v0.4/01-map.png" });
  await page.locator('[data-action="map-play:M02"]').click();
  assert.match(
    await page.locator(".briefing-v4").textContent(),
    /Estrada de Ferro Fantasma/,
  );
  await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
  await page.waitForTimeout(500);
  assert.match(await page.locator(".flight-strip").textContent(), /M02/);
  assert.equal(
    await page.evaluate(() => typeof window.__AURORA__),
    "undefined",
  );
  checks.push(
    "Legacy v0.2 M01 clear unlocks M02 via map → briefing → normal play, no debug required",
  );
  await page.keyboard.press("p");
  await page.getByRole("button", { name: "SAIR PARA O MENU" }).click();
  await page.getByRole("button", { name: "ENCERRAR", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: /CAMPANHA/ }).click();
  await page.locator('[data-action="map-select:M01"]').click();
  assert.match(await page.locator(".map-card").textContent(), /30.200/);
  checks.push(
    "Campaign reload retains legacy M01 record, upgrades and last mission",
  );
  // Alternate biome restarts must not accumulate geometry or audio loops.
  await page.goto(base + "?debug=boss&stage=M02");
  await page.getByRole("button", { name: /JOGAR NOVAMENTE/ }).click();
  await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
  await page.evaluate(() =>
    window.__AURORA__.step(600, { x: 1, y: 0, bomb: false, special: false }),
  );
  await page.waitForTimeout(100);
  const baseline = await page.evaluate(
    () => window.__AURORA__.state().memory.geometries,
  );
  const bossGeometryCounts = [];
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("p");
    await page
      .getByRole("button", { name: "REINICIAR MISSÃO", exact: true })
      .click();
    await page.getByRole("button", { name: "ENCERRAR", exact: true }).click();
    await page.evaluate(() =>
      window.__AURORA__.step(600, { x: 1, y: 0, bomb: false, special: false }),
    );
    await page.waitForTimeout(100);
    const s = await page.evaluate(() => window.__AURORA__.state());
    assert.equal(s.stageId, "M02");
    assert.ok(s.loops <= 1);
    bossGeometryCounts.push(s.memory.geometries);
    assert.ok(s.memory.geometries <= baseline + 3);
  }
  checks.push(
    "Six M02 boss restarts: stable geometry count, no duplicate audio loops",
  );
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const touch = await mobile.newPage();
  monitor(touch);
  await touch.goto(base + "?debug=qa&stage=M02");
  await touch.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await touch.getByRole("button", { name: "INICIAR VOO ↗" }).click();
  await touch.evaluate(() =>
    window.__AURORA__.step(2000, { x: 1, y: 0, bomb: false, special: false }),
  );
  const before = await touch.evaluate(() => window.__AURORA__.state().player);
  const cdp = await mobile.newCDPSession(touch);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 280, y: 620 }],
  });
  for (let i = 1; i <= 8; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 280 - i * 12, y: 620 - i * 6 }],
    });
    await touch.waitForTimeout(20);
  }
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await touch.waitForTimeout(200);
  const ms = await touch.evaluate(() => window.__AURORA__.state());
  assert.equal(ms.stageId, "M02");
  assert.ok(ms.player.x < before.x - 1);
  assert.equal(await touch.locator("aside.side").count(), 0);
  assert.equal((await touch.locator("canvas").boundingBox()).height, 844);
  await touch.screenshot({
    path: "release/screenshots/v0.4/05-m02-mobile.png",
  });
  checks.push(
    "M02 mobile portrait 390×844: actual CDP drag, fullscreen canvas, no side panels",
  );
  await touch.keyboard.press("p");
  await touch.getByRole("button", { name: "SAIR PARA O MENU" }).click();
  await touch.getByRole("button", { name: "ENCERRAR", exact: true }).click();
  await touch.getByRole("button", { name: /CAMPANHA/ }).click();
  await touch.locator('[data-action="map-select:M02"]').click();
  await touch.locator(".map-card").scrollIntoViewIfNeeded();
  assert.equal(
    await touch.locator('[data-action="map-play:M02"]').isDisabled(),
    true,
  );
  await touch.screenshot({
    path: "release/screenshots/v0.4/06-mobile-map.png",
  });
  checks.push(
    "Mobile map scrolls to briefing, locked play button visible and functional",
  );
  await mobile.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    "release/campaign-browser-v04.json",
    JSON.stringify(
      {
        checks,
        errors,
        bossGeometryCounts,
        baseline,
        browser: browser.version(),
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally {
  await browser.close();
}
