import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import { OG_WIDTH, OUTPUT_DIR } from './config';
import { loadFonts } from './fonts';
import { renderOgSvg } from './template';

export async function generateOgImage(
  title: string,
  description: string,
  slug: string,
): Promise<void> {
  const safeSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';
  const outputPath = path.join(OUTPUT_DIR, `${safeSlug}.png`);
  const fonts = await loadFonts();
  const svg = await renderOgSvg(title, description, safeSlug, fonts);

  const png = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: OG_WIDTH,
    },
  })
    .render()
    .asPng();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, png);
}
