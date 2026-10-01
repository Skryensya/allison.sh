import { lightboxAttrs } from '@skryensya/core/lightbox';
import { connectLightbox, lightboxImageFromTrigger, lightboxTriggers, type LightboxConfig } from '@skryensya/core/lightbox-controller';

declare global {
  interface Window {
    __projectLightboxLoaded?: boolean;
    __projectLightboxLifecycleBound?: boolean;
    __setupProjectLightbox?: () => void;
    __projectLightboxMounted?: number;
    __projectLightboxTriggerBound?: boolean;
    __projectLightboxLastOpen?: { count: number; index: number; first?: string };
  }
}

function readLightboxConfig(root: HTMLElement): LightboxConfig {
  const max = Number.parseFloat(root.getAttribute(lightboxAttrs.maxZoom) ?? '');
  return {
    loop: root.hasAttribute(lightboxAttrs.loop) && root.getAttribute(lightboxAttrs.loop) !== 'false',
    zoom: root.getAttribute(lightboxAttrs.zoom) !== 'false',
    maxZoom: Number.isFinite(max) ? max : undefined,
    showCounter: root.getAttribute(lightboxAttrs.counter) !== 'false',
    showCaption: root.getAttribute(lightboxAttrs.caption) !== 'false',
    closeOnBackdropClick: root.getAttribute(lightboxAttrs.closeOnBackdrop) !== 'false',
    counterLabel: root.getAttribute(lightboxAttrs.counterLabel) ?? undefined,
  };
}

function setupProjectLightbox() {
  const dialogs = document.querySelectorAll<HTMLDialogElement>(`dialog[${lightboxAttrs.root}]`);

  dialogs.forEach((dialog) => {
    connectLightbox(dialog, readLightboxConfig(dialog));
  });
  window.__projectLightboxMounted = dialogs.length;

  document.querySelectorAll<HTMLElement>('[data-figure-frame]').forEach((frame) => {
    frame.dataset.lightboxReady = 'true';
  });

  window.__projectLightboxLoaded = true;
}

function bindProjectLightboxTriggers() {
  if (window.__projectLightboxTriggerBound) return;
  window.__projectLightboxTriggerBound = true;

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const trigger = (event.target as Element | null)?.closest?.<HTMLElement>(`[${lightboxAttrs.opens}]`);
    if (!trigger) return;

    const id = trigger.getAttribute(lightboxAttrs.opens);
    const dialog = id ? document.getElementById(id) : null;
    if (!(dialog instanceof HTMLDialogElement)) return;

    const controller = connectLightbox(dialog, readLightboxConfig(dialog));
    const triggers = lightboxTriggers(document, id!);
    const index = triggers.indexOf(trigger);
    if (index < 0) return;

    event.preventDefault();
    const images = triggers.map(lightboxImageFromTrigger);
    window.__projectLightboxLastOpen = { count: images.length, index, first: images[0]?.src };
    controller.open({ images, index, returnFocus: trigger });
    // Capture phase: Astro's ClientRouter listens on `document` too and, for a same-origin <a href>,
    // calls preventDefault() and navigates to the image. It has to see our preventDefault() first.
  }, true);
}

window.__setupProjectLightbox = setupProjectLightbox;

setupProjectLightbox();
bindProjectLightboxTriggers();
for (const delay of [0, 100, 500, 1500]) {
  window.setTimeout(setupProjectLightbox, delay);
}

document.addEventListener('astro:page-load', setupProjectLightbox);

export {};
