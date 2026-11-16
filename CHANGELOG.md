# Changelog

## 0.1.1 — 2026-11-16

- **Fix Fit / Fit width / 1:1 doing nothing when the view had drifted inside the same mode.** They now
  issue a re-fit request, so Fit recenters after a wheel pan and 1:1 recenters after a drag, even though the
  mode value did not change.
- **A rotation in a fit mode re-fits for the rotated orientation**: a quarter turn swaps which axis limits the
  fit, and `Fit` uses the rotated dimensions.
- Page-mode wheel events (`deltaMode === 2`) pan by a page instead of one pixel; line-mode stays 16 px.
- Holding `F`, `R`, `0` or `1` no longer flips the state on key auto-repeat.
- Drop a dead document-body prop branch (`props.meta`); the path always comes from `resourceAddress`.

## 0.1.0 — 2026-11-16

First release.

- Document-preview renderer for `png`, `jpg`, `jpeg`, `jfif`, `gif`, `webp`, `avif`, `bmp`, `ico`, `svg`
  (`priority: "extension"`, complete-file read), with an always-visible toolbar: zoom out/in, percentage
  (click for 100%), fit to window, fit width, 1:1, rotate 90°, full screen.
- Conversation lightbox replacement for images in the chat, trajectory, tool and composer-attachment slots:
  same toolbar plus a close control, Escape / background-click close, focus restoration, and `body` scroll lock.
- Wheel pan, Ctrl/⌘+wheel zoom at the pointer, drag pan with bounds, double-click fit/100% toggle, and keyboard
  shortcuts (`+`, `-`, `0`, `1`, `R`, `F`, arrows, `Esc`).
- Fullscreen API with a fixed-overlay fallback; transparency checkerboard; intrinsic-size and file-size metadata.
- The built-in image renderer stays selectable from the preview's Open-with menu; SVG keeps its plain-text option.
