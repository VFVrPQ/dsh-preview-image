import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const CLIENT_PATH = fileURLToPath(new URL("../lib/client.js", import.meta.url));

/**
 * Load the hand-written module-loader bundle in a sandbox and return its
 * exports. Only the platform modules the bundle is allowed to require are
 * provided; anything else is a wiring bug.
 * @returns the bundle's exports object.
 */
function loadClient() {
  const source = readFileSync(CLIENT_PATH, "utf8");
  let definition;
  const created = [];
  const React = {
    createElement: (type, props, ...children) => ({ type, props, children }),
    useState: () => [undefined, () => {}],
    useRef: () => ({ current: undefined }),
    useEffect: () => {},
    useCallback: (fn) => fn,
  };
  const ReactDOM = { createPortal: (node) => node };
  const document = {
    querySelector: () => null,
    createElement: () => {
      const tag = { dataset: {}, style: {}, textContent: "", appendChild: () => {} };
      created.push(tag);
      return tag;
    },
    head: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { style: {} },
  };
  const window = { __ModuleLoader__: { load: (value) => (definition = value) } };
  const sandbox = { window, document, console, URL, Blob, setTimeout, clearTimeout, Element: class Element {} };
  vm.runInContext(source, vm.createContext(sandbox));
  assert.ok(definition, "the bundle must call window.__ModuleLoader__.load");
  assert.equal(definition.id, "dsh-preview-image");
  const exports = definition.factory((name) => {
    if (name === "react") return React;
    if (name === "react-dom") return ReactDOM;
    throw new Error(`unexpected platform module: ${name}`);
  });
  return { exports, created, source };
}

test("bundle requires only the platform modules the loader guarantees", () => {
  const source = readFileSync(CLIENT_PATH, "utf8");
  const required = [...source.matchAll(/require\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(required)].sort(), ["react", "react-dom"]);
});

test("pure helpers resolve paths and media types", () => {
  const { exports } = loadClient();
  assert.equal(exports.extensionOf("C:\\pics\\Holiday.JPG?raw=1"), "jpg");
  assert.equal(exports.fileNameOf("dsh-resource://file/session/s1/a/b/%E5%9B%BE.png"), "图.png");
  assert.equal(exports.mediaTypeOf("a/b/photo.AVIF"), "image/avif");
  assert.equal(exports.mediaTypeOf("a/b/vector.svg"), "image/svg+xml");
  assert.equal(exports.mediaTypeOf("a/b/notes.txt"), undefined);
  assert.equal(exports.fileNameOf(""), "");
});

test("the claimed suffixes match the builtin image list plus jfif and avif", () => {
  const { exports } = loadClient();
  assert.ok(exports.IMAGE_EXTENSIONS.includes("avif"));
  assert.ok(exports.IMAGE_EXTENSIONS.includes("jfif"));
  assert.ok(exports.IMAGE_EXTENSIONS.includes("svg"));
  assert.ok(!exports.BINARY_EXTENSIONS.includes("svg"), "SVG keeps the plain-text option");
  for (const extension of exports.BINARY_EXTENSIONS) {
    assert.ok(exports.IMAGE_EXTENSIONS.includes(extension), `${extension} must also be claimed`);
  }
});

test("scale helpers clamp and fit without enlarging", () => {
  const { exports } = loadClient();
  assert.equal(exports.clampScale(0), 0.02);
  assert.equal(exports.clampScale(1e9), 16);
  assert.equal(exports.clampScale(Number.NaN), 0.02);
  const stage = { w: 400, h: 300 };
  assert.equal(exports.fitScale("fit", { w: 100, h: 100 }, stage, 0), 1);
  assert.equal(exports.fitScale("fit", { w: 1000, h: 500 }, stage, 0), 0.4);
  assert.equal(exports.fitScale("fit-width", { w: 1000, h: 500 }, stage, 0), 0.4);
  assert.equal(exports.fitScale("fit", { w: 1000, h: 900 }, stage, 0), 300 / 900);
  assert.equal(exports.fitScale("actual", { w: 1000, h: 900 }, stage, 0), 1);
  assert.equal(exports.fitScale("fit", { w: 0, h: 0 }, stage, 0), 1);
});

test("rotation swaps the half extents a pan clamp sees", () => {
  const { exports } = loadClient();
  const upright = exports.rotatedHalfExtents({ w: 100, h: 50 }, 1, 0);
  assert.deepEqual([upright.hx, upright.hy], [50, 25]);
  const sideways = exports.rotatedHalfExtents({ w: 100, h: 50 }, 1, 90);
  assert.ok(Math.abs(sideways.hx - 25) < 1e-9);
  assert.ok(Math.abs(sideways.hy - 50) < 1e-9);
});

test("pan clamping keeps a small image visible and a large one gap-free", () => {
  const { exports } = loadClient();
  // Large image: the center may only move by the overflow.
  assert.equal(exports.clampAxis(500, 300, 200), 100);
  assert.equal(exports.clampAxis(-500, 300, 200), -100);
  // Small image: it may travel until its edge reaches the stage edge.
  assert.equal(exports.clampAxis(500, 50, 200), 150);
  assert.equal(exports.clampAxis(-500, 50, 200), -150);
  const clamped = exports.clampView({ scale: 1, x: 900, y: -900, rotation: 0 }, { w: 1000, h: 500 }, { w: 400, h: 300 });
  assert.equal(clamped.x, 300);
  assert.equal(clamped.y, -100);
});

test("zoom around a pointer keeps the image point under the cursor", () => {
  const { exports } = loadClient();
  const center = { x: 0, y: 0 };
  const anchor = { x: 100, y: 0 };
  const next = exports.zoomAround(center, anchor, 2, 1);
  assert.equal(next.x, -100);
  assert.equal(next.y, 0);
  // Zooming back out from the adjusted center returns to the start.
  const back = exports.zoomAround(next, anchor, 1, 2);
  assert.equal(back.x, 0);
  assert.equal(back.y, 0);
});

test("formatting helpers", () => {
  const { exports } = loadClient();
  assert.equal(exports.formatBytes(0), "0 B");
  assert.equal(exports.formatBytes(1024), "1.0 KB");
  assert.equal(exports.formatBytes(1048576), "1.0 MB");
  assert.equal(exports.formatBytes(undefined), "");
  assert.equal(exports.fill("缩放 {percent}%", { percent: 120 }), "缩放 120%");
});

test("apply registers the renderer, its body, and the lightbox overlay", () => {
  const { exports } = loadClient();
  const previews = [];
  const slots = [];
  const locales = [];
  const ctx = {
    locale: {
      bind: () => (key, values) =>
        values === undefined ? key : key + JSON.stringify(values),
      register: (namespace, dictionaries) => {
        locales.push({ namespace, dictionaries });
        return () => {};
      },
    },
    documentPreviews: {
      register: (definition) => {
        previews.push(definition);
        return () => {};
      },
    },
    slots: {
      inject: (name, factory) => factory(),
      register: (options, component) => {
        slots.push({ options, component });
        return () => {};
      },
    },
    effect: (factory) => factory(),
  };
  exports.apply(ctx);

  assert.equal(previews.length, 1);
  const preview = previews[0];
  assert.equal(preview.id, exports.BODY_ID);
  assert.equal(preview.priority, "extension");
  assert.equal(preview.loading, "bytes-complete");
  assert.equal(preview.wrap, false);
  assert.deepEqual(preview.extensions, exports.IMAGE_EXTENSIONS);
  assert.deepEqual(preview.binaryExtensions, exports.BINARY_EXTENSIONS);

  const body = slots.find((entry) => entry.options.name === "sidebar.right.tab.document");
  assert.ok(body, "the document body slot must be registered");
  assert.equal(body.options.key, exports.BODY_ID);
  assert.equal(typeof body.component, "function");

  const overlay = slots.find((entry) => entry.options.name === "shell.overlay");
  assert.ok(overlay, "the lightbox layer must be registered on shell.overlay");
  assert.equal(overlay.options.id, "dsh-preview-image:lightbox");
  assert.equal(typeof overlay.component, "function");

  assert.equal(locales.length, 1);
  assert.equal(locales[0].namespace, "previewImage");
  const zhKeys = Object.keys(locales[0].dictionaries.zh).sort();
  const enKeys = Object.keys(locales[0].dictionaries.en).sort();
  assert.deepEqual(zhKeys, enKeys, "both dictionaries must carry the same keys");
});

test("the injected stylesheet is scoped to the plugin root", () => {
  const { exports } = loadClient();
  const ctx = {
    locale: { bind: () => (key) => key, register: () => () => {} },
    documentPreviews: { register: () => () => {} },
    slots: { inject: (name, factory) => factory(), register: () => () => {} },
    effect: (factory) => factory(),
  };
  exports.apply(ctx);
  const style = loadClient();
  assert.ok(style.source.includes('[data-preview-image]{'));
  assert.ok(style.source.includes("[data-preview-image-lightbox]{"));
  assert.ok(style.source.includes('style[data-plugin-css="'));
});
