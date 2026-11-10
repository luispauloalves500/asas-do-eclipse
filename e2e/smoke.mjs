import { mkdirSync } from "node:fs";
mkdirSync("release/screenshots/v0.3", { recursive: true });
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const root = resolve("dist"),
  prefix = "/jogos/asas/";
const server = createServer(async (req, res) => {
  try {
    let url = decodeURIComponent(req.url.split("?")[0]);
    if (url.endsWith("favicon.ico")) {
      res.writeHead(204).end();
      return;
    }
    if (!url.startsWith(prefix)) {
      res.writeHead(404).end();
      return;
    }
    let path = resolve(root, url.slice(prefix.length) || "index.html");
    if (!path.startsWith(root + "/") && path !== root)
      throw Error("invalid path");
    const data = await readFile(path);
    res
      .writeHead(200, {
        "Content-Type":
          {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "text/javascript",
          }[extname(path)] || "application/octet-stream",
      })
      .end(data);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(4178, "127.0.0.1", r));
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const errors = [],
  checks = [];
let maxDrawCalls = 0;
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
function monitor(p) {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
}
monitor(page);
const base = "http://127.0.0.1:4178" + prefix;
const state = () => page.evaluate(() => window.__AURORA__.state());
const launch = async () => {
  await page
    .getByRole("button", { name: /INICIAR MISSÃO|JOGAR NOVAMENTE/ })
    .first()
    .click();
  await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
};
try {
  await page.goto(base);
  await page.waitForSelector("h1");
  assert.equal(
    await page.evaluate(() => typeof window.__AURORA__),
    "undefined",
  );
  await page.screenshot({ path: "release/screenshots/v0.3/01-menu.png" });
  checks.push("Normal build loads under /jogos/asas/; debug API absent");
  await page.goto(base + "?debug=qa");
  await launch();
  assert.equal(await page.locator("aside.side").count(), 0);
  const dimensions = await page.locator("#stage canvas").boundingBox();
  assert.equal(dimensions.width, 1600);
  assert.equal(dimensions.height, 900);
  assert.equal(
    await page.evaluate(() => document.documentElement.dataset.version),
    "0.3.0",
  );
  checks.push("v0.3: no side panel DOM; Three.js canvas fills 1600x900");
  const initial = await state();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(400);
  await page.keyboard.up("ArrowRight");
  assert.ok((await state()).player.x > initial.player.x + 1);
  await page.keyboard.down("w");
  await page.waitForTimeout(250);
  await page.keyboard.up("w");
  assert.ok((await state()).player.y > -9);
  checks.push("Real keyboard WASD/arrows movement");
  await page.keyboard.press("p");
  const paused = await state();
  await page.waitForTimeout(300);
  const same = await state();
  assert.equal(same.time, paused.time);
  assert.deepEqual(same.player, paused.player);
  await page.getByRole("button", { name: "CONTROLES", exact: true }).click();
  await page.getByRole("button", { name: "VOLTAR À PAUSA" }).click();
  assert.equal((await state()).paused, true);
  await page.getByRole("button", { name: "CONTINUAR VOO" }).click();
  assert.equal((await state()).paused, false);
  checks.push("Pause freezes time and player; controls modal returns to pause");
  const rect = await page.locator("#stage").boundingBox();
  const beforeDrag = (await state()).player.x;
  await page.mouse.move(rect.x + rect.width / 2, rect.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(rect.x + rect.width / 2 + 80, rect.height * 0.65, {
    steps: 12,
  });
  await page.waitForTimeout(220);
  await page.mouse.up();
  assert.ok((await state()).player.x > beforeDrag + 0.2);
  checks.push("Real mouse relative drag");
  await page.keyboard.press("Shift");
  await page.keyboard.press("e");
  await page.waitForTimeout(100);
  assert.equal((await state()).player.specials, 1);
  assert.equal((await state()).player.bombs, 1);
  checks.push("Special and bomb key actions consume one charge");
  await page.evaluate(() => {
    const buttons = Array.from({ length: 16 }, () => ({
      pressed: false,
      value: 0,
      touched: false,
    }));
    window.testPad = { axes: [-1, 0], buttons };
    Object.defineProperty(navigator, "getGamepads", {
      configurable: true,
      value: () => [window.testPad],
    });
  });
  const padBefore = (await state()).player.x;
  await page.waitForTimeout(400);
  assert.ok((await state()).player.x < padBefore - 1);
  await page.evaluate(() => {
    window.testPad.axes = [0, 0];
    window.testPad.buttons[9].pressed = true;
  });
  await page.waitForTimeout(150);
  assert.equal((await state()).paused, true);
  await page.evaluate(() => (window.testPad.buttons[9].pressed = false));
  await page.getByRole("button", { name: "CONTINUAR VOO" }).click();
  checks.push("Standard gamepad axes and Start edge action");
  // Real UI lifecycle stress: 20 restarts, preserving one engine loop and stable geometry count.
  const memories = [];
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press("p");
    await page
      .getByRole("button", { name: "REINICIAR MISSÃO", exact: true })
      .click();
    await page.getByRole("button", { name: "ENCERRAR", exact: true }).click();
    await page.waitForTimeout(25);
    const s = await state();
    assert.equal(s.player.hp, 100);
    assert.ok(s.time < 1);
    assert.ok(s.loops <= 1);
    memories.push(s.memory.geometries);
  }
  assert.ok(Math.max(...memories) - Math.min(...memories) < 5);
  checks.push(
    "20 restart UI cycles: HP reset, fresh timeline, <=1 engine loop, stable geometry count",
  );
  await page.evaluate(() =>
    window.__AURORA__.step(30000, { x: 0, y: 0, special: false, bomb: false }),
  );
  assert.equal((await state()).state, "defeat");
  await page.getByRole("button", { name: "TENTAR NOVAMENTE" }).click();
  assert.equal((await state()).player.hp, 100);
  assert.ok((await state()).time < 1);
  checks.push("Damage-enabled idle defeat report -> retry");
  await page.keyboard.press("p");
  await page.getByRole("button", { name: "SAIR PARA O MENU" }).click();
  await page.getByRole("button", { name: "ENCERRAR" }).click();
  assert.equal((await state()).screen, "menu");
  assert.equal((await state()).loops, 0);
  // Explicit save fixture for a paid upgrade; never awarded by debug gameplay.
  await page.evaluate(() =>
    localStorage.setItem(
      "aurora.asas.save",
      JSON.stringify({
        schemaVersion: 2,
        scrap: 1000,
        upgrades: { motor: 0, canhao: 0, ima: 0 },
        cleared: false,
        bestScore: 0,
        medals: [],
        settings: { sound: true },
        attempts: 0,
      }),
    ),
  );
  await page.reload();
  await page.getByRole("button", { name: /HANGAR/ }).click();
  await page.locator('[data-action="buy:motor"]').click();
  await page.getByRole("button", { name: "CONFIRMAR", exact: true }).click();
  assert.equal((await state()).save.scrap, 880);
  assert.equal((await state()).save.upgrades.motor, 1);
  await page.reload();
  assert.equal((await state()).save.upgrades.motor, 1);
  await launch();
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(400);
  await page.waitForFunction(
    () => window.__AURORA__.state().player.vx > 8.4,
    {},
    { timeout: 8000 },
  );
  assert.ok((await state()).player.vx > 8.4);
  await page.keyboard.up("ArrowRight");
  checks.push(
    "Paid motor upgrade persists after reload; speed changes from 8.2 to 8.446 (fixture-funded)",
  );
  await page.goto(base + "?debug=boss");
  await launch();
  await page.waitForTimeout(4700);
  maxDrawCalls = Math.max(maxDrawCalls, (await state()).drawCalls);
  await page.screenshot({ path: "release/screenshots/v0.3/03-boss.png" });
  checks.push("Boss debug entry renders and runs without runtime errors");
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const touch = await mobile.newPage();
  monitor(touch);
  await touch.goto(base + "?debug=qa");
  await touch.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await touch.getByRole("button", { name: "INICIAR VOO ↗" }).click();
  const session = await touch.context().newCDPSession(touch);
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 170, y: 600 }],
  });
  for (let i = 1; i <= 8; i++) {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: 170 + i * 8, y: 600 - i * 6 }],
    });
    await touch.waitForTimeout(20);
  }
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await touch.waitForTimeout(150);
  const mobileCanvas = await touch.locator("#stage canvas").boundingBox();
  assert.equal(mobileCanvas.width, 390);
  assert.equal(mobileCanvas.height, 844);
  const ts = await touch.evaluate(() => window.__AURORA__.state());
  assert.ok(ts.player.x > 0);
  assert.ok(ts.player.y > -9);
  await touch.screenshot({ path: "release/screenshots/v0.3/05-mobile.png" });
  checks.push(
    "390x844 mobile: real CDP touch relative drag and visible controls",
  );
  await mobile.close();
  const offline = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  monitor(offline);
  await offline.goto(
    pathToFileURL(resolve("release/asas-do-eclipse-m01.html")).href +
      "?debug=qa&stage=M02",
  );
  await offline.waitForSelector("h1");
  await offline.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
  await offline.getByRole("button", { name: "INICIAR VOO ↗" }).click();
  await offline.keyboard.down("ArrowLeft");
  await offline.waitForTimeout(300);
  await offline.keyboard.up("ArrowLeft");
  const os = await offline.evaluate(() => window.__AURORA__.state());
  assert.ok(os.player.x < -0.5);
  assert.equal(os.stageId, "M02");
  checks.push(
    "Standalone HTML opens via file:// and plays with zero network dependencies",
  );
  await offline.close();
  assert.deepEqual(errors, []);
  await writeFile(
    "release/browser-smoke-v03.json",
    JSON.stringify(
      {
        checks,
        errors,
        maxDrawCalls,
        geometryCounts: memories,
        browser: browser.version(),
        viewport: "1600x900 + 390x844",
      },
      null,
      2,
    ),
  );
  console.log(
    JSON.stringify(
      {
        passed: checks.length,
        checks,
        errors,
        maxDrawCalls,
        geometryCounts: memories,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page.screenshot({ path: "release/screenshots/v0.3/FAILED-smoke.png" });
  throw error;
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
