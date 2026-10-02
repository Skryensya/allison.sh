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
    { text: 'Qué bueno verte por aquí', category: 'short' },
  ],
  special: {
    birthday: [
      { text: '¡Hoy es mi cumpleaños!', category: 'short' },
      { text: 'Se aceptan regalos ;)', category: 'short' },
    ],
    laborDay: [
      { text: '¡Feliz día del trabajador!', category: 'mid' },
      { text: '¿Qué haces trabajando hoy?', category: 'mid' },
    ],
    programmerDay: [
      { text: '¡Feliz día del programador!', category: 'mid' },
      { text: 'Día 256 del año: un byte entero', category: 'long' },
    ],
    christmas: [
      { text: '¡Feliz Navidad!', category: 'short' },
      { text: 'Ojalá el Viejito Pascuero te cumpla', category: 'long' },
    ],
    newYearsEve: [
      { text: '¡Feliz nochevieja!', category: 'short' },
      { text: 'Nos vemos el año que viene', category: 'mid' },
    ],
    newYear: [
      { text: '¡Feliz año nuevo!', category: 'short' },
      { text: 'Aquí el año empieza de verdad en marzo', category: 'mid' },
    ],
  },
  general: [
    { text: 'Ajustando este espaciado. Otra vez.', category: 'mid' },
    { text: 'Diseñar es decidir qué sobra', category: 'mid' },
    { text: 'Un buen detalle no se ve. Uno malo, sí', category: 'long' },
    { text: 'Pocos detalles, bien hechos', category: 'long' },
    { text: 'Lo simple suele ser lo más difícil de hacer', category: 'mid' },
    { text: 'Prototipar es pensar con las manos', category: 'mid' },
    { text: 'Todo se puede iterar una vez más', category: 'mid' },
    { text: 'Si no se entiende, no está terminado', category: 'mid' },
    { text: 'Hago cosas porque me da curiosidad', category: 'mid' },
    { text: 'Mi impresora espera tu mensaje', category: 'mid' },
    { text: 'En mi radio todos oyen lo mismo', category: 'mid' },
    { text: 'Los buenos colores no caducan', category: 'long' },
    { text: 'Hei hei. Eso es "hola" en noruego', category: 'mid' },
    { text: 'El ajedrez me enseñó a perder con calma', category: 'mid' },
    { text: 'Sí, puedes volver a hacerme clic', category: 'short' },
  ],
};

const en: PhraseSet = {
  greetings: [
    { text: "Hi, I'm Allison", category: 'short' },
    { text: 'Good to see you here', category: 'short' },
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
      { text: 'Day 256 of the year: a whole byte', category: 'long' },
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
      { text: 'Here, the year only really starts in March', category: 'mid' },
    ],
  },
  general: [
    { text: 'Adjusting this spacing. Again.', category: 'mid' },
    { text: 'Designing is deciding what to leave out', category: 'mid' },
    { text: 'Good details hide. Bad ones show.', category: 'long' },
    { text: 'A few details, done right', category: 'long' },
    { text: 'Simple is usually the hard part', category: 'mid' },
    { text: 'Prototyping is thinking by hand', category: 'mid' },
    { text: 'Anything can be iterated once more', category: 'mid' },
    { text: "If it isn't clear, it isn't finished", category: 'mid' },
    { text: 'I make things because I get curious', category: 'mid' },
    { text: 'My printer is waiting for your message', category: 'mid' },
    { text: 'My radio plays one song for everyone', category: 'mid' },
    { text: "Good colors don't expire", category: 'long' },
    { text: 'Hei hei. That\'s "hello" in Norwegian', category: 'mid' },
    { text: 'Chess taught me to lose calmly', category: 'mid' },
    { text: 'Yes, you can click me again', category: 'short' },
  ],
};

const sets: Record<Locale, PhraseSet> = { es, en };

/** Picks the set for an `<html lang>` value, falling back to the default locale. */
export function getPhraseSet(lang: string | undefined): PhraseSet {
  return sets[isLocale(lang) ? lang : DEFAULT_LOCALE];
}
