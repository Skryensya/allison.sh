import { avatarHats, avatarOutfits, avatarSpecialConfigs } from '@/data/avatarSprite';

type AvatarDirection =
  | 'base'
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

type AvatarRoot = HTMLElement & {
  __avatarCleanup?: () => void;
  __avatarObserved?: boolean;
};

type LeftEyeState = AvatarDirection | 'blink';
type RightEyeState = AvatarDirection | 'blink' | 'wink';

const AVATAR_DIRECTIONS = [
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
const SPEECH_MOUTH_STATES = ['neutral', 'closed', 'a', 'e', 'i', 'o', 'u'] as const;
const SPRITE_PREFIX = 'avatar-sprite';

let avatarObserver: IntersectionObserver | null = null;
let lifecycleBound = false;

const LEFT_EYE_TILES: Record<LeftEyeState, string> = {
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

const RIGHT_EYE_TILES: Record<RightEyeState, string> = {
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

const MOUTH_LEFT_TILES = {
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

const MOUTH_RIGHT_TILES = {
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

type SpeechMouthState = (typeof SPEECH_MOUTH_STATES)[number];
type MouthState = keyof typeof MOUTH_LEFT_TILES;

function getDirectionFrame(root: HTMLElement, x: number, y: number, forceTrack = false): AvatarDirection {
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

function isAvatarDirection(value: string | undefined): value is AvatarDirection {
  return Boolean(value && AVATAR_DIRECTIONS.includes(value as AvatarDirection));
}

function isSpeechMouthState(value: string | undefined): value is SpeechMouthState {
  return Boolean(value && SPEECH_MOUTH_STATES.includes(value as SpeechMouthState));
}

function setUseTarget(use: SVGUseElement, href: string) {
  if (use.getAttribute('href') === href) return;
  use.setAttribute('href', href);
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
}

function getSpriteBaseUrl(root: HTMLElement) {
  return root.dataset.avatarSpriteUrl || '';
}

function getSpriteHref(root: HTMLElement, tileName: string) {
  return `${getSpriteBaseUrl(root)}#${SPRITE_PREFIX}-${tileName}`;
}

const SPECIAL_AVATAR_UNLOCK_KEY = 'special-themes-visible';
const DEFAULT_AVATAR_OUTFIT_KEY = 'avatar-outfit';
const DEFAULT_AVATAR_HAT_KEY = 'avatar-hat';
const ACTIVE_SPECIAL_AVATAR_CONFIG_KEY = 'avatar-special-config';
const SPECIAL_OUTFIT_NAMES = new Set<string>(avatarSpecialConfigs.map((config) => config.outfit));
const SPECIAL_HAT_NAMES = new Set<string>(avatarSpecialConfigs.map((config) => config.hat));

type AvatarSpecialConfig = (typeof avatarSpecialConfigs)[number];

function hasSpecialAvatarUnlock() {
  try {
    return localStorage.getItem(SPECIAL_AVATAR_UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

function getNormalOutfitNames() {
  return Object.keys(avatarOutfits).filter((name) => !SPECIAL_OUTFIT_NAMES.has(name));
}

function getNormalHatNames() {
  return Object.keys(avatarHats).filter((name) => !SPECIAL_HAT_NAMES.has(name));
}

function getSpecialConfigById(id: string | null) {
  return avatarSpecialConfigs.find((config) => config.id === id) ?? null;
}

function getRandomSpecialConfig() {
  if (!avatarSpecialConfigs.length) return null;
  const index = Math.floor(Math.random() * avatarSpecialConfigs.length);
  return avatarSpecialConfigs[index] ?? null;
}

function applyOutfit(root: HTMLElement, outfitName: string) {
  const tiles = avatarOutfits[outfitName] || avatarOutfits.base;

  root.querySelectorAll<SVGUseElement>('.avatar__part--outfit').forEach((use, i) => {
    if (tiles[i]) setUseTarget(use, getSpriteHref(root, tiles[i]));
  });
}

function applyHat(root: HTMLElement, hatName: string) {
  const tiles = avatarHats[hatName] || avatarHats.none;

  root.querySelectorAll<SVGUseElement>('.avatar__part--hat').forEach((use, i) => {
    setUseTarget(use, getSpriteHref(root, tiles[i] || 'hat-empty'));
  });
}

function applyNormalAvatarConfig(root: HTMLElement) {
  const normalOutfits = getNormalOutfitNames();
  const normalHats = getNormalHatNames();

  const storedOutfit = localStorage.getItem(DEFAULT_AVATAR_OUTFIT_KEY) || 'base';
  const outfitName = normalOutfits.includes(storedOutfit) ? storedOutfit : 'base';

  const storedHat = localStorage.getItem(DEFAULT_AVATAR_HAT_KEY) || 'none';
  const hatName = normalHats.includes(storedHat) ? storedHat : 'none';

  localStorage.setItem(DEFAULT_AVATAR_OUTFIT_KEY, outfitName);
  localStorage.setItem(DEFAULT_AVATAR_HAT_KEY, hatName);

  applyOutfit(root, outfitName);
  applyHat(root, hatName);
}

function applySpecialAvatarConfig(root: HTMLElement, config: AvatarSpecialConfig) {
  localStorage.setItem(ACTIVE_SPECIAL_AVATAR_CONFIG_KEY, config.id);
  applyOutfit(root, config.outfit);
  applyHat(root, config.hat);
}

function applyStoredAvatarConfig(root: HTMLElement) {
  if (hasSpecialAvatarUnlock()) {
    const activeSpecialConfig = getSpecialConfigById(localStorage.getItem(ACTIVE_SPECIAL_AVATAR_CONFIG_KEY)) || getRandomSpecialConfig();
    if (activeSpecialConfig) {
      applySpecialAvatarConfig(root, activeSpecialConfig);
      return;
    }
  }

  applyNormalAvatarConfig(root);
}

function initAvatar(root: AvatarRoot) {
  root.__avatarCleanup?.();

  const button = root.querySelector<HTMLButtonElement>('button');
  const leftEye = root.querySelector<SVGUseElement>('.avatar__part--left-eye');
  const rightEye = root.querySelector<SVGUseElement>('.avatar__part--right-eye');
  const mouthLeft = root.querySelector<SVGUseElement>('.avatar__part--mouth-left');
  const mouthRight = root.querySelector<SVGUseElement>('.avatar__part--mouth-right');

  if (!button || !leftEye || !rightEye || !mouthLeft || !mouthRight) return;

  applyStoredAvatarConfig(root);

  const symbolHref = (tileName: string) => getSpriteHref(root, tileName);
  const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;

  let direction: AvatarDirection = 'base';
  let speakingDirection: AvatarDirection = 'base';
  let mouthState: MouthState = 'default';
  let started = false;
  let isBlinking = false;
  let isWinking = false;
  let isSmiling = false;
  let isSpeaking = false;
  let isAvatarHovered = false;
  let hasPointer = false;
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let rafId = 0;
  let startTimer = 0;
  let blinkTimer = 0;
  let blinkFollowupTimer = 0;
  let winkTimer = 0;
  let smileTimer = 0;
  let nextBlinkTimer = 0;
  let pointerIdleTimer = 0;
  let clickLookHoldTimer = 0;
  let forceTrackUntil = 0;
  let clickLookHoldUntil = 0;
  let clickLookThrottleUntil = 0;
  let isPointerDown = false;
  let lastDirectionChangeAt = 0;

  const render = () => {
    const mouthTarget: MouthState = isSmiling ? 'smile' : mouthState;
    setUseTarget(mouthLeft, symbolHref(MOUTH_LEFT_TILES[mouthTarget]));
    setUseTarget(mouthRight, symbolHref(MOUTH_RIGHT_TILES[mouthTarget]));

    const shouldUseInteractiveDirection = hasPointer && (isAvatarHovered || performance.now() < forceTrackUntil);
    const eyeDirection = shouldUseInteractiveDirection ? direction : speakingDirection;

    if (isBlinking) {
      setUseTarget(leftEye, symbolHref(LEFT_EYE_TILES.blink));
      setUseTarget(rightEye, symbolHref(RIGHT_EYE_TILES.blink));
      return;
    }

    if (isWinking) {
      setUseTarget(leftEye, symbolHref(LEFT_EYE_TILES[eyeDirection]));
      setUseTarget(rightEye, symbolHref(RIGHT_EYE_TILES.wink));
      return;
    }

    const target = started ? eyeDirection : 'base';
    setUseTarget(leftEye, symbolHref(LEFT_EYE_TILES[target]));
    setUseTarget(rightEye, symbolHref(RIGHT_EYE_TILES[target]));
  };

  const getBlinkDuration = () => 110 + Math.round(Math.random() * 70);
  const getNextBlinkDelay = (initial = false) => {
    if (initial) {
      return 2600 + Math.round(Math.random() * 1800);
    }

    if (isSpeaking) {
      return 2200 + Math.round(Math.random() * 1900);
    }

    if (isAvatarHovered || hasPointer) {
      return 3000 + Math.round(Math.random() * 2300);
    }

    return 3800 + Math.round(Math.random() * 3200);
  };
  const isClickLookThrottled = () => performance.now() < clickLookThrottleUntil;
  const isClickLookActive = () => performance.now() < clickLookHoldUntil;

  const settleEyes = () => {
    let changed = false;

    if (direction !== 'base') {
      direction = 'base';
      changed = true;
    }

    if (speakingDirection !== 'base') {
      speakingDirection = 'base';
      changed = true;
    }

    if (changed) {
      render();
    }
  };

  const updateDirection = () => {
    rafId = 0;
    if (
      !started ||
      !hasPointer ||
      (!isAvatarHovered && performance.now() >= forceTrackUntil) ||
      isBlinking ||
      isWinking
    ) return;

    const now = performance.now();
    if (now - lastDirectionChangeAt < 90) return;

    const nextDirection = getDirectionFrame(root, pointerX, pointerY, performance.now() < forceTrackUntil);
    if (nextDirection === direction) return;

    direction = nextDirection;
    lastDirectionChangeAt = now;
    render();
  };

  const scheduleDirectionUpdate = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(updateDirection);
  };

  const blinkOnce = (after?: () => void) => {
    if (!started || isBlinking || isWinking) return;
    isBlinking = true;
    render();

    window.clearTimeout(blinkTimer);
    blinkTimer = window.setTimeout(() => {
      isBlinking = false;
      render();
      after?.();
    }, getBlinkDuration());
  };

  const blinkSequence = () => {
    blinkOnce(() => {
      const shouldDoubleBlink = !isWinking && (isSpeaking ? Math.random() < 0.08 : Math.random() < 0.03);
      if (!shouldDoubleBlink) return;

      window.clearTimeout(blinkFollowupTimer);
      blinkFollowupTimer = window.setTimeout(() => {
        blinkOnce();
      }, 90 + Math.round(Math.random() * 120));
    });
  };

  const scheduleNextBlink = (initial = false) => {
    window.clearTimeout(nextBlinkTimer);
    nextBlinkTimer = window.setTimeout(() => {
      blinkSequence();
      scheduleNextBlink();
    }, getNextBlinkDelay(initial));
  };

  const winkOnce = () => {
    window.clearTimeout(blinkTimer);
    window.clearTimeout(blinkFollowupTimer);
    window.clearTimeout(winkTimer);
    isBlinking = false;
    isWinking = true;
    render();

    winkTimer = window.setTimeout(() => {
      isWinking = false;
      render();
    }, 280);
  };

  const smileOnce = () => {
    window.clearTimeout(smileTimer);
    isSmiling = true;
    render();

    smileTimer = window.setTimeout(() => {
      isSmiling = false;
      render();
    }, 900);
  };

  const handleAvatarPointerEnter = (event: PointerEvent) => {
    if (!supportsFinePointer || event.pointerType === 'touch') return;

    isAvatarHovered = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointer = true;
    scheduleDirectionUpdate();
  };

  const handleAvatarPointerMove = (event: PointerEvent) => {
    if (!supportsFinePointer || event.pointerType === 'touch') return;

    isAvatarHovered = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointer = true;
    scheduleDirectionUpdate();
  };

  const handleWindowPointerMove = (event: PointerEvent) => {
    if (!supportsFinePointer || event.pointerType === 'touch') return;
    if (!isPointerDown && !isClickLookActive()) return;

    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointer = true;
    if (isPointerDown) {
      forceTrackUntil = performance.now() + 120;
    }
    scheduleDirectionUpdate();
  };

  const handleAvatarPointerLeave = () => {
    isAvatarHovered = false;
    if (isClickLookActive()) return;
    if (performance.now() >= forceTrackUntil) {
      hasPointer = false;
      settleEyes();
    }
  };

  const activateClickLook = (clientX: number, clientY: number) => {
    const now = performance.now();
    if (isClickLookThrottled()) return false;

    clickLookHoldUntil = now + 2000;
    clickLookThrottleUntil = now + 2400;
    pointerX = clientX;
    pointerY = clientY;
    hasPointer = true;
    forceTrackUntil = Math.max(forceTrackUntil, clickLookHoldUntil);
    scheduleDirectionUpdate();

    window.clearTimeout(clickLookHoldTimer);
    clickLookHoldTimer = window.setTimeout(() => {
      clickLookHoldUntil = 0;
      forceTrackUntil = 0;
      if (isAvatarHovered) {
        scheduleDirectionUpdate();
      } else {
        hasPointer = false;
        settleEyes();
      }
    }, 1000);

    return true;
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!supportsFinePointer || event.pointerType === 'touch') return;

    isPointerDown = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointer = true;
    forceTrackUntil = performance.now() + 900;
    activateClickLook(event.clientX, event.clientY);
    scheduleDirectionUpdate();

    window.clearTimeout(pointerIdleTimer);
    pointerIdleTimer = window.setTimeout(() => {
      if (isPointerDown || isClickLookActive()) return;
      forceTrackUntil = 0;
      hasPointer = false;
      if (!isAvatarHovered) {
        settleEyes();
      }
    }, 900);
  };

  const handlePointerUp = () => {
    isPointerDown = false;

    window.clearTimeout(pointerIdleTimer);
    pointerIdleTimer = window.setTimeout(() => {
      if (isClickLookActive()) return;
      forceTrackUntil = 0;
      hasPointer = false;
      if (!isAvatarHovered) {
        settleEyes();
      }
    }, 900);
  };

  const handlePointerReset = () => {
    hasPointer = false;
    forceTrackUntil = 0;
    clickLookHoldUntil = 0;
    clickLookThrottleUntil = 0;
    isAvatarHovered = false;
    isPointerDown = false;
    window.clearTimeout(pointerIdleTimer);
    window.clearTimeout(clickLookHoldTimer);
    settleEyes();
    render();
  };

  const handleVisibilityChange = () => {
    if (!document.hidden) return;
    handlePointerReset();
  };

  const handleFocus = () => {
    handlePointerReset();
  };

  const handleClick = () => {
    winkOnce();
    smileOnce();
  };

  const handleSetMouth = (event: Event) => {
    const customEvent = event as CustomEvent<{ state?: string }>;
    const nextState = customEvent.detail?.state;
    const nextSpeaking = nextState !== 'default';

    if (nextSpeaking !== isSpeaking) {
      isSpeaking = nextSpeaking;
      if (!isSpeaking) {
        speakingDirection = 'base';
      }
      scheduleNextBlink();
    }

    if (nextState === 'default') {
      mouthState = 'default';
      render();
      return;
    }

    if (!isSpeechMouthState(nextState)) return;

    mouthState = nextState;
    render();
  };

  const handleSetGaze = (event: Event) => {
    const customEvent = event as CustomEvent<{ direction?: string }>;
    const nextDirection = customEvent.detail?.direction;

    speakingDirection = isAvatarDirection(nextDirection) ? nextDirection : 'base';
    render();
  };

  started = true;
  render();

  startTimer = window.setTimeout(() => {
    scheduleNextBlink(true);
  }, 2200);

  button.addEventListener('click', handleClick);
  button.addEventListener('focus', handleFocus);
  button.addEventListener('blur', handlePointerReset);
  button.addEventListener('pointerenter', handleAvatarPointerEnter, { passive: true });
  button.addEventListener('pointermove', handleAvatarPointerMove, { passive: true });
  button.addEventListener('pointerleave', handleAvatarPointerLeave);
  window.addEventListener('pointerdown', handlePointerDown, { passive: true });
  window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
  window.addEventListener('pointerup', handlePointerUp, { passive: true });
  window.addEventListener('pointercancel', handlePointerUp, { passive: true });
  window.addEventListener('blur', handlePointerReset);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  root.addEventListener('avatar:set-mouth', handleSetMouth as EventListener);
  root.addEventListener('avatar:set-gaze', handleSetGaze as EventListener);

  render();

  root.__avatarCleanup = () => {
    button.removeEventListener('click', handleClick);
    button.removeEventListener('focus', handleFocus);
    button.removeEventListener('blur', handlePointerReset);
    button.removeEventListener('pointerenter', handleAvatarPointerEnter);
    button.removeEventListener('pointermove', handleAvatarPointerMove);
    button.removeEventListener('pointerleave', handleAvatarPointerLeave);
    window.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointermove', handleWindowPointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    window.removeEventListener('pointercancel', handlePointerUp);
    window.removeEventListener('blur', handlePointerReset);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    root.removeEventListener('avatar:set-mouth', handleSetMouth as EventListener);
    root.removeEventListener('avatar:set-gaze', handleSetGaze as EventListener);
    window.clearTimeout(startTimer);
    window.clearTimeout(blinkTimer);
    window.clearTimeout(blinkFollowupTimer);
    window.clearTimeout(winkTimer);
    window.clearTimeout(smileTimer);
    window.clearTimeout(nextBlinkTimer);
    window.clearTimeout(pointerIdleTimer);
    window.clearTimeout(clickLookHoldTimer);

    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }
  };
}

function observeAvatar(avatar: AvatarRoot) {
  if (avatar.__avatarObserved) return;
  avatar.__avatarObserved = true;

  if (!('IntersectionObserver' in window)) {
    initAvatar(avatar);
    return;
  }

  avatarObserver ??= new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target as AvatarRoot;

        if (entry.isIntersecting) {
          initAvatar(target);
          return;
        }

        target.__avatarCleanup?.();
        target.__avatarCleanup = undefined;
      });
    },
    {
      rootMargin: '200px 0px',
      threshold: 0.01,
    }
  );

  avatarObserver.observe(avatar);
}

function initAvatars() {
  document.querySelectorAll<AvatarRoot>('.avatar[data-avatar-id]').forEach((avatar) => {
    observeAvatar(avatar);
  });
}

function resetAvatars() {
  avatarObserver?.disconnect();
  avatarObserver = null;
  document.querySelectorAll<AvatarRoot>('.avatar[data-avatar-id]').forEach((avatar) => {
    avatar.__avatarCleanup?.();
    avatar.__avatarCleanup = undefined;
    avatar.__avatarObserved = false;
  });
}

function refreshVisibleAvatars() {
  document.querySelectorAll<AvatarRoot>('.avatar[data-avatar-id]').forEach((avatar) => {
    initAvatar(avatar);
  });
}

function handleThemesUnlocked() {
  try {
    const randomSpecialConfig = getRandomSpecialConfig();
    if (randomSpecialConfig) {
      localStorage.setItem(ACTIVE_SPECIAL_AVATAR_CONFIG_KEY, randomSpecialConfig.id);
    }
  } catch {
    // ignore storage errors
  }

  refreshVisibleAvatars();
}

function handleThemesLocked() {
  try {
    localStorage.removeItem(ACTIVE_SPECIAL_AVATAR_CONFIG_KEY);
  } catch {
    // ignore storage errors
  }

  refreshVisibleAvatars();
}

export function setupAvatars() {
  initAvatars();

  if (lifecycleBound) return;
  lifecycleBound = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAvatars, { once: true });
  }

  document.addEventListener('astro:page-load', initAvatars);
  window.addEventListener('astro:before-preparation', resetAvatars);
  window.addEventListener('themes-unlocked', handleThemesUnlocked as EventListener);
  window.addEventListener('themes-locked', handleThemesLocked as EventListener);
}
