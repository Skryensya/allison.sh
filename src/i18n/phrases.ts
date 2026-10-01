import { isLocale, DEFAULT_LOCALE, type Locale } from './index';

export type PhraseCategory = 'short' | 'mid' | 'long';
export type AvatarPhrase = { text: string; category: PhraseCategory };

type SpecialKey = 'birthday' | 'laborDay' | 'programmerDay' | 'christmas' | 'newYearsEve' | 'newYear';

export interface PhraseSet {
  /** Always first, in this order (clicks 1 and 2 of the visit). */
  greetings: AvatarPhrase[];
  special: Record<SpecialKey, AvatarPhrase[]>;
  /** General bag: shuffled after greetings and the day's specials. */
  general: AvatarPhrase[];
}

const es: PhraseSet = {
  greetings: [
    { text: 'Hola, soy Allison', category: 'short' },
    { text: 'Bienvenido/a a mi web', category: 'short' },
  ],
  special: {
    birthday: [
      { text: '¡Hoy es mi cumpleaños!', category: 'short' },
      { text: 'Se aceptan regalos ;)', category: 'short' },
    ],
    laborDay: [
      { text: '¡Feliz dia del trabajador!', category: 'mid' },
      { text: '¿Que haces trabajando hoy?', category: 'mid' },
    ],
    programmerDay: [
      { text: '¡Feliz día del programador!', category: 'mid' },
      { text: 'Hoy es el dia 256 del año, nada más y nada menos', category: 'long' },
    ],
    christmas: [
      { text: '¡Feliz Navidad!', category: 'short' },
      { text: 'Que el Viejito Pascuero te de algo bueno', category: 'long' },
    ],
    newYearsEve: [
      { text: '¡Feliz nochevieja!', category: 'short' },
      { text: 'Lo vemos el año que vien', category: 'mid' },
    ],
    newYear: [
      { text: '¡Feliz año nuevo!', category: 'short' },
      { text: 'El año empieza de verdad en marzo', category: 'mid' },
    ],
  },
  general: [
    { text: 'Esa reunión pudo ser un email', category: 'mid' },
    { text: 'Si funcionaba en mi máquina™', category: 'mid' },
    { text: 'Llevo rato ajustando este espaciado', category: 'mid' },
    { text: 'Diseñar es decidir qué sobra', category: 'mid' },
    { text: 'Agile es cuando el caos tiene post-its', category: 'long' },
    { text: 'No es deuda técnica, es deuda emocional', category: 'mid' },
  ],
};

const en: PhraseSet = {
  greetings: [
    { text: "Hi, I'm Allison", category: 'short' },
    { text: 'Welcome to my site', category: 'short' },
  ],
  special: {
    birthday: [
      { text: "Today's my birthday!", category: 'short' },
      { text: 'Gifts are welcome ;)', category: 'short' },
    ],
    laborDay: [
      { text: 'Happy Labor Day!', category: 'mid' },
      { text: 'Why are you working today?', category: 'mid' },
    ],
    programmerDay: [
      { text: "Happy Programmers' Day!", category: 'mid' },
      { text: "It's day 256 of the year, no more, no less", category: 'long' },
    ],
    christmas: [
      { text: 'Merry Christmas!', category: 'short' },
      { text: 'May Santa bring you something good', category: 'long' },
    ],
    newYearsEve: [
      { text: "Happy New Year's Eve!", category: 'short' },
      { text: 'See you next year', category: 'mid' },
    ],
    newYear: [
      { text: 'Happy New Year!', category: 'short' },
      { text: 'The year only really starts in March', category: 'mid' },
    ],
  },
  general: [
    { text: 'That meeting could have been an email', category: 'mid' },
    { text: 'It worked on my machine™', category: 'mid' },
    { text: "I've been tweaking this spacing for a while", category: 'mid' },
    { text: 'Designing is deciding what to leave out', category: 'mid' },
    { text: 'Agile is when chaos has sticky notes', category: 'long' },
    { text: "It's not tech debt, it's emotional debt", category: 'mid' },
  ],
};

const sets: Record<Locale, PhraseSet> = { es, en };

/** Picks the set for an `<html lang>` value, falling back to the default locale. */
export function getPhraseSet(lang: string | undefined): PhraseSet {
  return sets[isLocale(lang) ? lang : DEFAULT_LOCALE];
}
