import { getCollection } from 'astro:content';
import { PROJECTS_COLLECTION, type Locale } from '@/i18n';

/**
 * Published projects of a locale, in display order. The entry id is the slug, identical across
 * locales. Entries with `draft: true` are skipped everywhere.
 */
export async function getProjects(locale: Locale) {
  const entries = await getCollection(PROJECTS_COLLECTION[locale], ({ data }) => !data.draft);
  return entries.sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));
}

export const projectAccents: Record<string, string> = {
  'skryensya-ui': 'var(--flexoki-green-400)',
  'agenda-uc': 'var(--flexoki-blue-400)',
  'barrancas': 'var(--flexoki-orange-400)',
  'kit-digital-uc': 'var(--flexoki-purple-400)',
  'nike': 'var(--flexoki-cyan-400)',
  'portal-uc': 'var(--flexoki-green-400)',
  'printer': 'var(--flexoki-yellow-400)',
  'radio': 'var(--flexoki-magenta-400)',
  'wada-ink': 'var(--flexoki-red-400)',
};
