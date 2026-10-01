/**
 * i18n core. Spanish is the default locale and lives at the root; English lives under /en.
 * Pure TypeScript (no Astro imports) so the client bundles can use it too.
 */

export const LOCALES = ['es', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'es';

export const LOCALE_META: Record<Locale, { lang: string; ogLocale: string; name: string; short: string }> = {
  es: { lang: 'es', ogLocale: 'es_CL', name: 'Español', short: 'ES' },
  en: { lang: 'en', ogLocale: 'en_US', name: 'English', short: 'EN' },
};

/** localStorage key holding the visitor's language choice (set on first visit and by the switcher). */
export const LANG_STORAGE_KEY = 'allison.sh:lang';

/** URL segment for the projects section, per locale. */
const PROJECTS_SEGMENT: Record<Locale, string> = { es: 'proyectos', en: 'projects' };

/** Content collection holding each locale's projects. */
export const PROJECTS_COLLECTION = { es: 'proyectos', en: 'projects' } as const;

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

export function getLocaleFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'es';
}

export function getLocaleFromUrl(url: URL): Locale {
  return getLocaleFromPath(url.pathname);
}

/** Absolute site path for the home of a locale. */
export function homePath(locale: Locale): string {
  return locale === 'en' ? '/en/' : '/';
}

/** Absolute site path for a project page in a locale. */
export function projectPath(slug: string, locale: Locale): string {
  return `${locale === 'en' ? '/en' : ''}/${PROJECTS_SEGMENT[locale]}/${slug}`;
}

/**
 * Same-page anchor ids are shared by both locales: CSS and scripts target them (#contacto), so only
 * routes are localized, not ids.
 */
const ANCHORS = { projects: 'proyectos', about: 'sobre-mi', contact: 'contacto' } as const;

/** Home path + anchor, e.g. `/en/#proyectos`. */
export function homeAnchor(locale: Locale, key: keyof typeof ANCHORS): string {
  return `${homePath(locale)}#${ANCHORS[key]}`;
}

/**
 * Where the current page lives in another locale. Pages that have no counterpart (404, assets)
 * fall back to the other locale's home.
 */
export function alternatePath(pathname: string, target: Locale): string {
  const source = getLocaleFromPath(pathname);
  if (source === target) return pathname;

  const bare = source === 'en' ? pathname.replace(/^\/en/, '') || '/' : pathname;
  const parts = bare.split('/').filter(Boolean);

  if (parts.length === 0) return homePath(target);

  if (parts[0] === PROJECTS_SEGMENT[source]) {
    const slug = parts[1];
    return slug ? projectPath(slug, target) : homePath(target);
  }

  return homePath(target);
}

export function stripTrailingSlash(path: string): string {
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}
