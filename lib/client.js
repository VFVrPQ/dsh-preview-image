window.__ModuleLoader__.load({
  id: "dsh-preview-image",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    // The lightbox portals to `document.body` so a transformed ancestor inside
    // the shell cannot re-anchor its fixed positioning. `react-dom` is one of
    // the loader's platform modules; a build without it still renders in place.
    let ReactDOM = null;
    try {
      ReactDOM = require("react-dom");
    } catch {
      ReactDOM = null;
    }

    /** This package's copy namespace. */
    const NS = "previewImage";
    /** Renderer identity: the registry definition id and the body slot key. */
    const BODY_ID = "dsh-preview-image/viewer";
    /** Image suffixes this viewer claims; `jfif` and `avif` are additions over the builtin image list. */
    const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "jfif", "gif", "webp", "avif", "bmp", "ico", "svg"];
    /** Bitmap suffixes that are unreadable as text; SVG keeps the plain-text option. */
    const BINARY_EXTENSIONS = ["png", "jpg", "jpeg", "jfif", "gif", "webp", "avif", "bmp", "ico"];
    /** Suffix to Blob media type, matching the browser's own decoders. */
    const MEDIA_TYPES = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      jfif: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      avif: "image/avif",
      bmp: "image/bmp",
      ico: "image/x-icon",
      svg: "image/svg+xml",
    };
    /** Smallest and largest zoom, as a fraction of the image's intrinsic CSS-pixel size. */
    const MIN_SCALE = 0.02;
    const MAX_SCALE = 16;
    /** One toolbar / keyboard zoom step. */
    const ZOOM_STEP = 1.25;
    /** Breathing room around a fitted image, in CSS pixels. */
    const INSET = 18;
    /** Document-preview slots whose images open the builtin lightbox. */
    const IMAGE_SLOT_NAMES = [
      "conversation.chat.message.images",
      "conversation.chat.user.images",
      "conversation.trajectory.images",
      "tool.call.images",
      "conversation.input.attachments",
    ];
    const SLOT_SELECTOR = IMAGE_SLOT_NAMES.map((name) => '[data-slot="' + name + '"]').join(",");

    const zh = {
      title: "图片",
      viewerTitle: "图片查看器",
      preview: "图片预览",
      image: "图片",
      imageAlt: "图片预览：{name}",
      loading: "正在读取图片…",
      waiting: "正在读取图片内容…",
      failed: "无法显示这张图片",
      unsupported: "这个图片格式无法预览",
      controls: "图片缩放与全屏",
      zoomIn: "放大（+）",
      zoomOut: "缩小（-）",
      zoomValue: "当前 {percent}%",
      fit: "适应窗口（0）",
      fitWidth: "适应宽度",
      actualSize: "实际大小 100%（1）",
      rotate: "旋转 90°（R）",
      fullscreen: "全屏（F）",
      exitFullscreen: "退出全屏（Esc）",
      close: "关闭（Esc）",
      hint: "滚轮平移，Ctrl+滚轮缩放，双击在适应窗口与实际大小之间切换",
    };

    const en = {
      title: "Image",
      viewerTitle: "Image viewer",
      preview: "Image preview",
      image: "Image",
      imageAlt: "Image preview: {name}",
      loading: "Loading image...",
      waiting: "Waiting for the image contents...",
      failed: "This image could not be displayed.",
      unsupported: "This image format cannot be previewed.",
      controls: "Image zoom and full screen",
      zoomIn: "Zoom in (+)",
      zoomOut: "Zoom out (-)",
      zoomValue: "Zoom {percent}%",
      fit: "Fit to window (0)",
      fitWidth: "Fit width",
      actualSize: "Actual size, 100% (1)",
      rotate: "Rotate 90° (R)",
      fullscreen: "Full screen (F)",
      exitFullscreen: "Exit full screen (Esc)",
      close: "Close (Esc)",
      hint: "Wheel to pan, Ctrl+wheel to zoom, double-click to alternate fit and 100%.",
    };

    /** Scoped styles; every selector starts at the root attribute. */
    const STYLE = [
      '[data-preview-image]{display:flex;flex-direction:column;flex:1 1 auto;height:100%;min-height:0;box-sizing:border-box;color:var(--dsw-alias-label-primary,#1f2329);background:var(--dsw-alias-bg-document-preview,transparent);font:inherit}',
      '[data-preview-image] .dsh-ip-stage{position:relative;flex:1 1 auto;min-height:0;min-width:0;overflow:hidden;touch-action:none;cursor:grab;background-color:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));background-image:linear-gradient(45deg,rgba(0,0,0,.055) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.055) 75%),linear-gradient(45deg,rgba(0,0,0,.055) 25%,transparent 25%,transparent 75%,rgba(0,0,0,.055) 75%);background-size:16px 16px;background-position:0 0,8px 8px}',
      '[data-preview-image] .dsh-ip-stage:active{cursor:grabbing}',
      '[data-preview-image] .dsh-ip-frame{position:absolute;left:50%;top:50%;transform-origin:center center;will-change:transform;box-shadow:0 2px 18px rgba(0,0,0,.22);background:transparent;user-select:none}',
      '[data-preview-image] .dsh-ip-image{display:block;width:100%;height:100%;object-fit:fill;user-select:none;-webkit-user-drag:none}',
      '[data-preview-image] .dsh-ip-status{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;margin:0;padding:24px;font-size:13px;text-align:center;color:var(--dsw-alias-label-secondary,#5f6368);pointer-events:none}',
      '[data-preview-image] .dsh-ip-status.dsh-ip-error{color:var(--dsw-alias-state-error-label,#d32029)}',
      '[data-preview-image] .dsh-ip-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:6px;flex:none;padding:6px 10px;border-top:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));background:var(--dsw-alias-bg-layer-1,rgba(248,248,245,.94));box-sizing:border-box}',
      '[data-preview-image] .dsh-ip-meta{flex:1 1 90px;min-width:0;font-size:11px;line-height:1.4;color:var(--dsw-alias-label-tertiary,#8a8f98);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding-left:2px}',
      '[data-preview-image] .dsh-ip-group{display:flex;align-items:center;gap:2px;flex:none;padding:2px;border-radius:8px;background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}',
      '[data-preview-image] .dsh-ip-button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-primary,#1f2329);width:26px;height:26px;padding:0;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;font:inherit;font-size:11px;line-height:1}',
      '[data-preview-image] .dsh-ip-button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.1))}',
      '[data-preview-image] .dsh-ip-button:focus-visible{outline:2px solid var(--dsw-alias-label-accent,#2c6ef2);outline-offset:1px}',
      '[data-preview-image] .dsh-ip-button[data-active="true"]{color:var(--dsw-alias-label-accent,#2c6ef2);background:var(--dsw-alias-interactive-bg-selected,rgba(64,128,255,.16))}',
      '[data-preview-image] .dsh-ip-button svg{width:15px;height:15px;display:block}',
      '[data-preview-image] .dsh-ip-percent{appearance:none;border:0;background:transparent;color:inherit;font:inherit;font-size:11px;font-variant-numeric:tabular-nums;min-width:42px;height:26px;padding:0 4px;border-radius:6px;cursor:pointer;text-align:center}',
      '[data-preview-image] .dsh-ip-percent:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.1))}',
      '[data-preview-image] .dsh-ip-text{width:auto;padding:0 7px;font-variant-numeric:tabular-nums}',
      '[data-preview-image]:fullscreen{width:100vw;height:100vh;background:#0a0a0b;color:#f2f3f5}',
      '[data-preview-image][data-fallback-fullscreen="true"]{position:fixed;inset:0;z-index:2147483400;width:100vw;height:100vh;max-width:none;max-height:none;background:#0a0a0b;color:#f2f3f5}',
      '[data-preview-image][data-fullscreen="true"] .dsh-ip-stage{background-color:#000;background-image:none}',
      '[data-preview-image][data-fullscreen="true"] .dsh-ip-toolbar{background:rgba(20,20,22,.86);border-top-color:rgba(255,255,255,.12);color:#f2f3f5}',
      '[data-preview-image][data-fullscreen="true"] .dsh-ip-button,[data-preview-image][data-fullscreen="true"] .dsh-ip-percent{color:#f2f3f5}',
      '[data-preview-image][data-fullscreen="true"] .dsh-ip-group{background:rgba(255,255,255,.1)}',
      '[data-preview-image][data-fullscreen="true"] .dsh-ip-group .dsh-ip-button:hover{background:rgba(255,255,255,.18)}',
      '[data-preview-image][data-fullscreen="true"] .dsh-ip-meta{color:rgba(255,255,255,.62)}',
      '[data-preview-image-lightbox]{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;background:rgba(6,6,8,.97);backdrop-filter:blur(6px);animation:dsh-ip-fade .12s ease-out}',
      '[data-preview-image-lightbox] [data-preview-image]{height:100%;background:transparent}',
      '[data-preview-image-lightbox] .dsh-ip-stage{background-color:transparent;background-image:none}',
      '[data-preview-image-lightbox] .dsh-ip-toolbar{background:rgba(18,18,20,.82);border-top-color:rgba(255,255,255,.1);color:#f2f3f5}',
      '[data-preview-image-lightbox] .dsh-ip-meta{color:rgba(255,255,255,.66)}',
      '[data-preview-image-lightbox] .dsh-ip-button,[data-preview-image-lightbox] .dsh-ip-percent{color:#f2f3f5}',
      '[data-preview-image-lightbox] .dsh-ip-group{background:rgba(255,255,255,.1)}',
      '[data-preview-image-lightbox] .dsh-ip-group .dsh-ip-button:hover{background:rgba(255,255,255,.18)}',
      '@keyframes dsh-ip-fade{from{opacity:0}to{opacity:1}}',
      '@media (prefers-reduced-motion: reduce){[data-preview-image-lightbox]{animation:none}}',
    ].join("\n");

    function installStyle() {
      if (typeof document === "undefined") return;
      const tagId = "dsh-preview-image/viewer.css";
      if (document.querySelector('style[data-plugin-css="' + tagId + '"]') !== null) return;
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-preview-image";
      tag.dataset.pluginCss = tagId;
      tag.textContent = STYLE;
      document.head.appendChild(tag);
    }

    /**
     * Lower-case suffix of a path or address, without query or fragment.
     * @param value - file path or resource address.
     * @returns the suffix, or the empty string when there is none.
     */
    function extensionOf(value) {
      const name = fileNameOf(value).toLowerCase();
      const dot = name.lastIndexOf(".");
      return dot === -1 ? "" : name.slice(dot + 1);
    }

    /**
     * Decoded final path segment of a path or resource address.
     * @param value - file path or resource address.
     * @returns the decoded file name.
     */
    function fileNameOf(value) {
      const raw = String(value === undefined || value === null ? "" : value);
      const withoutSuffix = raw.split("?")[0].split("#")[0];
      const normalized = withoutSuffix.replaceAll("\\", "/");
      const segment = normalized.slice(normalized.lastIndexOf("/") + 1);
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }

    /**
     * Blob media type for a path, or undefined for a suffix this viewer does not claim.
     * @param value - file path or resource address.
     * @returns the media type.
     */
    function mediaTypeOf(value) {
      return MEDIA_TYPES[extensionOf(value)];
    }

    /**
     * Keep a scale inside the supported range.
     * @param scale - requested scale.
     * @returns the clamped scale.
     */
    function clampScale(scale) {
      if (!Number.isFinite(scale) || scale <= 0) return MIN_SCALE;
      return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    }

    /**
     * Scale for a fit mode, never enlarging the image past 100%.
     * @param mode - `fit`, `fit-width`, or `actual`.
     * @param natural - intrinsic size in CSS pixels.
     * @param stage - visible stage size in CSS pixels.
     * @param inset - padding kept around the fitted image.
     * @param rotation - current rotation in degrees; a quarter turn swaps the axes.
     * @returns the scale to apply.
     */
    function fitScale(mode, natural, stage, inset, rotation) {
      if (mode === "actual") return 1;
      if (natural === undefined || natural.w <= 0 || natural.h <= 0) return 1;
      const pad = typeof inset === "number" ? inset : INSET;
      const sideways = Math.abs(((rotation || 0) % 180)) === 90;
      const width = sideways ? natural.h : natural.w;
      const height = sideways ? natural.w : natural.h;
      const availableWidth = Math.max(1, stage.w - pad * 2);
      const availableHeight = Math.max(1, stage.h - pad * 2);
      const widthRatio = availableWidth / width;
      const raw = mode === "fit-width" ? widthRatio : Math.min(widthRatio, availableHeight / height);
      return clampScale(Math.min(1, raw));
    }

    /**
     * Half extents of a scaled, rotated image box.
     * @param natural - intrinsic size.
     * @param scale - applied scale.
     * @param rotation - rotation in degrees.
     * @returns half width and half height of the rotated box.
     */
    function rotatedHalfExtents(natural, scale, rotation) {
      const radians = ((rotation || 0) * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      return {
        hx: ((natural.w * cos + natural.h * sin) * scale) / 2,
        hy: ((natural.w * sin + natural.h * cos) * scale) / 2,
      };
    }

    /**
     * Clamp one center axis so the image either stays inside the stage or
     * covers it without gaps.
     * @param value - requested center offset from the stage center.
     * @param half - half extent of the image box.
     * @param stageHalf - half size of the stage on the same axis.
     * @returns the clamped offset.
     */
    function clampAxis(value, half, stageHalf) {
      if (!Number.isFinite(value)) return 0;
      const limit = half <= stageHalf ? stageHalf - half : half - stageHalf;
      const bounded = Math.max(0, limit);
      return Math.min(bounded, Math.max(-bounded, value));
    }

    /**
     * Keep a view's center inside its allowed range for the current scale and rotation.
     * @param view - scale, x, y, and rotation.
     * @param natural - intrinsic image size.
     * @param stage - stage size.
     * @returns the view with a clamped center.
     */
    function clampView(view, natural, stage) {
      if (natural.w <= 0 || natural.h <= 0 || stage.w <= 0 || stage.h <= 0) return view;
      const extents = rotatedHalfExtents(natural, view.scale, view.rotation);
      return {
        ...view,
        x: clampAxis(view.x, extents.hx, stage.w / 2),
        y: clampAxis(view.y, extents.hy, stage.h / 2),
      };
    }

    /**
     * Move a center so the stage point under the pointer keeps showing the same
     * image point while the scale changes.
     * @param center - current center offset from the stage center.
     * @param anchor - pointer position relative to the stage center.
     * @param nextScale - scale after the change.
     * @param scale - scale before the change.
     * @returns the new center offset.
     */
    function zoomAround(center, anchor, nextScale, scale) {
      if (scale <= 0 || nextScale <= 0) return center;
      const ratio = nextScale / scale;
      return {
        x: anchor.x + (center.x - anchor.x) * ratio,
        y: anchor.y + (center.y - anchor.y) * ratio,
      };
    }

    /**
     * Human byte size, or the empty string when unknown.
     * @param bytes - byte count.
     * @returns the formatted size.
     */
    function formatBytes(bytes) {
      if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return "";
      const units = ["B", "KB", "MB", "GB", "TB"];
      let value = bytes;
      let unit = 0;
      while (value >= 1024 && unit < units.length - 1) {
        value /= 1024;
        unit += 1;
      }
      const rounded = unit === 0 ? String(Math.round(value)) : value.toFixed(value >= 100 ? 0 : 1);
      return rounded + " " + units[unit];
    }

    /**
     * Fill `{key}` placeholders in a localized template.
     * @param template - localized string.
     * @param values - substitution table.
     * @returns the rendered string.
     */
    function fill(template, values) {
      return String(template).replace(/\{(\w+)\}/g, (whole, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : whole,
      );
    }

    /** One small stroke icon. */
    function icon(children) {
      return React.createElement(
        "svg",
        {
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 1.8,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": "true",
          focusable: "false",
        },
        children,
      );
    }

    function iconMinus() {
      return icon(React.createElement("path", { d: "M5 12h14" }));
    }

    function iconPlus() {
      return icon(React.createElement("path", { d: "M12 5v14M5 12h14" }));
    }

    function iconFit() {
      return icon(React.createElement("path", { d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" }));
    }

    function iconFitWidth() {
      return icon(React.createElement("path", { d: "M4 12h16M7 9l-3 3 3 3M17 9l3 3-3 3" }));
    }

    function iconRotate() {
      return icon(React.createElement("path", { d: "M4.5 9.5A8 8 0 1 1 4 14M4 4v6h6" }));
    }

    function iconFullscreen() {
      return icon(React.createElement("path", { d: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" }));
    }

    function iconClose() {
      return icon(React.createElement("path", { d: "M6 6l12 12M18 6L6 18" }));
    }

    /**
     * One toolbar button.
     * @param props - key, label, icon node, click handler, and optional active flag.
     * @returns the button element.
     */
    function toolbarButton(props) {
      return React.createElement(
        "button",
        {
          key: props.key,
          type: "button",
          className: props.text === true ? "dsh-ip-button dsh-ip-text" : "dsh-ip-button",
          "data-preview-image-control": true,
          "data-action": props.action,
          "data-active": props.active === true ? "true" : "false",
          title: props.label,
          "aria-label": props.label,
          onClick: props.onClick,
        },
        props.children,
      );
    }

    /**
     * The zoom/rotate/full-screen image viewer shared by the document preview
     * and the conversation lightbox.
     * @param props - src, name, size, variant, copy, and lightbox callbacks.
     * @returns the viewer.
     */
    function ImageViewer(props) {
      const { src, name, size, variant, t, onClose, onBackgroundClick } = props;
      const lightbox = variant === "lightbox";
      const rootRef = React.useRef(null);
      const stageRef = React.useRef(null);
      const dragRef = React.useRef(null);
      const suppressClickRef = React.useRef(false);
      const [stage, setStage] = React.useState({ w: 0, h: 0 });
      const [natural, setNatural] = React.useState({ w: 0, h: 0 });
      const [view, setView] = React.useState({ scale: 1, x: 0, y: 0, rotation: 0 });
      const [mode, setMode] = React.useState("fit");
      const [fitRequest, setFitRequest] = React.useState(0);
      const [state, setState] = React.useState("loading");
      const [fullscreen, setFullscreen] = React.useState(false);
      const [fallback, setFallback] = React.useState(false);

      const stageValue = React.useRef(stage);
      const naturalValue = React.useRef(natural);
      const viewValue = React.useRef(view);
      stageValue.current = stage;
      naturalValue.current = natural;
      viewValue.current = view;

      React.useEffect(() => {
        const element = stageRef.current;
        if (element === null) return undefined;
        const measure = () => setStage({ w: element.clientWidth, h: element.clientHeight });
        measure();
        if (typeof ResizeObserver === "function") {
          const observer = new ResizeObserver(measure);
          observer.observe(element);
          return () => observer.disconnect();
        }
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
      }, []);

      const settle = React.useCallback((next) => {
        const clamped = clampView(next, naturalValue.current, stageValue.current);
        return clamped;
      }, []);

      const update = React.useCallback(
        (patch) => {
          setView((current) => settle({ ...current, ...patch }));
        },
        [settle],
      );

      // Fit actions are requests, not just mode values: pressing Fit while the
      // view already reports "fit" must still recover from a pan or a rotation.
      const applyMode = React.useCallback((next) => {
        setMode(next);
        setFitRequest((value) => value + 1);
      }, []);

      // Fit modes follow the pane: a resize re-fits the image, and so does a
      // rotation (a quarter turn swaps which axis limits the fit). Manual zoom
      // is left alone.
      React.useEffect(() => {
        if (mode !== "fit" && mode !== "fit-width" && mode !== "actual") return;
        if (natural.w <= 0 || stage.w <= 0 || stage.h <= 0) return;
        const scale = fitScale(mode, natural, stage, INSET, view.rotation);
        setView((current) => settle({ ...current, scale, x: 0, y: 0 }));
      }, [mode, fitRequest, natural.w, natural.h, stage.w, stage.h, view.rotation, settle]);

      const zoomAt = React.useCallback(
        (factor, anchor) => {
          setMode("manual");
          setView((current) => {
            const scale = clampScale(current.scale * factor);
            if (scale === current.scale) return current;
            const center = zoomAround({ x: current.x, y: current.y }, anchor, scale, current.scale);
            return settle({ ...current, scale, x: center.x, y: center.y });
          });
        },
        [settle],
      );

      const zoomCenter = React.useCallback(
        (factor) => zoomAt(factor, { x: 0, y: 0 }),
        [zoomAt],
      );

      const anchorOf = React.useCallback((clientX, clientY) => {
        const element = stageRef.current;
        const box = element === null ? { left: 0, top: 0 } : element.getBoundingClientRect();
        const current = stageValue.current;
        return { x: clientX - box.left - current.w / 2, y: clientY - box.top - current.h / 2 };
      }, []);

      const onWheel = React.useCallback(
        (event) => {
          event.preventDefault();
          if (event.ctrlKey || event.metaKey) {
            const factor = Math.exp(-event.deltaY * 0.0015);
            zoomAt(factor, anchorOf(event.clientX, event.clientY));
            return;
          }
          const current = stageValue.current;
          const unit = event.deltaMode === 1 ? 16 : 1;
          const unitX = event.deltaMode === 2 ? Math.max(1, current.w) : unit;
          const unitY = event.deltaMode === 2 ? Math.max(1, current.h) : unit;
          setView((view) =>
            settle({ ...view, x: view.x - event.deltaX * unitX, y: view.y - event.deltaY * unitY }),
          );
        },
        [anchorOf, settle, zoomAt],
      );

      React.useEffect(() => {
        const element = stageRef.current;
        if (element === null) return undefined;
        const handler = (event) => onWheel(event);
        element.addEventListener("wheel", handler, { passive: false });
        return () => element.removeEventListener("wheel", handler);
      }, [onWheel]);

      const rotate = React.useCallback(() => {
        setView((current) => settle({ ...current, rotation: (current.rotation + 90) % 360 }));
      }, [settle]);

      const toggleFullscreen = React.useCallback(() => {
        const element = rootRef.current;
        if (element === null) return;
        if (fallback) {
          setFallback(false);
          return;
        }
        if (typeof document !== "undefined" && document.fullscreenElement === element) {
          document.exitFullscreen().catch(() => {});
          return;
        }
        if (typeof element.requestFullscreen === "function") {
          element.requestFullscreen().catch(() => setFallback(true));
          return;
        }
        setFallback(true);
      }, [fallback]);

      React.useEffect(() => {
        if (typeof document === "undefined") return undefined;
        const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
        document.addEventListener("fullscreenchange", onChange);
        return () => document.removeEventListener("fullscreenchange", onChange);
      }, []);

      const handleKey = React.useCallback(
        (event) => {
          if (event.ctrlKey || event.metaKey || event.altKey) return;
          const key = event.key;
          // Holding a toggle key must not flip the state back and forth.
          if (event.repeat && /^[fFrR01]$/.test(key)) return;
          if (key === "Escape") {
            if (fallback) {
              event.preventDefault();
              setFallback(false);
              return;
            }
            if (typeof document !== "undefined" && document.fullscreenElement === rootRef.current) {
              event.preventDefault();
              document.exitFullscreen().catch(() => {});
              return;
            }
            if (lightbox && typeof onClose === "function") {
              event.preventDefault();
              onClose();
            }
            return;
          }
          if (key === "f" || key === "F") {
            event.preventDefault();
            toggleFullscreen();
            return;
          }
          if (key === "r" || key === "R") {
            event.preventDefault();
            rotate();
            return;
          }
          if (key === "+" || key === "=") {
            event.preventDefault();
            zoomCenter(ZOOM_STEP);
            return;
          }
          if (key === "-" || key === "_") {
            event.preventDefault();
            zoomCenter(1 / ZOOM_STEP);
            return;
          }
          if (key === "0") {
            event.preventDefault();
            applyMode("fit");
            return;
          }
          if (key === "1") {
            event.preventDefault();
            applyMode("actual");
            return;
          }
          const pan = 40;
          if (key === "ArrowLeft") {
            event.preventDefault();
            update({ x: viewValue.current.x - pan });
          } else if (key === "ArrowRight") {
            event.preventDefault();
            update({ x: viewValue.current.x + pan });
          } else if (key === "ArrowUp") {
            event.preventDefault();
            update({ y: viewValue.current.y - pan });
          } else if (key === "ArrowDown") {
            event.preventDefault();
            update({ y: viewValue.current.y + pan });
          }
        },
        [applyMode, fallback, lightbox, onClose, rotate, toggleFullscreen, update, zoomCenter],
      );

      React.useEffect(() => {
        if (!lightbox) return undefined;
        const listener = (event) => {
          const target = event.target;
          if (target instanceof Element) {
            const tag = target.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea" || target.isContentEditable === true) return;
          }
          handleKey(event);
        };
        window.addEventListener("keydown", listener);
        return () => window.removeEventListener("keydown", listener);
      }, [lightbox, handleKey]);

      React.useEffect(() => {
        if (lightbox && rootRef.current !== null) rootRef.current.focus();
      }, [lightbox]);

      const onPointerDown = React.useCallback((event) => {
        if (event.button !== 0) return;
        const element = stageRef.current;
        if (element === null) return;
        suppressClickRef.current = false;
        dragRef.current = {
          pointerId: event.pointerId,
          clientX: event.clientX,
          clientY: event.clientY,
          originX: viewValue.current.x,
          originY: viewValue.current.y,
          moved: false,
        };
        if (typeof element.setPointerCapture === "function") {
          try {
            element.setPointerCapture(event.pointerId);
          } catch {
            /* a synthetic pointer has no capture target */
          }
        }
      }, []);

      const onPointerMove = React.useCallback(
        (event) => {
          const drag = dragRef.current;
          if (drag === null || drag.pointerId !== event.pointerId) return;
          const dx = event.clientX - drag.clientX;
          const dy = event.clientY - drag.clientY;
          if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 3) {
            drag.moved = true;
            suppressClickRef.current = true;
          }
          setView((current) =>
            settle({ ...current, x: drag.originX + dx, y: drag.originY + dy }),
          );
        },
        [settle],
      );

      const onPointerUp = React.useCallback((event) => {
        const drag = dragRef.current;
        if (drag === null || drag.pointerId !== event.pointerId) return;
        dragRef.current = null;
        if (drag.moved) {
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 0);
        }
      }, []);

      const onStageClick = React.useCallback(
        (event) => {
          if (typeof onBackgroundClick !== "function") return;
          if (suppressClickRef.current) return;
          if (event.target !== stageRef.current) return;
          onBackgroundClick();
        },
        [onBackgroundClick],
      );

      const onStageDoubleClick = React.useCallback(
        (event) => {
          const current = viewValue.current;
          const naturalSize = naturalValue.current;
          const stageSize = stageValue.current;
          if (naturalSize.w <= 0) return;
          const fit = fitScale("fit", naturalSize, stageSize, INSET, current.rotation);
          if (current.scale < 0.999) {
            const anchor = anchorOf(event.clientX, event.clientY);
            const center = zoomAround({ x: current.x, y: current.y }, anchor, 1, current.scale);
            setMode("manual");
            setView((value) => settle({ ...value, scale: 1, x: center.x, y: center.y }));
            return;
          }
          if (Math.abs(current.scale - fit) > 0.001) {
            applyMode("fit");
          } else {
            applyMode("actual");
          }
        },
        [anchorOf, applyMode, settle],
      );

      const onImageLoad = React.useCallback((event) => {
        const image = event.currentTarget;
        setNatural({ w: image.naturalWidth || 0, h: image.naturalHeight || 0 });
        setState("ready");
      }, []);

      const onImageError = React.useCallback(() => setState("failed"), []);

      const percent = Math.round(view.scale * 100);
      const isFullscreen = fullscreen || fallback;
      const metaParts = [];
      if (lightbox && typeof name === "string" && name !== "") metaParts.push(name);
      if (natural.w > 0) metaParts.push(natural.w + " × " + natural.h);
      const formattedSize = formatBytes(size);
      if (formattedSize !== "") metaParts.push(formattedSize);
      const metaText = metaParts.join(" · ");

      const controls = React.createElement(
        "div",
        {
          className: "dsh-ip-toolbar",
          "data-preview-image-control": true,
          role: "toolbar",
          "aria-label": t("controls"),
          title: t("hint"),
        },
        React.createElement("span", { className: "dsh-ip-meta", "data-preview-image-meta": true }, metaText),
        React.createElement(
          "div",
          { className: "dsh-ip-group" },
          toolbarButton({
            key: "out",
            action: "zoom-out",
            label: t("zoomOut"),
            onClick: () => zoomCenter(1 / ZOOM_STEP),
            children: iconMinus(),
          }),
          React.createElement(
            "button",
            {
              type: "button",
              className: "dsh-ip-percent",
              "data-preview-image-control": true,
              "data-action": "zoom-percent",
              title: t("actualSize"),
              "aria-label": fill(t("zoomValue"), { percent }),
              onClick: () => applyMode("actual"),
            },
            percent + "%",
          ),
          toolbarButton({
            key: "in",
            action: "zoom-in",
            label: t("zoomIn"),
            onClick: () => zoomCenter(ZOOM_STEP),
            children: iconPlus(),
          }),
        ),
        React.createElement(
          "div",
          { className: "dsh-ip-group" },
          toolbarButton({
            key: "fit",
            action: "fit",
            label: t("fit"),
            active: mode === "fit",
            onClick: () => applyMode("fit"),
            children: iconFit(),
          }),
          toolbarButton({
            key: "fit-width",
            action: "fit-width",
            label: t("fitWidth"),
            active: mode === "fit-width",
            onClick: () => applyMode("fit-width"),
            children: iconFitWidth(),
          }),
          toolbarButton({
            key: "actual",
            action: "actual-size",
            label: t("actualSize"),
            active: mode === "actual",
            onClick: () => applyMode("actual"),
            text: true,
            children: "1:1",
          }),
        ),
        React.createElement(
          "div",
          { className: "dsh-ip-group" },
          toolbarButton({
            key: "rotate",
            action: "rotate",
            label: t("rotate"),
            onClick: rotate,
            children: iconRotate(),
          }),
          toolbarButton({
            key: "fullscreen",
            action: "fullscreen",
            label: isFullscreen ? t("exitFullscreen") : t("fullscreen"),
            active: isFullscreen,
            onClick: toggleFullscreen,
            children: iconFullscreen(),
          }),
          lightbox
            ? toolbarButton({
                key: "close",
                action: "close",
                label: t("close"),
                onClick: onClose,
                children: iconClose(),
              })
            : null,
        ),
      );

      return React.createElement(
        "div",
        {
          ref: rootRef,
          "data-preview-image": true,
          "data-preview-image-viewer": true,
          "data-variant": variant,
          "data-state": state,
          "data-fullscreen": isFullscreen ? "true" : "false",
          "data-fallback-fullscreen": fallback ? "true" : "false",
          tabIndex: lightbox ? -1 : 0,
          role: lightbox ? "document" : "group",
          "aria-label": t("preview"),
          onKeyDown: lightbox ? undefined : handleKey,
        },
        React.createElement(
          "div",
          {
            ref: stageRef,
            className: "dsh-ip-stage",
            "data-preview-image-stage": true,
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel: onPointerUp,
            onClick: onStageClick,
            onDoubleClick: onStageDoubleClick,
          },
          state === "loading"
            ? React.createElement("p", { className: "dsh-ip-status", "data-preview-image-status": "loading" }, t("loading"))
            : null,
          state === "failed"
            ? React.createElement(
                "p",
                { className: "dsh-ip-status dsh-ip-error", role: "alert", "data-preview-image-status": "failed" },
                t("failed"),
              )
            : null,
          React.createElement(
            "div",
            {
              className: "dsh-ip-frame",
              "data-preview-image-frame": true,
              style: {
                width: natural.w > 0 ? natural.w + "px" : "0px",
                height: natural.h > 0 ? natural.h + "px" : "0px",
                transform:
                  "translate(-50%, -50%) translate(" +
                  view.x +
                  "px, " +
                  view.y +
                  "px) rotate(" +
                  view.rotation +
                  "deg) scale(" +
                  view.scale +
                  ")",
                visibility: state === "ready" ? "visible" : "hidden",
              },
            },
            React.createElement("img", {
              className: "dsh-ip-image",
              "data-preview-image-img": true,
              src,
              alt: name ? fill(t("imageAlt"), { name }) : t("image"),
              draggable: false,
              decoding: "async",
              onLoad: onImageLoad,
              onError: onImageError,
            }),
          ),
        ),
        controls,
      );
    }

    /**
     * The document-preview body for image files: turn the complete bytes into a
     * Blob URL and hand it to the viewer.
     * @param props - document body props.
     * @returns the viewer, or why it is not showing.
     */
    function ImageDocumentBody(props) {
      const { content, resourceAddress, t } = props;
      const meta = props.useResource(resourceAddress);
      const path = resourceAddress;
      const name =
        meta.value && typeof meta.value.absolutePath === "string" && meta.value.absolutePath !== ""
          ? fileNameOf(meta.value.absolutePath)
          : fileNameOf(path);
      const data = content !== undefined && content.kind === "bytes" ? content.data : undefined;
      const mediaType = mediaTypeOf(path);
      const [source, setSource] = React.useState("");
      const [failed, setFailed] = React.useState(false);

      React.useEffect(() => {
        if (data === undefined || mediaType === undefined) {
          setSource("");
          return undefined;
        }
        let url = "";
        try {
          url = URL.createObjectURL(new Blob([data], { type: mediaType }));
          setFailed(false);
          setSource(url);
        } catch {
          setFailed(true);
          setSource("");
          return undefined;
        }
        return () => {
          if (url !== "") URL.revokeObjectURL(url);
        };
      }, [data, mediaType]);

      if (data === undefined) {
        return React.createElement(
          "div",
          { "data-preview-image": true, "data-preview-image-body": true, "data-preview-image-state": "waiting" },
          React.createElement("p", { className: "dsh-ip-status" }, t("waiting")),
        );
      }
      if (mediaType === undefined) {
        return React.createElement(
          "div",
          { "data-preview-image": true, "data-preview-image-body": true, "data-preview-image-state": "unsupported" },
          React.createElement("p", { className: "dsh-ip-status dsh-ip-error", role: "alert" }, t("unsupported")),
        );
      }
      if (failed || source === "") {
        return React.createElement(
          "div",
          { "data-preview-image": true, "data-preview-image-body": true, "data-preview-image-state": "failed" },
          React.createElement("p", { className: "dsh-ip-status dsh-ip-error", role: "alert" }, t("failed")),
        );
      }
      const size = meta.value && typeof meta.value.bytes === "number" ? meta.value.bytes : undefined;
      return React.createElement(
        "div",
        { "data-preview-image": true, "data-preview-image-body": true, "data-preview-image-state": "ready" },
        React.createElement(ImageViewer, { key: source, src: source, name, size, variant: "document", t }),
      );
    }

    /**
     * Find the conversation image a click would send to the builtin lightbox.
     * @param event - click event.
     * @returns the image element and its source, or null.
     */
    function lightboxTriggerOf(event) {
      const target = event.target;
      if (!(target instanceof Element)) return null;
      let image = target.closest("img");
      if (image === null) {
        const host = target.closest('button,[role="button"]');
        if (host !== null) image = host.querySelector("img");
      }
      if (image === null) return null;
      if (image.closest(SLOT_SELECTOR) === null) return null;
      const source = image.currentSrc !== "" ? image.currentSrc : image.src;
      if (typeof source !== "string" || source === "") return null;
      const box = image.getBoundingClientRect();
      if (box.width < 24 || box.height < 24) return null;
      return { image, source };
    }

    /**
     * Replace the builtin lightbox with one that can zoom, pan, rotate and go
     * full screen.
     * @param props - localized copy.
     * @returns the modal, or nothing while it is closed.
     */
    function LightboxLayer(props) {
      const { t } = props;
      const [open, setOpen] = React.useState(null);
      const openerRef = React.useRef(null);

      React.useEffect(() => {
        const onClick = (event) => {
          if (event.defaultPrevented) return;
          if (event.button !== 0) return;
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
          const trigger = lightboxTriggerOf(event);
          if (trigger === null) return;
          event.preventDefault();
          event.stopImmediatePropagation();
          const opener =
            trigger.image.closest("button,[role=\"button\"],[tabindex]") || document.activeElement;
          openerRef.current = opener instanceof HTMLElement ? opener : null;
          const alt = trigger.image.alt;
          setOpen({
            src: trigger.source,
            name: typeof alt === "string" ? alt : "",
          });
        };
        document.addEventListener("click", onClick, true);
        return () => document.removeEventListener("click", onClick, true);
      }, []);

      React.useEffect(() => {
        if (open === null || typeof document === "undefined") return undefined;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = previous;
        };
      }, [open]);

      const close = React.useCallback(() => {
        setOpen(null);
        window.setTimeout(() => {
          const opener = openerRef.current;
          if (opener instanceof HTMLElement && typeof opener.focus === "function") opener.focus();
        }, 0);
      }, []);

      if (open === null) return null;
      const modal = React.createElement(
        "div",
        {
          className: "dsh-ip-lightbox",
          "data-preview-image-lightbox": true,
          role: "dialog",
          "aria-modal": "true",
          "aria-label": t("preview"),
        },
        React.createElement(ImageViewer, {
          key: open.src,
          src: open.src,
          name: open.name,
          variant: "lightbox",
          t,
          onClose: close,
          onBackgroundClick: close,
        }),
      );
      if (ReactDOM !== null && typeof ReactDOM.createPortal === "function" && typeof document !== "undefined") {
        return ReactDOM.createPortal(modal, document.body);
      }
      return modal;
    }

    const inject = ["slots", "locale", "documentPreviews"];

    /**
     * Register the image renderer, its body, and the conversation lightbox for
     * the plugin's lifetime.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      installStyle();
      const t = ctx.locale.bind(NS);
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), "preview-image: dictionaries");
      ctx.effect(
        () =>
          ctx.documentPreviews.register({
            id: BODY_ID,
            extensions: IMAGE_EXTENSIONS,
            binaryExtensions: BINARY_EXTENSIONS,
            priority: "extension",
            title: () => t("viewerTitle"),
            loading: "bytes-complete",
            wrap: false,
          }),
        "preview-image: metadata",
      );
      ctx.effect(
        () =>
          ctx.slots.inject("sidebar.right.tab.document", () =>
            ctx.slots.register(
              {
                name: "sidebar.right.tab.document",
                key: BODY_ID,
                locale: NS,
                inject: () => ({ t }),
              },
              ImageDocumentBody,
            ),
          ),
        "preview-image: document body",
      );
      ctx.effect(
        () =>
          ctx.slots.inject("shell.overlay", () =>
            ctx.slots.register(
              {
                name: "shell.overlay",
                id: "dsh-preview-image:lightbox",
                order: 60,
                locale: NS,
                inject: () => ({ t }),
              },
              LightboxLayer,
            ),
          ),
        "preview-image: lightbox",
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.BODY_ID = BODY_ID;
    exports.IMAGE_EXTENSIONS = IMAGE_EXTENSIONS;
    exports.BINARY_EXTENSIONS = BINARY_EXTENSIONS;
    exports.extensionOf = extensionOf;
    exports.fileNameOf = fileNameOf;
    exports.mediaTypeOf = mediaTypeOf;
    exports.clampScale = clampScale;
    exports.fitScale = fitScale;
    exports.rotatedHalfExtents = rotatedHalfExtents;
    exports.clampAxis = clampAxis;
    exports.clampView = clampView;
    exports.zoomAround = zoomAround;
    exports.formatBytes = formatBytes;
    exports.fill = fill;
    exports.lightboxTriggerOf = lightboxTriggerOf;
    return module.exports;
  },
});
