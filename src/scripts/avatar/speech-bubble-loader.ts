/**
 * Carga perezosa del chunk del speech bubble (code-split con el cliente del avatar).
 */

import type { SpeechBubbleModule } from './types';

let speechBubbleModulePromise: Promise<SpeechBubbleModule> | null = null;

/** Constructor una vez resuelto el import dinámico; null hasta la primera carga. */
export let speechBubbleCtor: SpeechBubbleModule['SpeechBubble'] | null = null;

export function loadSpeechBubbleModule() {
  speechBubbleModulePromise ??= import('../speech-bubble').then((module) => {
    speechBubbleCtor = module.SpeechBubble;
    return module;
  });

  return speechBubbleModulePromise;
}
