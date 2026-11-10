import { mkdirSync } from "node:fs";
mkdirSync("release/screenshots/v0.2", { recursive: true });
import { chromium } from "playwright";
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
await page.goto("http://localhost:4176/?debug=qa");
await page.waitForTimeout(1200);
await page.screenshot({ path: "release/screenshots/v0.2/01-menu.png" });
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await page.evaluate(() =>
  window.__AURORA__.step(3000, { x: 0, y: 0, special: false, bomb: false }),
);
await page.waitForTimeout(600);
await page.screenshot({ path: "release/screenshots/v0.2/02-gameplay.png" });
console.log(
  JSON.stringify({
    errors,
    state: await page.evaluate(() => window.__AURORA__.state()),
  }),
);
await page.goto("http://localhost:4176/?debug=boss");
await page.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await page.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await page.waitForTimeout(4500);
await page.screenshot({ path: "release/screenshots/v0.2/03-boss.png" });
await browser.close();
