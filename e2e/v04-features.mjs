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
const monitor = (p) => {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
};
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
monitor(page);
const state = () => page.evaluate(() => window.__AURORA__.state());
const launch = async (p) => {
  await p
    .getByRole("button", { name: /INICIAR MISSÃO|JOGAR NOVAMENTE/ })
    .first()
    .click();
  await p.getByRole("button", { name: "INICIAR VOO ↗" }).click();
};
try {
  await page.goto(base);
  await page.getByRole("button", { name: /CAMPANHA/ }).click();
  await page.locator('[data-action="map-select:M03"]').click();
  assert.ok(await page.locator('[data-action="map-play:M03"]').isDisabled());
  checks.push("Fresh profile: M03 locked; M04/M05 remain future content");
  // Real v0.3-format save fixture: no new options/upgrade/aircraft fields.
  await page.evaluate(() =>
    localStorage.setItem(
      "aurora.asas.save",
      JSON.stringify({
        schemaVersion: 2,
        scrap: 2200,
        upgrades: { motor: 1, canhao: 0, ima: 1 },
        cleared: true,
        bestScore: 30200,
        medals: ["clear", "rescue"],
        settings: { sound: true },
        attempts: 2,
        campaign: {
          lastStage: "M02",
          stages: {
            M01: {
              cleared: true,
              bestScore: 30200,
              medals: ["clear", "rescue"],
            },
            M02: { cleared: true, bestScore: 35000, medals: ["clear"] },
          },
        },
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: /CAMPANHA/ }).click();
  await page.locator('[data-action="map-select:M03"]').click();
  assert.equal(
    await page.locator('[data-action="map-play:M03"]').isDisabled(),
    false,
  );
  await page.screenshot({ path: "release/screenshots/v0.4/00-map.png" });
  await page.locator('[data-action="map-play:M03"]').click();
  assert.match(await page.locator(".briefing-v4").textContent(), /CICLONE/);
  await page.waitForTimeout(100);
  await page.screenshot({ path: "release/screenshots/v0.4/03-briefing.png" });
  await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
  assert.equal(
    await page.evaluate(() => typeof window.__AURORA__),
    "undefined",
  );
  assert.match(await page.locator(".flight-strip").textContent(), /M03/);
  checks.push(
    "Legacy v0.3 campaign/medals/scrap migrate and unlock M03 through map/briefing/normal gameplay without debug",
  );
  await page.goto(base + "?debug=qa&stage=M03");
  await page.screenshot({ path: "release/screenshots/v0.4/01-menu.png" });
  await page.getByRole("button", { name: /HANGAR/ }).click();
  assert.equal(await page.locator(".upgrade-card").count(), 5);
  assert.ok(await page.locator('[data-action="ship:A02"]').isDisabled());
  await page.screenshot({ path: "release/screenshots/v0.4/02-hangar.png" });
  for (const key of ["cadencia", "blindagem"]) {
    await page.locator(`[data-action="buy:${key}"]`).click();
    await page.getByRole("button", { name: "CONFIRMAR", exact: true }).click();
  }
  assert.equal((await state()).save.scrap, 1960);
  assert.equal((await state()).save.upgrades.cadencia, 1);
  assert.equal((await state()).save.upgrades.blindagem, 1);
  await page.getByRole("button", { name: "← MENU", exact: true }).click();
  await launch(page);
  assert.equal((await state()).player.maxHp, 110);
  await page.keyboard.press("p");
  const pausedTime = (await state()).time;
  await page.getByRole("button", { name: "OPÇÕES", exact: true }).click();
  for (const [k, v] of [
    ["music", 35],
    ["effects", 55],
  ])
    await page.locator(`[data-option="${k}"]`).evaluate((el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, v);
  await page.locator('[data-option="autoFire"]').uncheck();
  await page.locator('[data-option="showHitbox"]').uncheck();
  await page.locator('[data-option="vibration"]').check();
  await page.locator('[data-option="quality"]').selectOption("baixa");
  await page.waitForTimeout(250);
  assert.equal((await state()).time, pausedTime);
  await page.screenshot({
    path: "release/screenshots/v0.4/09-pause-options.png",
  });
  await page.getByRole("button", { name: "VOLTAR À PAUSA" }).click();
  await page.getByRole("button", { name: "CONTINUAR VOO" }).click();
  let shots = (await state()).shots;
  await page.evaluate(() =>
    window.__AURORA__.step(120, { x: 0, y: 0, bomb: false, special: false }),
  );
  assert.equal((await state()).shots, shots);
  await page.keyboard.down(" ");
  await page.waitForFunction((n) => window.__AURORA__.state().shots > n, shots);
  await page.keyboard.up(" ");
  await page.keyboard.press("q");
  await page.waitForFunction(
    () => window.__AURORA__.state().player.posture === "alta",
  );
  assert.equal((await state()).player.invul, 0);
  await page.evaluate(() =>
    window.__AURORA__.step(270, { x: 0, y: 0, bomb: false, special: false }),
  );
  await page.evaluate(() => {
    const buttons = Array.from({ length: 16 }, () => ({
      pressed: false,
      value: 0,
      touched: false,
    }));
    buttons[4].pressed = true;
    window.testPad = { axes: [0, 0], buttons };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [window.testPad],
    });
  });
  await page.waitForFunction(
    () => window.__AURORA__.state().player.posture === "rasante",
  );
  await page.evaluate(() => (window.testPad.buttons[4].pressed = false));
  assert.equal((await state()).music.buses, 2);
  assert.equal((await state()).loops, 1);
  await page.reload();
  const pref = (await state()).options;
  assert.deepEqual(pref, {
    music: 0.35,
    effects: 0.55,
    autoFire: false,
    showHitbox: false,
    vibration: true,
    quality: "baixa",
  });
  assert.equal((await state()).save.upgrades.blindagem, 1);
  checks.push(
    "Five-system hangar: fixture-funded cadence/armor upgrades persist and HP changes to 110; two audio buses/one engine",
  );
  checks.push(
    "Pause options freeze simulation, persist all six settings; real Space manual fire, Q posture and emulated LB edge switch work without immunity",
  );
  // Reward fixture tests actual hangar model selection and A02 stats, not a claimed played campaign reward.
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("aurora.asas.save"));
    s.campaign.stages.M03 = {
      cleared: true,
      bestScore: 44000,
      medals: ["clear", "rescue"],
    };
    s.settings.options.autoFire = true;
    localStorage.setItem("aurora.asas.save", JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole("button", { name: /HANGAR/ }).click();
  await page.locator('[data-action="ship:A02"]').click();
  assert.equal((await state()).save.aircraft, "A02");
  assert.match(await page.locator(".ship-stats").textContent(), /90 HP/);
  await page.screenshot({
    path: "release/screenshots/v0.4/10-hangar-boreas.png",
  });
  await page.getByRole("button", { name: "← MENU", exact: true }).click();
  await launch(page);
  assert.equal((await state()).player.maxHp, 90);
  await page.keyboard.down("ArrowRight");
  await page.waitForFunction(() => window.__AURORA__.state().player.vx > 9.9);
  await page.keyboard.up("ArrowRight");
  checks.push(
    "M03-clear fixture unlocks equipable Bóreas original model; armor retained (90HP), motor speed >9.9; equipment persists",
  );
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const touch = await mobile.newPage();
  monitor(touch);
  await touch.goto(base + "?debug=qa&stage=M03");
  await launch(touch);
  await touch.evaluate(() =>
    window.__AURORA__.step(5200, { x: 1, y: 0, bomb: false, special: false }),
  );
  await touch.locator('[data-action="posture"]').click();
  await touch.waitForFunction(
    () => window.__AURORA__.state().player.posture === "alta",
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
  await touch.waitForFunction(
    (x) => window.__AURORA__.state().player.x < x - 1,
    before.x,
  );
  assert.equal((await touch.locator("canvas").boundingBox()).height, 844);
  assert.equal(await touch.locator("aside.side").count(), 0);
  await touch.screenshot({ path: "release/screenshots/v0.4/08-mobile.png" });
  await touch.keyboard.press("p");
  await touch.getByRole("button", { name: "OPÇÕES", exact: true }).click();
  await touch.locator('[data-option="quality"]').selectOption("media");
  await touch.getByRole("button", { name: "VOLTAR À PAUSA" }).click();
  assert.equal(
    await touch.evaluate(() => window.__AURORA__.state().paused),
    true,
  );
  checks.push(
    "M03 portrait 390×844: native mobile posture button, actual CDP relative touch movement, fullscreen canvas, accessible scrolling pause options; no side panels",
  );
  await mobile.close();
  assert.deepEqual(errors, []);
  writeFileSync(
    "release/features-browser-v04.json",
    JSON.stringify({ checks, errors, browser: browser.version() }, null, 2),
  );
  console.log(JSON.stringify({ checks, errors }, null, 2));
} finally {
  await browser.close();
}
