/**
 * Sprite SVG del avatar: dirección de mirada, ojos, boca, helpers de href.
 */

export type AvatarDirection =
  | 'base'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export type LeftEyeState = AvatarDirection | 'blink';
export type RightEyeState = AvatarDirection | 'blink' | 'wink';

export const AVATAR_DIRECTIONS = [
  'base',
  'top-left',
  'top',
  'top-right',
  'left',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
] as const;

export const SPEECH_MOUTH_STATES = ['neutral', 'closed', 'a', 'e', 'i', 'o', 'u'] as const;
export type SpeechMouthState = (typeof SPEECH_MOUTH_STATES)[number];

export const SPRITE_PREFIX = 'avatar-sprite';

export const LEFT_EYE_TILES: Record<LeftEyeState, string> = {
  base: 'left-eye-base',
  'top-left': 'left-eye-top-left',
  top: 'left-eye-top',
  'top-right': 'left-eye-top-right',
  left: 'left-eye-left',
  right: 'left-eye-right',
  'bottom-left': 'left-eye-bottom-left',
  bottom: 'left-eye-bottom',
  'bottom-right': 'left-eye-bottom-right',
  blink: 'left-eye-blink',
};

export const RIGHT_EYE_TILES: Record<RightEyeState, string> = {
  base: 'right-eye-base',
  'top-left': 'right-eye-top-left',
  top: 'right-eye-top',
  'top-right': 'right-eye-top-right',
  left: 'right-eye-left',
  right: 'right-eye-right',
  'bottom-left': 'right-eye-bottom-left',
  bottom: 'right-eye-bottom',
  'bottom-right': 'right-eye-bottom-right',
  blink: 'right-eye-blink',
  wink: 'right-eye-wink',
};

export const MOUTH_LEFT_TILES = {
  default: 'mouth-rest-left',
  neutral: 'neutral-slight-open-left',
  closed: 'closed-m-b-p-left',
  a: 'a-wide-open-left',
  e: 'e-mid-open-left',
  i: 'i-tight-stretched-left',
  o: 'o-rounded-left',
  u: 'u-tight-rounded-left',
  smile: 'smile-left',
} as const;

export const MOUTH_RIGHT_TILES = {
  default: 'mouth-rest-right',
  neutral: 'neutral-slight-open-right',
  closed: 'closed-m-b-p-right',
  a: 'a-wide-open-right',
  e: 'e-mid-open-right',
  i: 'i-tight-stretched-right',
  o: 'o-rounded-right',
  u: 'u-tight-rounded-right',
  smile: 'smile-right',
} as const;

export type MouthState = keyof typeof MOUTH_LEFT_TILES;

export function getDirectionFrame(root: HTMLElement, x: number, y: number, forceTrack = false): AvatarDirection {
  const rect = root.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const deadZoneX = rect.width * 0.14;
  const deadZoneY = rect.height * 0.14;
  const maxTrackingDistance = 300;

  const nearestX = Math.max(rect.left, Math.min(x, rect.right));
  const nearestY = Math.max(rect.top, Math.min(y, rect.bottom));
  const distanceFromCanvas = Math.hypot(x - nearestX, y - nearestY);

  if (!forceTrack && distanceFromCanvas > maxTrackingDistance) return 'base';

  const horizontal = Math.abs(dx) <= deadZoneX ? 'center' : dx < 0 ? 'left' : 'right';
  const vertical = Math.abs(dy) <= deadZoneY ? 'center' : dy < 0 ? 'top' : 'bottom';

  if (horizontal === 'center' && vertical === 'center') return 'base';
  if (horizontal === 'center') return vertical as AvatarDirection;
  if (vertical === 'center') return horizontal as AvatarDirection;

  const normalizedX = Math.abs(dx) / Math.max(deadZoneX, 1);
  const normalizedY = Math.abs(dy) / Math.max(deadZoneY, 1);
  const dominantAxisRatio = Math.min(normalizedX, normalizedY) / Math.max(normalizedX, normalizedY);

  if (dominantAxisRatio < 0.72) {
    return normalizedX > normalizedY ? (horizontal as AvatarDirection) : (vertical as AvatarDirection);
  }

  return `${vertical}-${horizontal}` as AvatarDirection;
}

export function isAvatarDirection(value: string | undefined): value is AvatarDirection {
  return Boolean(value && AVATAR_DIRECTIONS.includes(value as AvatarDirection));
}

export function isSpeechMouthState(value: string | undefined): value is SpeechMouthState {
  return Boolean(value && SPEECH_MOUTH_STATES.includes(value as SpeechMouthState));
}

export function setUseTarget(use: SVGUseElement, href: string) {
  if (use.getAttribute('href') === href) return;
  use.setAttribute('href', href);
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
}

export function getSpriteBaseUrl(root: HTMLElement) {
  return root.dataset.avatarSpriteUrl || '';
}

export function getSpriteHref(root: HTMLElement, tileName: string) {
  return `${getSpriteBaseUrl(root)}#${SPRITE_PREFIX}-${tileName}`;
}
