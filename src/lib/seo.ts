export const SITE_URL = 'https://allison.sh';
export const SITE_NAME = 'Allison.sh';
export const SITE_AUTHOR = 'Allison Peña';
export const SITE_ROLE = 'Desarrollador web full stack';
export const SITE_DESCRIPTION =
  'Soy Allison Peña, desarrollador web full stack. Me interesa construir interfaces claras, accesibles y rápidas, donde la tecnología importa menos que lo que permite hacer.';
export const DEFAULT_OG_IMAGE = '/og/index.png';

export const SOCIAL_PROFILES = [
  'https://linkedin.com/in/skryensya',
  'https://github.com/Skryensya',
];

export function toAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
