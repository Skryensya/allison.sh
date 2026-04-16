/**
 * Clips de voz por categoría de frase (misma longitud aprox. que short/mid/long).
 */

import voice00Short from '../../assets/voices/00_short.mp3';
import voice01Short from '../../assets/voices/01_short.mp3';
import voice02Short from '../../assets/voices/02_short.mp3';
import voice03Short from '../../assets/voices/03_short.mp3';
import voice04Short from '../../assets/voices/04_short.mp3';
import voice05Mid from '../../assets/voices/05_mid.mp3';
import voice06Mid from '../../assets/voices/06_mid.mp3';
import voice07Mid from '../../assets/voices/07_mid.mp3';
import voice08Mid from '../../assets/voices/08_mid.mp3';
import voice09Mid from '../../assets/voices/09_mid.mp3';
import voice10Long from '../../assets/voices/10_long.mp3';
import voice11Long from '../../assets/voices/11_long.mp3';
import voice12Long from '../../assets/voices/12_long.mp3';
import voice13Long from '../../assets/voices/13_long.mp3';
import voice14Long from '../../assets/voices/14_long.mp3';
import voice15Long from '../../assets/voices/15_long.mp3';

import type { PhraseCategory } from './phrases';

const toClientAssetUrl = (url: string) => new URL(url, import.meta.url).href;

export const VOICES_BY_CATEGORY: Record<PhraseCategory, string[]> = {
  short: [
    toClientAssetUrl(voice00Short),
    toClientAssetUrl(voice01Short),
    toClientAssetUrl(voice02Short),
    toClientAssetUrl(voice03Short),
    toClientAssetUrl(voice04Short),
  ],
  mid: [
    toClientAssetUrl(voice05Mid),
    toClientAssetUrl(voice06Mid),
    toClientAssetUrl(voice07Mid),
    toClientAssetUrl(voice08Mid),
    toClientAssetUrl(voice09Mid),
  ],
  long: [
    toClientAssetUrl(voice10Long),
    toClientAssetUrl(voice11Long),
    toClientAssetUrl(voice12Long),
    toClientAssetUrl(voice13Long),
    toClientAssetUrl(voice14Long),
    toClientAssetUrl(voice15Long),
  ],
};
