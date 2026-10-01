import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { homePath, LOCALE_META, LOCALES, projectPath, type Locale } from '@/i18n';
import { SITE_URL } from '@/lib/seo';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

type Page = Record<Locale, string>;

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL(SITE_URL);
  const abs = (path: string) => escapeXml(new URL(path, base).toString());

  // Slugs are shared across locales, so the Spanish collection drives the list.
  const proyectos = await getCollection('proyectos');
  const pages: Page[] = [
    { es: homePath('es'), en: homePath('en') },
    ...proyectos.map((entry) => ({
      es: `${projectPath(entry.id, 'es')}/`,
      en: `${projectPath(entry.id, 'en')}/`,
    })),
  ];

  // Each URL lists every language version, itself included, as Google expects.
  const urls = pages.flatMap((page) =>
    LOCALES.map((locale) => {
      const alternates = LOCALES.map(
        (alt) => `    <xhtml:link rel="alternate" hreflang="${LOCALE_META[alt].lang}" href="${abs(page[alt])}" />`,
      );
      alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(page.es)}" />`);
      return `  <url>\n    <loc>${abs(page[locale])}</loc>\n${alternates.join('\n')}\n  </url>`;
    }),
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};
