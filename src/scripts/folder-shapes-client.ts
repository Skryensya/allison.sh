import { clearCache as pretexClearCache, layout, prepare, type PreparedText } from '@chenglou/pretext';

type FolderParts = {
  label: HTMLElement;
  description: HTMLElement | null;
  svg: SVGSVGElement;
  fillPath: SVGPathElement;
};

type FolderResizeSnapshot = {
  width?: number;
};

type FolderShapesRuntime = {
  observer: ResizeObserver | null;
  roots: Set<HTMLElement>;
  partsByRoot: WeakMap<HTMLElement, FolderParts>;
  dirty: Set<HTMLElement>;
  snapshots: WeakMap<HTMLElement, FolderResizeSnapshot>;
  rafId: number;
  pretexPrepareByKey: Map<string, PreparedText>;
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

function resolveLineHeightPx(cs: CSSStyleDeclaration): number {
  const lh = cs.lineHeight;
  const fs = Number.parseFloat(cs.fontSize) || 16;
  if (lh === 'normal') return fs * 1.55;
  if (lh.endsWith('px')) return Number.parseFloat(lh) || fs * 1.55;
  const n = Number.parseFloat(lh);
  if (Number.isFinite(n)) return n * fs;
  return fs * 1.55;
}

function measureDescriptionWithPretext(
  desc: HTMLElement,
  maxWidth: number,
  pretexPrepareByKey: Map<string, PreparedText>
): { height: number; lineCount: number; lineHeightPx: number } {
  const text = (desc.textContent ?? '').trim();
  const cs = getComputedStyle(desc);
  const lineHeightPx = resolveLineHeightPx(cs);

  if (!text || maxWidth <= 0) {
    return { height: 0, lineCount: 0, lineHeightPx };
  }

  const font = cs.font;
  const key = `${text}\0${font}`;
  let prepared = pretexPrepareByKey.get(key);
  if (!prepared) {
    prepared = prepare(text, font);
    pretexPrepareByKey.set(key, prepared);
  }

  const { height, lineCount } = layout(prepared, maxWidth, lineHeightPx);
  if (lineCount === 0 && text.length > 0) {
    return { height: lineHeightPx, lineCount: 1, lineHeightPx };
  }

  return { height, lineCount, lineHeightPx };
}

/** Móvil, carpeta con otra debajo: solo el papel necesario por el solape del margen + 20px. */
const FOLDER_STACK_TAIL_GAP_PX = 20;

function getStackBottomExtra(root: HTMLElement, rootWidth: number): number {
  if (rootWidth > 640) return 0;

  const stack = root.closest('[data-project-folder-stack]');
  const card = root.closest('[data-project-folder-card]');
  if (!stack || !card) return 0;

  const siblings = stack.querySelectorAll(':scope > [data-project-folder-card]');
  if (!siblings.length || siblings[siblings.length - 1] === card) return 0;

  const s = getComputedStyle(stack);
  const overlap = Number.parseFloat(s.getPropertyValue('--folder-overlap')) || 0;
  const gap = Number.parseFloat(s.getPropertyValue('--folder-gap')) || 0;
  const shapePad = Number.parseFloat(s.getPropertyValue('--folder-shape-bottom-padding')) || 26;

  const encroachment = Math.max(0, overlap - gap);
  return Math.max(0, encroachment - shapePad) + FOLDER_STACK_TAIL_GAP_PX;
}

function setupFolderShapes() {
  if (typeof window === 'undefined') return;
  if (window.__folderShapesInit) return;
  window.__folderShapesInit = true;

  const runtime: FolderShapesRuntime = (window.__folderShapesRuntime ||= {
    observer: null,
    roots: new Set<HTMLElement>(),
    partsByRoot: new WeakMap<HTMLElement, FolderParts>(),
    dirty: new Set<HTMLElement>(),
    snapshots: new WeakMap<HTMLElement, FolderResizeSnapshot>(),
    rafId: 0,
    pretexPrepareByKey: new Map<string, PreparedText>(),
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

  function getMetrics(root: HTMLElement, parts: FolderParts, snapshot?: FolderResizeSnapshot) {
    const styles = getComputedStyle(root);
    const minHeight = Number.parseFloat(styles.getPropertyValue('--folder-min-h')) || 200;
    const rootWidth = snapshot?.width ?? (root.clientWidth || 0);
    const flapStart = Number.parseFloat(styles.getPropertyValue('--folder-pad-x')) || 24;

    const labelRect = parts.label.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    const labelBottom = labelRect.bottom - rootRect.top;

    let descriptionBottom = 0;

    if (parts.description) {
      const padX = Number.parseFloat(styles.getPropertyValue('--folder-pad-x')) || 24;
      let descWidth = parts.description.clientWidth;
      if (descWidth <= 0) {
        descWidth = Math.max(0, rootWidth - 2 * padX);
      }

      const { height: descHeight } = measureDescriptionWithPretext(
        parts.description,
        descWidth,
        runtime.pretexPrepareByKey
      );

      const descTopRaw = Number.parseFloat(getComputedStyle(parts.description).top);
      const descTop = Number.isFinite(descTopRaw) ? descTopRaw : 72;
      descriptionBottom = descTop + descHeight;
    }

    const contentBottom = Math.max(labelBottom, descriptionBottom);
    const bottomExtra = getStackBottomExtra(root, rootWidth);
    const shapePadRaw = styles.getPropertyValue('--folder-shape-bottom-padding');
    const shapePadParsed = Number.parseFloat(shapePadRaw);
    const bottomPadding = Number.isFinite(shapePadParsed)
      ? shapePadParsed
      : FOLDER_GEOMETRY.bottomPadding;
    const svgHeight = Math.max(
      minHeight,
      Math.ceil(contentBottom + bottomPadding + bottomExtra)
    );

    return {
      minHeight,
      rootWidth,
      flapStart,
      contentBottom,
      svgHeight,
      labelWidth: labelRect.width,
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

    const snapshot = runtime.snapshots.get(root);
    const metrics = getMetrics(root, parts, snapshot);
    if (!metrics.rootWidth) return;

    const isMobile = metrics.rootWidth <= 640;
    const pathDataInfo = buildFolderPath(
      metrics.rootWidth,
      metrics.svgHeight,
      metrics.flapStart,
      metrics.labelWidth,
      isMobile
    );

    updateSvgHeight(parts.svg, metrics.svgHeight);
    setContentBottom(root, metrics.contentBottom);

    const maxWidth = `${pathDataInfo.maxLabelWidth}px`;
    if (parts.label.style.maxWidth !== maxWidth) {
      parts.label.style.maxWidth = maxWidth;
    }

    const viewBox = `0 0 ${metrics.rootWidth} ${metrics.svgHeight}`;
    if (parts.svg.getAttribute('viewBox') !== viewBox) {
      parts.svg.setAttribute('viewBox', viewBox);
    }

    if (parts.fillPath.getAttribute('d') !== pathDataInfo.path) {
      parts.fillPath.setAttribute('d', pathDataInfo.path);
    }
    setClipPath(root, pathDataInfo.path);
    runtime.snapshots.delete(root);
  }

  function flush() {
    runtime.rafId = 0;
    runtime.dirty.forEach((root) => updateFolderShape(root));
    runtime.dirty.clear();
  }

  function schedule(root: HTMLElement, snapshot?: FolderResizeSnapshot) {
    if (snapshot) {
      runtime.snapshots.set(root, {
        ...runtime.snapshots.get(root),
        ...snapshot,
      });
    }

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
        if (!(entry.target instanceof HTMLElement)) continue;

        const boxSize = Array.isArray(entry.contentBoxSize)
          ? entry.contentBoxSize[0]
          : entry.contentBoxSize;

        schedule(entry.target, {
          width: boxSize?.inlineSize ?? entry.contentRect.width,
        });
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
    runtime.snapshots = new WeakMap<HTMLElement, FolderResizeSnapshot>();
    runtime.dirty.clear();
    runtime.pretexPrepareByKey.clear();
    pretexClearCache();

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
