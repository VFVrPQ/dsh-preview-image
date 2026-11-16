import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = (name) => readFileSync(fileURLToPath(new URL(name, root)), "utf8");
const pkg = JSON.parse(read("package.json"));

test("package carries the bundle and client declarations DSH installs from", () => {
  assert.equal(pkg.name, "dsh-preview-image");
  assert.equal(pkg.type, "module");
  assert.equal(pkg.main, "lib/index.js");
  assert.equal(pkg.exports["./client"], "./lib/client.js");
  assert.equal(pkg.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(pkg.dsh.client.platform, "web");
  assert.ok(pkg.files.includes("lib/**/*.js"), "subdirectories need a glob in files");
  assert.ok(pkg.files.includes("cordis.patch.yml"));
  assert.equal(pkg.publishConfig.access, "public");
  assert.ok(pkg.dsh.compatibility.dshReleases["0.2.2-rc.1"], "current desktop release must be declared");
});

test("host dependencies stay out of the package", () => {
  assert.equal(pkg.dependencies, undefined);
  assert.deepEqual(Object.keys(pkg.peerDependencies), ["@deepseek-ai/cordis"]);
});

test("the preview manifest matches the renderer's claimed suffixes", () => {
  assert.equal(pkg.dsh.preview.kind, "media");
  assert.equal(pkg.dsh.preview.capability, "image");
  assert.deepEqual(pkg.dsh.preview.extensions, [
    "png",
    "jpg",
    "jpeg",
    "jfif",
    "gif",
    "webp",
    "avif",
    "bmp",
    "ico",
    "svg",
  ]);
});

test("the bundle patch inserts exactly one row named after the package", () => {
  const patch = read("cordis.patch.yml");
  const rows = [...patch.matchAll(/^\s+-\s+id:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  const names = [...patch.matchAll(/^\s+name:\s*(\S+)\s*$/gm)].map((match) => match[1]);
  assert.deepEqual(rows, ["preview-image"]);
  assert.deepEqual(names, [pkg.name]);
});

test("the host half is client-only and needs no services", () => {
  const index = read("lib/index.js");
  assert.match(index, /export const name = "preview-image"/);
  assert.match(index, /export const inject = \[\]/);
  assert.match(index, /export function apply\(\) \{\}/);
});
