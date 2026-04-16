/**
 * Outfit / sombrero del avatar y persistencia en localStorage (incl. temas especiales).
 */

import { avatarHats, avatarOutfits, avatarSpecialConfigs } from '@/data/avatarSprite';
import { getSpriteHref, setUseTarget } from './sprite';

export const SPECIAL_AVATAR_UNLOCK_KEY = 'special-themes-visible';
export const DEFAULT_AVATAR_OUTFIT_KEY = 'avatar-outfit';
export const DEFAULT_AVATAR_HAT_KEY = 'avatar-hat';
export const ACTIVE_SPECIAL_AVATAR_CONFIG_KEY = 'avatar-special-config';

const SPECIAL_OUTFIT_NAMES = new Set<string>(avatarSpecialConfigs.map((config) => config.outfit));
const SPECIAL_HAT_NAMES = new Set<string>(avatarSpecialConfigs.map((config) => config.hat));

export type AvatarSpecialConfig = (typeof avatarSpecialConfigs)[number];

export function hasSpecialAvatarUnlock() {
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

export function getSpecialConfigById(id: string | null) {
  return avatarSpecialConfigs.find((config) => config.id === id) ?? null;
}

export function getRandomSpecialConfig() {
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

export function applyStoredAvatarConfig(root: HTMLElement) {
  if (hasSpecialAvatarUnlock()) {
    const activeSpecialConfig =
      getSpecialConfigById(localStorage.getItem(ACTIVE_SPECIAL_AVATAR_CONFIG_KEY)) || getRandomSpecialConfig();
    if (activeSpecialConfig) {
      applySpecialAvatarConfig(root, activeSpecialConfig);
      return;
    }
  }

  applyNormalAvatarConfig(root);
}
