import { mkdir } from 'node:fs/promises';

import { OUTPUT_DIR } from './config';
import { getAllOgPages } from './content';
import { generateOgImage } from './generate';

export async function main(): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });

  const pages = await getAllOgPages();

  for (const page of pages) {
    await generateOgImage(page.title, page.description, page.slug);
    console.log(`Generated public/og/${page.slug}.png`);
  }
}
