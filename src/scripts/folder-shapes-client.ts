type FolderParts = {
  label: HTMLElement;
  description: HTMLElement | null;
  svg: SVGSVGElement;
  fillPath: SVGPathElement;
};

type FolderShapesRuntime = {
  observer: ResizeObserver | null;
  roots: Set<HTMLElement>;
  partsByRoot: WeakMap<HTMLElement, FolderParts>;
  dirty: Set<HTMLElement>;
  rafId: number;
};

declare global {
  interface Window {
    __folderShapesInit?: boolean;
    __folderShapesBound?: boolean;
    __folderShapesRuntime?: FolderShapesRuntime;
  }
}

const FOLDER_GEOMETRY = {
  flapHeight: 60,
  bottomPadding: 26,
  bottomRadius: 8,
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
  if (window.__folderShapesInit) return;
  window.__folderShapesInit = true;

  const runtime: FolderShapesRuntime = (window.__folderShapesRuntime ||= {
    observer: null,
    roots: new Set<HTMLElement>(),
    partsByRoot: new WeakMap<HTMLElement, FolderParts>(),
    dirty: new Set<HTMLElement>(),
    rafId: 0,
  });

  function getFolderParts(root: HTMLElement): FolderParts | null {
    const cached = runtime.partsByRoot.get(root);
    if (cached) return cached;

    const label = root.querySelector('[data-folder-label]');
    const description = root.querySelector('[data-folder-description]');
    const svg = root.querySelector('[data-folder-svg]');
    const fillPath = root.querySelector('[data-folder-fill-path]');

    if (!(label instanceof HTMLElement)) return null;
    if (!(svg instanceof SVGSVGElement)) return null;
    if (!(fillPath instanceof SVGPathElement)) return null;

    const parts: FolderParts = {
      label,
      description: description instanceof HTMLElement ? description : null,
      svg,
      fillPath,
    };

    runtime.partsByRoot.set(root, parts);
    return parts;
  }

  function setContentBottom(root: HTMLElement, contentBottom: number) {
    const value = `${Math.ceil(contentBottom)}px`;
    root.style.setProperty('--folder-content-bottom', value);

    const card = root.closest('[data-project-folder-card]');
    if (card instanceof HTMLElement) {
      card.style.setProperty('--folder-content-bottom', value);
    }
  }

  function setClipPath(root: HTMLElement, pathData: string) {
    const clipPath = `path('${pathData.replace(/\s+/g, ' ').trim()}')`;
    root.style.setProperty('--folder-clip-path', clipPath);

    const card = root.closest('[data-project-folder-card]');
    if (card instanceof HTMLElement) {
      card.style.setProperty('--folder-clip-path', clipPath);
    }
  }

  function getMetrics(root: HTMLElement, parts: FolderParts) {
    const styles = getComputedStyle(root);
    const minHeight = Number.parseFloat(styles.getPropertyValue('--folder-min-h')) || 200;
    const rootWidth = root.clientWidth || 0;
    const flapStart = Number.parseFloat(styles.getPropertyValue('--folder-pad-x')) || 24;

    const labelBottom = parts.label.offsetTop + parts.label.offsetHeight;
    const descriptionBottom = parts.description ? parts.description.offsetTop + parts.description.offsetHeight : 0;
    const contentBottom = Math.max(labelBottom, descriptionBottom);
    const svgHeight = Math.max(minHeight, Math.ceil(contentBottom + FOLDER_GEOMETRY.bottomPadding));

    return {
      styles,
      minHeight,
      rootWidth,
      flapStart,
      contentBottom,
      svgHeight,
      shape: rootWidth <= 640 ? FOLDER_GEOMETRY.mobile : FOLDER_GEOMETRY.desktop,
    };
  }

  function updateSvgHeight(svg: SVGSVGElement, height: number) {
    const currentHeight = Number(svg.getAttribute('height')) || 0;
    if (currentHeight !== height) {
      svg.setAttribute('height', String(height));
    }
  }

  function buildFolderPath(width: number, height: number, flapStart: number, labelWidth: number, mobile: boolean) {
    const shape = mobile ? FOLDER_GEOMETRY.mobile : FOLDER_GEOMETRY.desktop;
    const minFlapEnd = flapStart + shape.topLeftRadius + shape.flapCurve + 14;
    const maxFlapEnd = Math.max(minFlapEnd, width - shape.rightInset - shape.flapCurve);
    const maxLabelWidth = Math.max(48, maxFlapEnd - flapStart - shape.padding);
    const flapEnd = Math.max(minFlapEnd, flapStart + Math.min(labelWidth, maxLabelWidth) + shape.padding);

    const c1 = Math.round(shape.flapCurve * 0.56);
    const c2 = Math.round(shape.flapCurve * 0.17);
    const c3 = Math.round(shape.flapCurve * 0.06);
    const c4 = Math.round(shape.flapCurve * 0.25);
    const c5 = Math.round(shape.flapCurve * 0.5);

    const radius = Math.max(
      0,
      Math.min(
        FOLDER_GEOMETRY.bottomRadius,
        Math.floor(width / 2),
        Math.floor((height - FOLDER_GEOMETRY.flapHeight) / 2)
      )
    );

    return {
      maxLabelWidth,
      path: `
        M0 ${FOLDER_GEOMETRY.flapHeight}
        Q0 0 ${shape.topLeftRadius} 0
        H ${flapEnd - shape.flapCurve}
        C ${flapEnd - c1} 0, ${flapEnd - c2} 6, ${flapEnd + c3} 20
        C ${flapEnd + c4} 34, ${flapEnd + c5} ${FOLDER_GEOMETRY.flapHeight - 4}, ${flapEnd + shape.flapCurve} ${FOLDER_GEOMETRY.flapHeight}
        H ${width - shape.rightInset}
        Q ${width} ${FOLDER_GEOMETRY.flapHeight} ${width} ${FOLDER_GEOMETRY.flapHeight + shape.rightDrop}
        V ${height - radius}
        Q ${width} ${height} ${width - radius} ${height}
        H ${radius}
        Q 0 ${height} 0 ${height - radius}
        V ${FOLDER_GEOMETRY.flapHeight}
        Z
      `.trim(),
    };
  }

  function updateFolderShape(root: HTMLElement) {
    const parts = getFolderParts(root);
    if (!parts) return;

    const metrics = getMetrics(root, parts);
    if (!metrics.rootWidth) return;

    updateSvgHeight(parts.svg, metrics.svgHeight);
    setContentBottom(root, metrics.contentBottom);

    const isMobile = metrics.rootWidth <= 640;
    const pathDataInfo = buildFolderPath(
      metrics.rootWidth,
      metrics.svgHeight,
      metrics.flapStart,
      parts.label.offsetWidth,
      isMobile
    );

    parts.label.style.maxWidth = `${pathDataInfo.maxLabelWidth}px`;

    const viewBox = `0 0 ${metrics.rootWidth} ${metrics.svgHeight}`;
    if (parts.svg.getAttribute('viewBox') !== viewBox) {
      parts.svg.setAttribute('viewBox', viewBox);
    }

    parts.fillPath.setAttribute('d', pathDataInfo.path);
    setClipPath(root, pathDataInfo.path);
  }

  function flush() {
    runtime.rafId = 0;
    runtime.dirty.forEach((root) => updateFolderShape(root));
    runtime.dirty.clear();
  }

  function schedule(root: HTMLElement) {
    runtime.dirty.add(root);
    if (runtime.rafId) return;
    runtime.rafId = window.requestAnimationFrame(flush);
  }

  function scheduleAll() {
    runtime.roots.forEach(schedule);
  }

  function ensureObserver() {
    if (runtime.observer || !('ResizeObserver' in window)) return;

    runtime.observer = new ResizeObserver((entries) => {
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

      const parts = getFolderParts(root);
      if (!parts) return;

      root.dataset.folderInit = 'true';
      runtime.roots.add(root);
      runtime.observer?.observe(root);
      schedule(root);
    });
  }

  function cleanup() {
    runtime.observer?.disconnect();
    runtime.observer = null;
    runtime.roots.clear();
    runtime.partsByRoot = new WeakMap<HTMLElement, FolderParts>();
    runtime.dirty.clear();

    if (runtime.rafId) {
      window.cancelAnimationFrame(runtime.rafId);
      runtime.rafId = 0;
    }
  }

  if (!window.__folderShapesBound) {
    window.__folderShapesBound = true;

    document.addEventListener('astro:page-load', initAll);
    window.addEventListener('astro:before-preparation', cleanup);
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('resize', scheduleAll);
    window.addEventListener('load', scheduleAll, { once: true });
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
