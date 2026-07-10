import { mkdir } from 'node:fs/promises';

import { OG_OUTPUT_DIR, SOCIAL_IMAGE_EXTENSION, TWITTER_OUTPUT_DIR } from './config';
import { getAllOgPages } from './content';
import { generateOgImage, generateTwitterImage } from './generate';

export async function main(): Promise<void> {
  await Promise.all([
    mkdir(OG_OUTPUT_DIR, { recursive: true }),
    mkdir(TWITTER_OUTPUT_DIR, { recursive: true }),
  ]);

  const pages = await getAllOgPages();

  for (const page of pages) {
    await generateOgImage(page.title, page.description, page.slug);
    console.log(`Generated public/og/${page.slug}.${SOCIAL_IMAGE_EXTENSION}`);

    await generateTwitterImage(page.title, page.description, page.slug);
    console.log(`Generated public/twitter/${page.slug}.${SOCIAL_IMAGE_EXTENSION}`);
  }
}
