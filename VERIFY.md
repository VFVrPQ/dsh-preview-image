# Verification — dsh-preview-image 0.1.1

Everything below was run on 2026-11-16 on Windows 11 (ARM64), Node 24.22.1, Chrome 157.0.8103.51 driven by
Playwright 1.64.1, against the DSH desktop runtime 0.2.2-rc.1 (`@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app`
with this plugin added as a bundle; light theme; 1440×900 viewport).

The desktop application's own `desktop` profile is managed exclusively by the app, so verification used a
temporary profile in a throwaway `DSH_HOME`. The client bundle is the same code the desktop shell loads.

## Unit tests

```sh
node --test test/*.test.js
```

`15` tests pass:

- the bundle requires only `react` and `react-dom` from the loader's platform modules;
- path/name/media-type helpers, including the AVIF/JFIF additions and SVG staying text-readable;
- fit modes never enlarge past 100%, and `actual` is exactly 1;
- a quarter-turn rotation swaps the axes used by the fit (720×1280 at 90° fits by width, at 0°/180° by height);
- rotation swaps the half extents used by the pan clamp;
- pan clamping keeps a small image fully visible and a large one gap-free;
- zoom-at-pointer keeps the image point under the cursor and is reversible;
- `apply` registers exactly one renderer (`priority: "extension"`, `loading: "bytes-complete"`, `wrap: false`),
  the `sidebar.right.tab.document` body under the same id, and the `shell.overlay` lightbox;
- the zh/en dictionaries carry identical keys;
- package shape: `dsh.bundle`, `dsh.client`, `files` globs, no host packages in `dependencies`, one patch row
  named after the package, and a host half with no injected services.

A regression check for the 0.1.1 fix is in the browser E2E: Fit is a request rather than a mode value, so it
recenters after a wheel pan and refits for a rotated orientation even while the mode already reports `fit`.

## Real-app end-to-end

A temporary profile with the plugin, one session seeded by attaching an image in the composer (the model call
fails on purpose with a dummy key; the user message and its image persist), and three test images in that
session's workspace. The same session, workspace, viewport and theme were used for the before/after captures.

### Load

- The page contains `style[data-plugin-css="dsh-preview-image/viewer.css"]` — the client bundle loaded and `apply` ran.
- `[data-slot="shell.overlay"]` exists, so the lightbox layer is mounted.

### Document preview (opening `zz-preview-test-portrait.png`, 720×1280)

| Assertion | Result |
|---|---|
| default fit is below 100% (58%) | PASS |
| zoom-in raises the percentage (58 → 73) | PASS |
| zoom-out lowers the percentage (73 → 47) | PASS |
| fit restores 58% | PASS |
| 1:1 shows 100% | PASS |
| fit width is between fit and 100% (85%) | PASS |
| rotate adds `rotate(90deg)` | PASS |
| fit follows the rotated orientation (58% at 0°/180°, 44% at 90°/270° on a 720×1280 image) | PASS |
| a rotation in fit mode stays centered | PASS |
| plain-wheel pan works in fit mode | PASS |
| Fit recenters after a wheel pan (same mode value) | PASS |
| 1:1 pans with a drag, and 1:1 recenters it | PASS |
| full screen uses the Fullscreen API or the fallback | PASS (API) |
| Escape exits full screen | PASS |
| dragging pans the image | PASS (translate changes) |
| Ctrl+wheel zooms (100 → 182) | PASS |
| keyboard `+` zooms, `0` fits, `R` rotates (90°), `1` = 100% | PASS |
| double-click goes to 100% and back to fit | PASS |
| plain wheel pans the zoomed image | PASS |
| keyboard `F` enters full screen, Escape leaves | PASS |
| a rejected `requestFullscreen()` falls back to the fixed overlay, Escape dismisses it | PASS |
| the **Open with** menu still lists the built-in renderer (“图片”) next to “图片查看器” | PASS |
| no page errors during the run | PASS |

### Conversation lightbox

| Assertion | Result |
|---|---|
| a conversation image click opens the plugin lightbox | PASS |
| the built-in “原图预览” dialog does not open | PASS |
| zoom-in inside the lightbox changes its percentage (88 → 110) | PASS |
| Escape closes it and `body` overflow is restored | PASS |
| focus returns to the image button inside `conversation.chat.user.images` | PASS |
| a background click closes it | PASS |
| a composer attachment thumbnail opens the same lightbox | PASS |

### Formats

- `zz-preview-test-wide2.png` (1600×700, alpha) renders at 38% over the checkerboard.
- `zz-preview-test-large2.png` (2400×1600) renders and switches to 100%.
- `zz-preview-test-vector.svg` renders through the viewer; the **Open with** menu offers `图片查看器`, `图片` and `纯文本`.
- `image preview check` is the seeded session title used by the driver; the title is only a test fixture.

## Before / after evidence

`docs/` holds the captures used in the README:

| File | Meaning |
|---|---|
| `before-document-preview.png` | built-in image renderer, plugin not installed |
| `after-document-preview.png` | plugin renderer, same file/session/viewport |
| `before-lightbox.png` | built-in lightbox (fit only) |
| `after-lightbox.png` | plugin lightbox with its toolbar |
| `after-fullscreen.png` | full screen from the document preview |
| `after-transparent.png` | alpha PNG over the transparency checkerboard |

The “before” profile was `@deepseek-ai/dsh-base` + `@deepseek-ai/dsh-web-app` only; the “after” profile added
`dsh-preview-image`. Nothing else differed.

## Not verified here

- The Electron shell itself (custom `dsh-app://` protocol). The plugin does not use the transport layer; the
  portal, Fullscreen API and Blob URL paths are standard browser APIs and were exercised in Chromium.
- A real model response next to an image message; sending is unrelated to rendering, and a failed turn already
  leaves the image message visible.
- Touch-screen pinch, multi-image galleries and dragging the previewed file into the composer — the plugin does
  not implement them (see README limitations).

## Release ledger

| Item | Value |
|---|---|
| npm | `dsh-preview-image@0.1.1` (latest; tarball sha1 `615fa2aa8e12757d68b2fee5c0f573f4d6c77a46`) |
| GitHub | `VFVrPQ/dsh-preview-image`, tag `v0.1.1` |
| Ticket PR | `439436269-ctrl/superagent-sandbox#49` |
| Preview market | `439436269-ctrl/dsh-preview-market#1` — one catalog file plus the regenerated `catalog.json`; open when this ledger was written, its CI waits for the owner's approval, and a new `dsh-preview-market` release publishes the card |
| Portfolio | `439436269-ctrl/portfolio#1` — station 08 `DSH 插件集` npm chip; open, Pages publishes after merge |
| Feishu | 开发项目 record `reczz28aK1PLSIvo` |

