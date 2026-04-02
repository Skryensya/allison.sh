type FolderParts = {
  label: HTMLElement;
  description: HTMLElement | null;
  svg: SVGSVGElement;
  fillPath: SVGPathElement;
};

type FolderShapesState = {
  ro: ResizeObserver | null;
  roots: Set<HTMLElement>;
  rootToParts: WeakMap<HTMLElement, FolderParts>;
  dirty: Set<HTMLElement>;
  raf: number;
};

declare global {
  interface Window {
    __folderShapesInit?: boolean;
    __folderShapesBound?: boolean;
    __folderShapesState?: FolderShapesState;
  }
}

const config = {
  flapHeight: 60,
  bottomPadding: 26,

  desktop: {
    padding: 56,
    flapCurve: 72,
    topLeftRadius: 48,
    rightInset: 56,
    rightDrop: 44,
  },

  mobile: {
    padding: 34,
    flapCurve: 52,
    topLeftRadius: 44,
    rightInset: 46,
    rightDrop: 40,
  },
} as const;

function setupFolderShapes() {
  if (typeof window === 'undefined') return;

  // One runtime for all folders (this component is rendered many times).
  if (window.__folderShapesInit) return;
  window.__folderShapesInit = true;

  const state: FolderShapesState = (window.__folderShapesState ||= {
    ro: null,
    roots: new Set<HTMLElement>(),
    rootToParts: new WeakMap<HTMLElement, FolderParts>(),
    dirty: new Set<HTMLElement>(),
    raf: 0,
  });

  function schedule(root: HTMLElement) {
    state.dirty.add(root);
    if (state.raf) return;
    state.raf = window.requestAnimationFrame(flush);
  }

  function scheduleAll() {
    state.roots.forEach(schedule);
  }

  function flush() {
    state.raf = 0;
    state.dirty.forEach((root) => updateShape(root));
    state.dirty.clear();
  }

  function getParts(root: HTMLElement): FolderParts | null {
    let parts = state.rootToParts.get(root);
    if (parts) return parts;

    const label = root.querySelector('[data-folder-label]');
    const description = root.querySelector('[data-folder-description]');
    const svg = root.querySelector('[data-folder-svg]');
    const fillPath = root.querySelector('[data-folder-fill-path]');

    if (!(label instanceof HTMLElement)) return null;
    if (!(svg instanceof SVGSVGElement)) return null;
    if (!(fillPath instanceof SVGPathElement)) return null;

    parts = {
      label,
      description: description instanceof HTMLElement ? description : null,
      svg,
      fillPath,
    };

    state.rootToParts.set(root, parts);
    return parts;
  }

  function updateShape(root: HTMLElement) {
    const parts = getParts(root);
    if (!parts) return;

    const { label, description, svg, fillPath } = parts;

    // --- Height (grow based on content) ---
    const styles = getComputedStyle(root);
    const minH = Number.parseFloat(styles.getPropertyValue('--folder-min-h')) || 200;

    const labelBottom = label.offsetTop + label.offsetHeight;
    const descriptionBottom = description ? description.offsetTop + description.offsetHeight : 0;
    const contentBottom = Math.max(labelBottom, descriptionBottom);

    const desiredSvgHeight = Math.max(minH, Math.ceil(contentBottom + config.bottomPadding));
    const prevHeight = Number(svg.getAttribute('height')) || 0;
    if (desiredSvgHeight !== prevHeight) svg.setAttribute('height', String(desiredSvgHeight));

    // --- Width / flap geometry ---
    const flapStart = 24;
    const rootWidth = root.clientWidth || 0;
    if (!rootWidth) return;

    const m = rootWidth <= 640 ? config.mobile : config.desktop;

    // Ensure the flap fits *inside* the element.
    const minFlapEnd = flapStart + m.topLeftRadius + m.flapCurve + 14;
    const maxFlapEnd = Math.max(minFlapEnd, rootWidth - m.rightInset - m.flapCurve);
    const maxLabelWidth = Math.max(48, maxFlapEnd - flapStart - m.padding);

    // Keep the label bounded so its measured width can't force an impossible flap.
    label.style.maxWidth = `${maxLabelWidth}px`;
    if (label.dataset.folderEllipsis !== 'true') {
      label.dataset.folderEllipsis = 'true';
      label.style.overflow = 'hidden';
      label.style.textOverflow = 'ellipsis';
    }

    const textWidth = Math.min(label.offsetWidth, maxLabelWidth);
    const flapEnd = Math.max(minFlapEnd, flapStart + textWidth + m.padding);

    // 1 SVG unit == 1 CSS pixel.
    const totalWidth = rootWidth;
    const svgHeight = Number(svg.getAttribute('height')) || desiredSvgHeight;
    const viewBox = `0 0 ${totalWidth} ${svgHeight}`;
    if (svg.getAttribute('viewBox') !== viewBox) svg.setAttribute('viewBox', viewBox);

    const bottomY = svgHeight;

    // Curve control points derived from flapCurve (keeps proportions consistent).
    const c1 = Math.round(m.flapCurve * 0.56);
    const c2 = Math.round(m.flapCurve * 0.17);
    const c3 = Math.round(m.flapCurve * 0.06);
    const c4 = Math.round(m.flapCurve * 0.25);
    const c5 = Math.round(m.flapCurve * 0.5);

    fillPath.setAttribute(
      'd',
      `
        M0 ${config.flapHeight}

        Q0 0 ${m.topLeftRadius} 0
        H ${flapEnd - m.flapCurve}

        C ${flapEnd - c1} 0,
          ${flapEnd - c2} 6,
          ${flapEnd + c3} 20

        C ${flapEnd + c4} 34,
          ${flapEnd + c5} ${config.flapHeight - 4},
          ${flapEnd + m.flapCurve} ${config.flapHeight}

        H ${totalWidth - m.rightInset}

        Q ${totalWidth} ${config.flapHeight}
          ${totalWidth} ${config.flapHeight + m.rightDrop}

        V ${bottomY}
        H 0
        Z
      `.trim()
    );
  }

  function ensureObserver() {
    if (state.ro) return;
    if (!('ResizeObserver' in window)) return;

    // Observe ONLY roots: cheaper, and avoids RO loops caused by mutating the label.
    state.ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) schedule(entry.target);
      }
    });
  }

  function initAll() {
    const roots = document.querySelectorAll('[data-folder]');
    if (!roots.length) return;

    ensureObserver();

    roots.forEach((root) => {
      if (!(root instanceof HTMLElement)) return;
      if (root.dataset.folderInit === 'true') return;
      root.dataset.folderInit = 'true';

      // Cache parts early so updateShape is cheap.
      const parts = getParts(root);
      if (!parts) return;

      state.roots.add(root);
      state.ro?.observe(root);

      schedule(root);
    });
  }

  function cleanup() {
    // Release references so removed nodes can be GC'd between view transitions.
    state.ro?.disconnect();
    state.ro = null;
    state.roots.clear();
    state.rootToParts = new WeakMap<HTMLElement, FolderParts>();
    state.dirty.clear();
    if (state.raf) window.cancelAnimationFrame(state.raf);
    state.raf = 0;
  }

  if (!window.__folderShapesBound) {
    window.__folderShapesBound = true;

    document.addEventListener('astro:page-load', initAll);
    window.addEventListener('astro:before-preparation', cleanup);
    window.addEventListener('pagehide', cleanup);

    // Fallbacks for cases where RO doesn't fire (e.g. font loading / late layout shifts).
    window.addEventListener('resize', scheduleAll);
    window.addEventListener('load', scheduleAll, { once: true });

    // Font load can change label width without resizing the root.
    // (Safe no-op on browsers without the Font Loading API.)
    void (document as any).fonts?.ready?.then(scheduleAll).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll, { once: true });
  } else {
    initAll();
  }
}

setupFolderShapes();

export {};
