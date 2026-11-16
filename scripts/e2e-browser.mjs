#!/usr/bin/env node
/**
 * End-to-end driver for dsh-preview-image.
 *
 * It drives a running DSH Web host whose profile has this plugin and a session
 * with one image message plus image files in that session's workspace:
 *
 *   node scripts/e2e-browser.mjs \
 *     --base "http://127.0.0.1:<port>/?token=<token>" \
 *     --session "<session title>" --file <image file name> --out <screenshot dir>
 *
 * `playwright-core` is resolved from `$BROWSER_HOME` (the runtime directory the
 * playwright-browser skill installs), and Chrome from `--chrome`, `$CHROME_EXE`,
 * or the default Windows install path.
 *
 * Every check prints PASS/FAIL; the process exits non-zero when any check fails.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

function arg(name, fallback) {
  const at = process.argv.indexOf(`--${name}`);
  return at === -1 ? fallback : process.argv[at + 1];
}

const base = arg("base");
const sessionTitle = arg("session");
const fileName = arg("file");
const outDir = arg("out", join(process.cwd(), "e2e-shots"));
const browserHome = process.env.BROWSER_HOME ?? join(process.env.USERPROFILE ?? "", ".dsh-browser");
const chrome =
  arg("chrome") ??
  process.env.CHROME_EXE ??
  join(process.env.LOCALAPPDATA ?? "", "Google", "Chrome", "Application", "chrome.exe");

if (base === undefined || sessionTitle === undefined || fileName === undefined) {
  console.error("usage: node scripts/e2e-browser.mjs --base <url> --session <title> --file <image> [--out <dir>]");
  process.exit(2);
}
if (!existsSync(join(browserHome, "node_modules", "playwright-core"))) {
  console.error(`playwright-core not found under ${browserHome}; set BROWSER_HOME`);
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });

const require = createRequire(join(browserHome, "package.json"));
const { chromium } = require("playwright-core");
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(ok ? "PASS" : "FAIL", name, detail === undefined ? "" : JSON.stringify(detail));
}

const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(10000);
const errors = [];
page.on("pageerror", (error) => errors.push(String(error).slice(0, 300)));

const percent = async (scope) =>
  Number((await page.locator(`${scope} .dsh-ip-percent`).first().innerText()).replace("%", ""));

try {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(4000);
  for (const label of ["继续", "知道了"]) {
    const button = page.getByRole("button", { name: label, exact: true });
    if (await button.count()) await button.first().click().catch(() => {});
    await page.waitForTimeout(300);
  }

  check(
    "client bundle loaded",
    (await page.locator('style[data-plugin-css="dsh-preview-image/viewer.css"]').count()) === 1,
  );

  await page.getByText(sessionTitle, { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "打开右侧边栏" }).first().click();
  await page.waitForTimeout(1000);
  await page.getByText("工作区文件", { exact: true }).first().click();
  await page.waitForTimeout(2000);
  await page.getByText(fileName, { exact: true }).first().click();
  await page.waitForTimeout(2000);

  const viewer = "[data-preview-image-viewer]";
  check("document renderer replaced the built-in one", (await page.locator(viewer).count()) === 1);
  await page.screenshot({ path: join(outDir, "document-preview.png") });

  const initial = await percent(viewer);
  check("fit is below 100%", initial > 0 && initial < 100, initial);
  await page.locator(`${viewer} [data-action="zoom-in"]`).click();
  check("zoom-in raises the percentage", (await percent(viewer)) > initial, { initial, now: await percent(viewer) });
  await page.locator(`${viewer} [data-action="fit"]`).click();
  check("fit restores the percentage", (await percent(viewer)) === initial, await percent(viewer));
  await page.locator(`${viewer} [data-action="actual-size"]`).click();
  check("actual size is 100%", (await percent(viewer)) === 100, await percent(viewer));
  await page.locator(`${viewer} [data-action="rotate"]`).click();
  const rotated = await page.locator(`${viewer} [data-preview-image-frame]`).evaluate((el) => el.style.transform);
  check("rotate adds 90 degrees", /rotate\(90deg\)/.test(rotated), rotated);

  await page.locator(`${viewer} [data-action="fullscreen"]`).click();
  await page.waitForTimeout(700);
  const full = await page.evaluate(() => document.fullscreenElement !== null);
  check("full screen entered", full);
  await page.screenshot({ path: join(outDir, "fullscreen.png") });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(700);
  check("Escape leaves full screen", !(await page.evaluate(() => document.fullscreenElement !== null)));

  const frame = page.locator(`${viewer} [data-preview-image-frame]`).first();
  const stageBox = await page.locator(`${viewer} [data-preview-image-stage]`).boundingBox();
  const beforePan = await frame.evaluate((el) => el.style.transform);
  await page.mouse.move(stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(stageBox.x + stageBox.width / 2 - 100, stageBox.y + stageBox.height / 2 - 60, { steps: 6 });
  await page.mouse.up();
  check("drag pans the image", (await frame.evaluate((el) => el.style.transform)) !== beforePan);

  const wheelBefore = await percent(viewer);
  await page.keyboard.down("Control");
  await page.mouse.move(stageBox.x + stageBox.width / 2, stageBox.y + stageBox.height / 2);
  await page.mouse.wheel(0, -400);
  await page.keyboard.up("Control");
  await page.waitForTimeout(400);
  check("Ctrl+wheel zooms", (await percent(viewer)) > wheelBefore, { wheelBefore, now: await percent(viewer) });
  await page.screenshot({ path: join(outDir, "document-zoomed.png") });

  const openWith = page.locator('button[aria-label="打开方式"]').first();
  if (await openWith.count()) {
    await openWith.click();
    await page.waitForTimeout(600);
    const menu = await page.evaluate(() => document.body.innerText);
    check("built-in renderer stays available", menu.includes("图片查看器") && menu.includes("图片"));
    await page.keyboard.press("Escape");
  }

  const conversationImage = page.locator('[data-slot="conversation.chat.user.images"] img').first();
  if ((await conversationImage.count()) === 0) {
    check("conversation lightbox (skipped: no image message)", true, "skipped");
  } else {
    await conversationImage.click();
    await page.waitForTimeout(1000);
    const lightbox = "[data-preview-image-lightbox]";
    check("conversation lightbox opened", (await page.locator(lightbox).count()) === 1);
    check("built-in original dialog is gone", (await page.locator('[role="dialog"][aria-label="原图预览"]').count()) === 0);
    const beforeZoom = await percent(lightbox);
    await page.locator(`${lightbox} [data-action="zoom-in"]`).click();
    check("lightbox zooms", (await percent(lightbox)) > beforeZoom, { beforeZoom, now: await percent(lightbox) });
    await page.screenshot({ path: join(outDir, "lightbox.png") });
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);
    check("Escape closes the lightbox", (await page.locator(lightbox).count()) === 0);
    const focused = await page.evaluate(() => document.activeElement?.closest('[data-slot="conversation.chat.user.images"]') !== null);
    check("focus returns to the opener", focused);
  }

  check("no page errors", errors.length === 0, errors);
} catch (error) {
  check("driver completed without an exception", false, String(error).slice(0, 400));
} finally {
  await browser.close().catch(() => {});
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) process.exitCode = 1;
