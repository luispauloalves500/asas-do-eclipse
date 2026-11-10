import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("release/screenshots/v0.4", { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
const p = await browser.newPage({ viewport: { width: 1600, height: 900 } }),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const root = "http://localhost:4176/";
const shot = async (n) => {
  await p.waitForTimeout(350);
  await p.screenshot({ path: "release/screenshots/v0.4/" + n + ".png" });
};
await p.goto(root + "?debug=qa&stage=M03");
await shot("01-menu");
await p.getByRole("button", { name: /HANGAR/ }).click();
await shot("02-hangar");
await p.getByRole("button", { name: "PREPARAR MISSÃO ↗" }).click();
await shot("03-briefing");
await p.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await p.evaluate(() => {
  window.__AURORA__.step(1, {
    x: 0,
    y: 0,
    special: false,
    bomb: false,
    posture: true,
  });
  window.__AURORA__.step(3200, { x: 0, y: 0, special: false, bomb: false });
});
await shot("05-m03-posture");
await p.goto(root + "?debug=boss&stage=M03");
await p.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await p.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await p.evaluate(() =>
  window.__AURORA__.step(600, { x: 1, y: 0, bomb: false, special: false }),
);
await shot("06-ciclone");
await p.goto(root + "?debug=qa");
await p.getByRole("button", { name: /INICIAR MISSÃO/ }).click();
await p.getByRole("button", { name: "INICIAR VOO ↗" }).click();
await p.evaluate(() =>
  window.__AURORA__.step(3900, { x: -0.1, y: 0, bomb: false, special: false }),
);
await shot("04-m01-improved");
writeFileSync("release/preview-v04.json", JSON.stringify({ errors }, null, 2));
console.log({ errors });
await browser.close();
