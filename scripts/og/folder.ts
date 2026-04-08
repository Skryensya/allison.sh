import { type FolderGeometry } from './config';
import { clamp, estimateTitleWidth } from './utils';

export function createFolderGeometry(title: string): FolderGeometry {
  const width = 1132;
  const height = 420;
  const flapHeight = 68;
  const topLeftRadius = 48;
  const rightInset = 54;
  const rightDrop = 50;
  const flapCurve = 82;
  const bottomRadius = 8;
  const flapStart = 78;
  const topInset = 0;
  const topLift = 0;
  const estimatedTitleWidth = estimateTitleWidth(title, 54);
  const minFlapEnd = flapStart + topLeftRadius + flapCurve + 14;
  const maxFlapEnd = width - rightInset - flapCurve;
  const flapEnd = clamp(flapStart + estimatedTitleWidth + 62, minFlapEnd, maxFlapEnd);

  return {
    width,
    height,
    flapHeight,
    topLeftRadius,
    rightInset,
    rightDrop,
    flapCurve,
    bottomRadius,
    flapStart,
    flapEnd,
    topInset,
    topLift,
  };
}

export function createFolderPath(geometry: FolderGeometry): string {
  const {
    width,
    height,
    flapHeight,
    topLeftRadius,
    rightInset,
    rightDrop,
    flapCurve,
    bottomRadius,
    flapEnd,
  } = geometry;

  const c1 = Math.round(flapCurve * 0.56);
  const c2 = Math.round(flapCurve * 0.17);
  const c3 = Math.round(flapCurve * 0.06);
  const c4 = Math.round(flapCurve * 0.25);
  const c5 = Math.round(flapCurve * 0.5);
  const bottomY = height;
  const rightX = width;

  return `
    M0 ${flapHeight}
    Q0 0 ${topLeftRadius} 0
    H ${flapEnd - flapCurve}
    C ${flapEnd - c1} 0, ${flapEnd - c2} 7, ${flapEnd + c3} 24
    C ${flapEnd + c4} 38, ${flapEnd + c5} ${flapHeight - 4}, ${flapEnd + flapCurve} ${flapHeight}
    H ${rightX - rightInset}
    Q ${rightX} ${flapHeight} ${rightX} ${flapHeight + rightDrop}
    V ${bottomY - bottomRadius}
    Q ${rightX} ${bottomY} ${rightX - bottomRadius} ${bottomY}
    H ${bottomRadius}
    Q 0 ${bottomY} 0 ${bottomY - bottomRadius}
    V ${flapHeight}
    Z
  `
    .replace(/\s+/g, ' ')
    .trim();
}
