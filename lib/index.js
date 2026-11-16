/**
 * dsh-preview-image — Host half.
 *
 * Everything this plugin adds lives in the browser: a document-preview
 * renderer for image files (zoom, pan, fit modes, rotation, full screen) and a
 * conversation lightbox with the same controls. The Host needs no routes or
 * services, so this entry only mounts the bundle.
 */
export const name = "preview-image";
export const inject = [];

export function apply() {}
