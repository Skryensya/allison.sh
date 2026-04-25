import { avatarHats, avatarOutfits, avatarSpecialConfigs } from '@/data/avatarSprite';
import { setUseTarget } from './avatar/sprite';
import { loadVoicesModule } from './avatar/voice-loader';
import { playMouthSfx, playSpeechPresenceBlip, resumeAvatarSfxContext } from './avatar-speech-sfx';

type PhraseCategory = 'short' | 'mid' | 'long';

type AvatarPhrase = { text: string; category: PhraseCategory };

/** Siempre primero, en este orden (clics 1 y 2 de la visita). */
const GREETING_PHRASES: AvatarPhrase[] = [
  { text: 'Hola, soy Allison', category: 'short' },
  { text: 'Bienvenido/a a mi web', category: 'short' },
];

const SPECIAL_PHRASES = {
  birthday: [
    { text: '¡Hoy es mi cumpleaños!', category: 'short' as const },
    { text: 'Se aceptan regalos ;)', category: 'short' as const },
  ],
  laborDay: [
    { text: '¡Feliz dia del trabajador!', category: 'mid' as const },
    { text: '¿Que haces trabajando hoy?', category: 'mid' as const },
  ],
  programmerDay: [
    { text: '¡Feliz día del programador!', category: 'mid' as const },
    { text: 'Hoy es el dia 256 del año, nada más y nada menos', category: 'long' as const },
  ],
  christmas: [
    { text: '¡Feliz Navidad!', category: 'short' as const },
    { text: 'Que el Viejito Pascuero te de algo bueno', category: 'long' as const },
  ],
  newYearsEve: [
    { text: '¡Feliz nochevieja!', category: 'short' as const },
    { text: 'Lo vemos el año que vien', category: 'mid' as const },
  ],
  newYear: [
    { text: '¡Feliz año nuevo!', category: 'short' as const },
    { text: 'El año empieza de verdad en marzo', category: 'mid' as const },
  ],
} satisfies Record<string, AvatarPhrase[]>;

/** Bolsa general: orden aleatorio tras los saludos y las del día; excluir textos que choquen con especiales del día. */
const GENERAL_PHRASES: AvatarPhrase[] = [
  { text: 'Esa reunión pudo ser un email', category: 'mid' },
  { text: 'Si funcionaba en mi máquina™', category: 'mid' },
  { text: 'Llevo rato ajustando este espaciado', category: 'mid' },
  { text: 'Diseñar es decidir qué sobra', category: 'mid' },
  { text: 'Agile es cuando el caos tiene post-its', category: 'long' },
  { text: 'No es deuda técnica, es deuda emocional', category: 'mid' },
];

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Día 256 del año: 12-sep en bisiesto, 13-sep si no (fecha local). */
function getProgrammerDayOfMonth(year: number): number {
  return isLeapYear(year) ? 12 : 13;
}

function getSpecialPhrasesForLocalDate(date: Date): AvatarPhrase[] {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (month === 8 && day === 20) return [...SPECIAL_PHRASES.birthday];
  if (month === 5 && day === 1) return [...SPECIAL_PHRASES.laborDay];
  if (month === 9 && day === getProgrammerDayOfMonth(year)) return [...SPECIAL_PHRASES.programmerDay];
  if (month === 12 && day === 25) return [...SPECIAL_PHRASES.christmas];
  if (month === 12 && day === 31) return [...SPECIAL_PHRASES.newYearsEve];
  if (month === 1 && day === 1) return [...SPECIAL_PHRASES.newYear];

  return [];
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

/** Intro de una sola vez: saludos + especiales del día. */
function buildIntroPhraseQueue(now: Date = new Date()): AvatarPhrase[] {
  const specials = getSpecialPhrasesForLocalDate(now);
  return [...GREETING_PHRASES, ...specials];
}

/** Loop: solo frases generales, excluyendo duplicados con especiales del día. */
function buildLoopPhraseQueue(now: Date = new Date()): AvatarPhrase[] {
  const specials = getSpecialPhrasesForLocalDate(now);
  const specialTexts = new Set(specials.map((p) => p.text));
  const generals = GENERAL_PHRASES.filter((p) => !specialTexts.has(p.text));
  shuffleInPlace(generals);
  return generals;
}

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

type SpeechBubbleModule = typeof import('./speech-bubble');

type AvatarRoot = HTMLElement & {
  __avatarCleanup?: () => void;
  __avatarObserved?: boolean;
  __avatarSpeechBubble?: InstanceType<SpeechBubbleModule['SpeechBubble']> | null;
  __avatarVoiceAudio?: HTMLAudioElement | null;
  __avatarVoiceFadeRaf?: number;
  __avatarVoiceEndDelayTimer?: number;
  __avatarVoiceUrl?: string | null;
  __avatarPartCache?: {
    outfitUses: SVGUseElement[];
    hatUses: SVGUseElement[];
  };
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

/** Voice clips never play above 50% — fixed ceiling, not user-adjustable in code. */
const AVATAR_VOICE_VOLUME = 0.5;

let avatarObserver: IntersectionObserver | null = null;
let lifecycleBound = false;
let speechBubbleModulePromise: Promise<SpeechBubbleModule> | null = null;
let speechBubbleCtor: SpeechBubbleModule['SpeechBubble'] | null = null;

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

function getAvatarPartCache(root: HTMLElement) {
  const cached = (root as HTMLElement & {
    __avatarPartCache?: {
      outfitUses: SVGUseElement[];
      hatUses: SVGUseElement[];
    };
  }).__avatarPartCache;

  if (cached) return cached;

  const nextCache = {
    outfitUses: Array.from(root.querySelectorAll<SVGUseElement>('.avatar__part--outfit')),
    hatUses: Array.from(root.querySelectorAll<SVGUseElement>('.avatar__part--hat')),
  };

  (root as HTMLElement & {
    __avatarPartCache?: {
      outfitUses: SVGUseElement[];
      hatUses: SVGUseElement[];
    };
  }).__avatarPartCache = nextCache;

  return nextCache;
}

function applyOutfit(root: HTMLElement, outfitName: string) {
  const tiles = avatarOutfits[outfitName] || avatarOutfits.base;
  const { outfitUses } = getAvatarPartCache(root);

  outfitUses.forEach((use, i) => {
    if (tiles[i]) setUseTarget(use, getSpriteHref(root, tiles[i]));
  });
}

function applyHat(root: HTMLElement, hatName: string) {
  const tiles = avatarHats[hatName] || avatarHats.none;
  const { hatUses } = getAvatarPartCache(root);

  hatUses.forEach((use, i) => {
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

function loadSpeechBubbleModule() {
  speechBubbleModulePromise ??= import('./speech-bubble').then((module) => {
    speechBubbleCtor = module.SpeechBubble;
    return module;
  });

  return speechBubbleModulePromise;
}

function initAvatar(root: AvatarRoot) {
  root.__avatarCleanup?.();

  const button = root.querySelector<HTMLButtonElement>('button');
  const leftEye = root.querySelector<SVGUseElement>('.avatar__part--left-eye');
  const rightEye = root.querySelector<SVGUseElement>('.avatar__part--right-eye');
  const mouthLeft = root.querySelector<SVGUseElement>('.avatar__part--mouth-left');
  const mouthRight = root.querySelector<SVGUseElement>('.avatar__part--mouth-right');

  if (!button || !leftEye || !rightEye || !mouthLeft || !mouthRight) return;

  const pickRandom = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

  let introPhraseQueue: AvatarPhrase[] | null = null;
  let introPhraseIndex = 0;
  let loopPhraseQueue: AvatarPhrase[] | null = null;
  let loopPhraseIndex = 0;
  let lastPhraseCameFromLoop = false;
  let justFinishedLoopCycle = false;

  const resetAvatarPhrases = () => {
    introPhraseQueue = buildIntroPhraseQueue();
    introPhraseIndex = 0;
    loopPhraseQueue = buildLoopPhraseQueue();
    loopPhraseIndex = 0;
    lastPhraseCameFromLoop = false;
    justFinishedLoopCycle = false;
  };

  const ensureLoopPhraseQueue = () => {
    if (!loopPhraseQueue || loopPhraseQueue.length === 0) {
      loopPhraseQueue = buildLoopPhraseQueue();
      loopPhraseIndex = 0;
    }
  };

  const peekNextAvatarPhrase = (): AvatarPhrase | null => {
    if (!introPhraseQueue || !loopPhraseQueue) resetAvatarPhrases();

    if (introPhraseQueue && introPhraseIndex < introPhraseQueue.length) {
      lastPhraseCameFromLoop = false;
      justFinishedLoopCycle = false;
      return introPhraseQueue[introPhraseIndex] ?? null;
    }

    ensureLoopPhraseQueue();
    if (!loopPhraseQueue || loopPhraseQueue.length === 0) return null;

    lastPhraseCameFromLoop = true;
    justFinishedLoopCycle = loopPhraseIndex === loopPhraseQueue.length - 1;
    return loopPhraseQueue[loopPhraseIndex] ?? null;
  };

  const advanceAvatarPhraseQueue = () => {
    if (!lastPhraseCameFromLoop) {
      introPhraseIndex += 1;
      return;
    }

    ensureLoopPhraseQueue();
    if (!loopPhraseQueue || loopPhraseQueue.length === 0) return;

    loopPhraseIndex += 1;
    if (loopPhraseIndex >= loopPhraseQueue.length) {
      loopPhraseQueue = buildLoopPhraseQueue();
      loopPhraseIndex = 0;
    }
  };

  /** Tras ocultar el bubble (o cerrar con skip), margen antes del siguiente clic — alineado al ciclo del bubble. */
  const MIN_MS_BETWEEN_PHRASES = 100;
  /** Guiño un poco después de la sonrisa. */
  const SMILE_TO_WINK_MS = 300;
  /** Sonrisa: boca + ojos al frente, sin seguir el mouse. */
  const SMILE_DURATION_MS = 2000;

  let nextAvatarSpeakAllowedAt = 0;
  let smileThenWinkTimer = 0;

  resetAvatarPhrases();

  const VOICE_TAIL_AFTER_TYPING_MS = 250;

  const cancelVoiceFade = () => {
    if (root.__avatarVoiceFadeRaf) {
      cancelAnimationFrame(root.__avatarVoiceFadeRaf);
      root.__avatarVoiceFadeRaf = 0;
    }
  };

  const cancelVoiceEndDelay = () => {
    if (root.__avatarVoiceEndDelayTimer) {
      window.clearTimeout(root.__avatarVoiceEndDelayTimer);
      root.__avatarVoiceEndDelayTimer = 0;
    }
  };

  const stopVoice = () => {
    cancelVoiceFade();
    cancelVoiceEndDelay();

    if (!root.__avatarVoiceAudio) {
      root.__avatarVoiceUrl = null;
      return;
    }

    root.__avatarVoiceAudio.pause();
    root.__avatarVoiceAudio.currentTime = 0;
    root.__avatarVoiceAudio.volume = AVATAR_VOICE_VOLUME;
    root.__avatarVoiceAudio = null;
    root.__avatarVoiceUrl = null;
  };

  const getVoiceAudio = (voiceUrl: string) => {
    if (root.__avatarVoiceAudio && root.__avatarVoiceUrl === voiceUrl) {
      return root.__avatarVoiceAudio;
    }

    stopVoice();
    const audio = new Audio(voiceUrl);
    audio.preload = 'auto';
    audio.volume = AVATAR_VOICE_VOLUME;
    root.__avatarVoiceAudio = audio;
    root.__avatarVoiceUrl = voiceUrl;
    return audio;
  };

  /** Quick linear fade to silence, then teardown (feels less abrupt than a hard stop). */
  const fadeOutVoice = (durationMs = 130) => {
    cancelVoiceFade();
    const audio = root.__avatarVoiceAudio;
    if (!audio) return;

    const startVol = Math.min(AVATAR_VOICE_VOLUME, audio.volume);
    const t0 = performance.now();

    const step = () => {
      const a = root.__avatarVoiceAudio;
      if (!a) {
        root.__avatarVoiceFadeRaf = 0;
        return;
      }

      const elapsed = performance.now() - t0;
      const u = Math.min(1, elapsed / durationMs);
      a.volume = Math.max(0, startVol * (1 - u));

      if (u < 1) {
        root.__avatarVoiceFadeRaf = requestAnimationFrame(step);
      } else {
        root.__avatarVoiceFadeRaf = 0;
        a.pause();
        a.currentTime = 0;
        a.volume = AVATAR_VOICE_VOLUME;
        root.__avatarVoiceAudio = null;
        root.__avatarVoiceUrl = null;
      }
    };

    root.__avatarVoiceFadeRaf = requestAnimationFrame(step);
  };

  const playVoice = (voiceUrl: string) => {
    const audio = getVoiceAudio(voiceUrl);
    cancelVoiceFade();
    audio.currentTime = 0;
    audio.muted = false;
    audio.volume = AVATAR_VOICE_VOLUME;

    void audio.play().catch(() => {
      // ignore play edge cases
    });
  };

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
  let globalListenersBound = false;

  const render = () => {
    /* Durante el speech, la boca sigue los fonemas; la sonrisa solo en la celebración (cola agotada). */
    const mouthTarget: MouthState = isSpeaking ? mouthState : isSmiling ? 'smile' : mouthState;
    setUseTarget(mouthLeft, symbolHref(MOUTH_LEFT_TILES[mouthTarget]));
    setUseTarget(mouthRight, symbolHref(MOUTH_RIGHT_TILES[mouthTarget]));

    // During speech or smile, do NOT track the pointer (forward gaze).
    const shouldUseInteractiveDirection =
      !isSpeaking &&
      !isSmiling &&
      hasPointer &&
      (isAvatarHovered || performance.now() < forceTrackUntil);
    const eyeDirection = shouldUseInteractiveDirection ? direction : speakingDirection;

    if (isBlinking) {
      setUseTarget(leftEye, symbolHref(LEFT_EYE_TILES.blink));
      setUseTarget(rightEye, symbolHref(RIGHT_EYE_TILES.blink));
      return;
    }

    if (isWinking) {
      /* Wink reads as a forward look; keep both eyes neutral / center. */
      setUseTarget(leftEye, symbolHref(LEFT_EYE_TILES.base));
      setUseTarget(rightEye, symbolHref(RIGHT_EYE_TILES.wink));
      return;
    }

    const target = started ? eyeDirection : 'base';
    setUseTarget(leftEye, symbolHref(LEFT_EYE_TILES[target]));
    setUseTarget(rightEye, symbolHref(RIGHT_EYE_TILES[target]));
  };

  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
  const expSample = (mean: number) => -Math.log(1 - Math.random()) * mean;

  const getBlinkDuration = () => {
    // Typical blink is ~90-150ms, with rare slightly longer blinks.
    const base = 90 + Math.round(Math.random() * 60);
    const extra = Math.random() < 0.05 ? 60 + Math.round(Math.random() * 80) : 0;
    return base + extra;
  };

  const getNextBlinkDelay = (initial = false) => {
    // Use an exponential-ish distribution (human-like: mostly average, sometimes long gaps)
    // instead of a flat uniform random.
    if (initial) {
      // First blink: allow it relatively soon so users catch it early.
      // (Still not immediate; we want it to feel incidental.)
      return clamp(550 + expSample(750), 550, 2400);
    }

    // After the first blink, keep the cadence sparse.
    // Speaking: slightly more engaged, but still not "busy".
    if (isSpeaking) {
      return clamp(2600 + expSample(2400), 2600, 9000);
    }

    // Hover/focus: people blink less when visually engaged
    if (isAvatarHovered || hasPointer) {
      return clamp(5000 + expSample(3600), 5000, 16000);
    }

    // Idle: sparse, occasional blinks
    return clamp(3200 + expSample(3000), 3200, 14000);
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
      isSpeaking ||
      isSmiling ||
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
      const shouldDoubleBlink = !isWinking && (isSpeaking ? Math.random() < 0.06 : Math.random() < 0.025);
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
    direction = 'base';
    speakingDirection = 'base';
    isSmiling = true;
    render();

    smileTimer = window.setTimeout(() => {
      isSmiling = false;
      render();
    }, SMILE_DURATION_MS);
  };

  const celebrateAvatarClick = () => {
    direction = 'base';
    speakingDirection = 'base';
    smileOnce();
    window.clearTimeout(smileThenWinkTimer);
    smileThenWinkTimer = window.setTimeout(() => {
      smileThenWinkTimer = 0;
      winkOnce();
    }, SMILE_TO_WINK_MS);
  };

  const runAvatarSpeak = async () => {
    let SpeechBubble = speechBubbleCtor;
    if (!SpeechBubble) {
      const module = await loadSpeechBubbleModule();
      SpeechBubble = module.SpeechBubble;
    }

    const now = performance.now();
    if (now < nextAvatarSpeakAllowedAt) return;

    const currentBubble = root.__avatarSpeechBubble;
    if (currentBubble?.isActive()) {
      if (!currentBubble.skipReadingPause()) return;
    }

    const phrase = peekNextAvatarPhrase();
    if (!phrase) {
      if (root.__avatarSpeechBubble?.isActive()) return;
      nextAvatarSpeakAllowedAt = now + MIN_MS_BETWEEN_PHRASES;
      return;
    }

    advanceAvatarPhraseQueue();
    const { VOICES_BY_CATEGORY } = await loadVoicesModule();
    const voiceOptions = VOICES_BY_CATEGORY[phrase.category];
    const voiceUrl = voiceOptions.length ? pickRandom(voiceOptions) : null;

    stopVoice();
    root.__avatarSpeechBubble?.destroy();

    resumeAvatarSfxContext();

    // Start voice on the same user gesture, before bubble layout — avoids a late start after renderPhraseLayout.
    if (voiceUrl) {
      playVoice(voiceUrl);
    }

    const bubble = new SpeechBubble({
      charSpeed: 35,
      /* Tras terminar de escribir: breve pausa antes del auto-hide; un clic también salta esta espera. */
      displayDuration: 450,
      phrases: [phrase.text],
      onTypingStart: () => {
        if (!voiceUrl) {
          playSpeechPresenceBlip();
        }
      },
      onTypingEnd: () => {
        if (!voiceUrl) return;
        cancelVoiceEndDelay();
        root.__avatarVoiceEndDelayTimer = window.setTimeout(() => {
          root.__avatarVoiceEndDelayTimer = 0;
          fadeOutVoice(130);
        }, VOICE_TAIL_AFTER_TYPING_MS);
      },
      onMouthShape: (shape) => {
        if (voiceUrl) return;
        playMouthSfx(shape);
      },
      onAfterHide: () => {
        if (lastPhraseCameFromLoop && justFinishedLoopCycle) {
          celebrateAvatarClick();
        }
        nextAvatarSpeakAllowedAt = performance.now() + MIN_MS_BETWEEN_PHRASES;
      },
    });

    root.__avatarSpeechBubble = bubble;
    bubble.next(root, root);
  };

  const handleAvatarSpeak = () => {
    startInteractions();
    void runAvatarSpeak();
  };

  const handleAvatarPointerEnter = (event: PointerEvent) => {
    if (!supportsFinePointer || event.pointerType === 'touch') return;

    startInteractions();
    isAvatarHovered = true;
    pointerX = event.clientX;
    pointerY = event.clientY;
    hasPointer = true;
    void loadSpeechBubbleModule();
    scheduleDirectionUpdate();
  };

  const handleAvatarPointerMove = (event: PointerEvent) => {
    if (!supportsFinePointer || event.pointerType === 'touch') return;

    startInteractions();
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
    stopVoice();
  };

  const handlePageHide = () => {
    stopVoice();
  };

  const handleFocus = () => {
    startInteractions();
    handlePointerReset();
  };



  const handleSetMouth = (event: Event) => {
    const customEvent = event as CustomEvent<{ state?: string }>;
    const nextState = customEvent.detail?.state;
    const nextSpeaking = nextState !== 'default';

    if (nextSpeaking !== isSpeaking) {
      isSpeaking = nextSpeaking;
      // While speaking we want a neutral forward gaze.
      speakingDirection = 'base';
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

  const bindGlobalListeners = () => {
    if (globalListenersBound) return;
    globalListenersBound = true;
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handleWindowPointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });
    window.addEventListener('blur', handlePointerReset);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    root.addEventListener('avatar:set-mouth', handleSetMouth as EventListener);
    root.addEventListener('avatar:set-gaze', handleSetGaze as EventListener);
  };

  const startInteractions = () => {
    if (started) return;
    started = true;
    bindGlobalListeners();
    render();
    startTimer = window.setTimeout(() => {
      scheduleNextBlink(true);
    }, 450);
  };

  button.addEventListener('click', handleAvatarSpeak);
  button.addEventListener('focus', handleFocus);
  button.addEventListener('blur', handlePointerReset);
  button.addEventListener('pointerenter', handleAvatarPointerEnter, { passive: true });
  button.addEventListener('pointermove', handleAvatarPointerMove, { passive: true });
  button.addEventListener('pointerleave', handleAvatarPointerLeave);

  render();

  root.__avatarCleanup = () => {
    button.removeEventListener('click', handleAvatarSpeak);
    button.removeEventListener('focus', handleFocus);
    button.removeEventListener('blur', handlePointerReset);
    button.removeEventListener('pointerenter', handleAvatarPointerEnter);
    button.removeEventListener('pointermove', handleAvatarPointerMove);
    button.removeEventListener('pointerleave', handleAvatarPointerLeave);
    if (globalListenersBound) {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', handlePointerReset);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      root.removeEventListener('avatar:set-mouth', handleSetMouth as EventListener);
      root.removeEventListener('avatar:set-gaze', handleSetGaze as EventListener);
      globalListenersBound = false;
    }
    window.clearTimeout(startTimer);
    window.clearTimeout(blinkTimer);
    window.clearTimeout(blinkFollowupTimer);
    window.clearTimeout(winkTimer);
    window.clearTimeout(smileTimer);
    window.clearTimeout(smileThenWinkTimer);
    window.clearTimeout(nextBlinkTimer);
    window.clearTimeout(pointerIdleTimer);
    window.clearTimeout(clickLookHoldTimer);

    if (rafId) {
      window.cancelAnimationFrame(rafId);
    }

    stopVoice();
    root.__avatarSpeechBubble?.destroy();
    root.__avatarSpeechBubble = null;
  };
}

function observeAvatar(avatar: AvatarRoot) {
  if (avatar.__avatarObserved) return;
  avatar.__avatarObserved = true;
  initAvatar(avatar);
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
    avatar.__avatarPartCache = undefined;
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
