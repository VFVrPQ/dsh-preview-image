# Changelog

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
