const DEFAULT_SITE_URL = 'https://allison.sh';

function normalizeSiteUrl(value?: string) {
  if (!value) return DEFAULT_SITE_URL;
  return value.replace(/\/$/, '');
}

export const SITE_URL = normalizeSiteUrl(process.env.PUBLIC_SITE_URL || process.env.SITE_URL);
export const SITE_NAME = 'Allison.sh';
export const SITE_AUTHOR = 'Allison Peña';
export const SITE_ROLE = 'Desarrollador web full stack';
export const SITE_LOCALE = 'es_CL';
export const SITE_DESCRIPTION =
  'Diseño y desarrollo interfaces web claras, accesibles y rápidas. Me interesan los sistemas y las decisiones que hacen útil una experiencia.';
export const SOCIAL_IMAGE_EXTENSION = 'jpg';
export const DEFAULT_OG_IMAGE = `/og/index.${SOCIAL_IMAGE_EXTENSION}`;
export const DEFAULT_TWITTER_IMAGE = `/twitter/index.${SOCIAL_IMAGE_EXTENSION}`;
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

export function getOgImagePath(slug: string) {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';
  return `/og/${normalizedSlug}.${SOCIAL_IMAGE_EXTENSION}`;
}

export function getTwitterImagePath(slug: string) {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';
  return `/twitter/${normalizedSlug}.${SOCIAL_IMAGE_EXTENSION}`;
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
