import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { OG_LOCALES, OG_OUTPUT_DIR, SOCIAL_IMAGE_EXTENSION, TWITTER_OUTPUT_DIR } from './config';
import { getAllOgPages } from './content';
import { generateOgImage, generateTwitterImage } from './generate';

export async function main(): Promise<void> {
  await Promise.all([
    mkdir(OG_OUTPUT_DIR, { recursive: true }),
    mkdir(TWITTER_OUTPUT_DIR, { recursive: true }),
  ]);

  // Spanish (default) lands in /og and /twitter, other locales in /og/<locale> and /twitter/<locale>.
  for (const locale of OG_LOCALES) {
    const folder = locale === 'es' ? '' : `${locale}/`;
    const pages = await getAllOgPages(locale);

    for (const page of pages) {
      await generateOgImage(page.title, page.description, page.slug, locale);
      console.log(`Generated ${path.join('public/og', folder, `${page.slug}.${SOCIAL_IMAGE_EXTENSION}`)}`);

      await generateTwitterImage(page.title, page.description, page.slug, locale);
      console.log(`Generated ${path.join('public/twitter', folder, `${page.slug}.${SOCIAL_IMAGE_EXTENSION}`)}`);
    }
  }
}
