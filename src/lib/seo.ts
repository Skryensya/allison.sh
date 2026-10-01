import { DEFAULT_LOCALE, LOCALE_META, type Locale } from '@/i18n';
import { messages } from '@/i18n/messages';

const DEFAULT_SITE_URL = 'https://allison.sh';

function normalizeSiteUrl(value?: string) {
  if (!value) return DEFAULT_SITE_URL;
  return value.replace(/\/$/, '');
}

export const SITE_URL = normalizeSiteUrl(process.env.PUBLIC_SITE_URL || process.env.SITE_URL);
export const SITE_NAME = 'Allison.sh';
export const SITE_AUTHOR = 'Allison Peña';
export const SITE_ROLE = messages[DEFAULT_LOCALE].site.role;
export const SITE_LOCALE = LOCALE_META[DEFAULT_LOCALE].ogLocale;
export const SITE_DESCRIPTION = messages[DEFAULT_LOCALE].site.description;
export const SOCIAL_IMAGE_EXTENSION = 'jpg';
export const DEFAULT_OG_IMAGE = `/og/index.${SOCIAL_IMAGE_EXTENSION}`;
export const DEFAULT_TWITTER_IMAGE = `/twitter/index.${SOCIAL_IMAGE_EXTENSION}`;

export function getSiteRole(locale: Locale) {
  return messages[locale].site.role;
}

export function getSiteDescription(locale: Locale) {
  return messages[locale].site.description;
}

export function getOgLocale(locale: Locale) {
  return LOCALE_META[locale].ogLocale;
}

/** BCP 47 tag for schema.org `inLanguage`. */
export function getInLanguage(locale: Locale) {
  return LOCALE_META[locale].ogLocale.replace('_', '-');
}
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const TWITTER_IMAGE_WIDTH = 1200;
export const TWITTER_IMAGE_HEIGHT = 600;

export const SOCIAL_PROFILES = [
  'https://linkedin.com/in/skryensya',
  'https://github.com/Skryensya',
];

export function toAbsoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

/** Social images are generated per locale: Spanish at /og/<slug>, English at /og/en/<slug>. */
function socialImagePath(kind: 'og' | 'twitter', slug: string, locale: Locale) {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';
  const prefix = locale === DEFAULT_LOCALE ? '' : `${locale}/`;
  return `/${kind}/${prefix}${normalizedSlug}.${SOCIAL_IMAGE_EXTENSION}`;
}

export function getOgImagePath(slug: string, locale: Locale = DEFAULT_LOCALE) {
  return socialImagePath('og', slug, locale);
}

export function getTwitterImagePath(slug: string, locale: Locale = DEFAULT_LOCALE) {
  return socialImagePath('twitter', slug, locale);
}

export function getSocialImageType(path: string) {
  const normalizedPath = path.toLowerCase();

  if (normalizedPath.endsWith('.jpg') || normalizedPath.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  if (normalizedPath.endsWith('.webp')) {
    return 'image/webp';
  }

  if (normalizedPath.endsWith('.svg')) {
    return 'image/svg+xml';
  }

  return 'image/png';
}
