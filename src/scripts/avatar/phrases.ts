/**
 * Copy del avatar: cola por visita (saludos, fechas especiales, bolsa general).
 */

export type PhraseCategory = 'short' | 'mid' | 'long';

export type AvatarPhrase = { text: string; category: PhraseCategory };

/** Siempre primero, en este orden (clics 1 y 2 de la visita). */
export const GREETING_PHRASES: AvatarPhrase[] = [
  { text: 'Hola, soy Allison', category: 'short' },
  { text: 'Bienvenido/a a mi web', category: 'short' },
];

export const SPECIAL_PHRASES = {
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

/** Bolsa general: orden aleatorio tras saludos y especiales; excluir duplicados con especiales del día. */
export const GENERAL_PHRASES: AvatarPhrase[] = [
  { text: 'Esa reunión pudo ser un email', category: 'mid' },
  { text: '"Si funcionaba en mi máquina™"', category: 'mid' },
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

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}

/** Una visita = 2 saludos + 0–2 especiales + hasta 6 generales (sin choque de texto con especiales). */
export function buildVisitPhraseQueue(now: Date = new Date()): AvatarPhrase[] {
  const specials = getSpecialPhrasesForLocalDate(now);
  const specialTexts = new Set(specials.map((p) => p.text));
  const generals = GENERAL_PHRASES.filter((p) => !specialTexts.has(p.text));
  shuffleInPlace(generals);
  return [...GREETING_PHRASES, ...specials, ...generals];
}
