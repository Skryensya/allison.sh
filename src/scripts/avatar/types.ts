import type { SpeechBubble } from '../speech-bubble';

/** Dynamic import shape for the speech bubble chunk (code-split). */
export type SpeechBubbleModule = typeof import('../speech-bubble');

export type AvatarRoot = HTMLElement & {
  __avatarCleanup?: () => void;
  __avatarObserved?: boolean;
  __avatarSpeechBubble?: SpeechBubble | null;
  __avatarVoiceAudio?: HTMLAudioElement | null;
  __avatarVoiceFadeRaf?: number;
  __avatarVoiceEndDelayTimer?: number;
  __avatarVoiceUrl?: string | null;
  __avatarPartCache?: {
    outfitUses: SVGUseElement[];
    hatUses: SVGUseElement[];
  };
};
