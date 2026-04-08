import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

import { OG_IMAGE_EXTENSION, OG_JPEG_QUALITY, OG_WIDTH, OUTPUT_DIR } from './config';
import { loadFonts } from './fonts';
import { renderOgSvg } from './template';

export async function generateOgImage(
  title: string,
  description: string,
  slug: string,
): Promise<void> {
  const safeSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';
  const outputPath = path.join(OUTPUT_DIR, `${safeSlug}.${OG_IMAGE_EXTENSION}`);
  const legacyPngPath = path.join(OUTPUT_DIR, `${safeSlug}.png`);
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

  const jpeg = await sharp(png)
    .jpeg({
      quality: OG_JPEG_QUALITY,
      mozjpeg: true,
      progressive: true,
      chromaSubsampling: '4:4:4',
    })
    .toBuffer();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await Promise.all([
    writeFile(outputPath, jpeg),
    rm(legacyPngPath, { force: true }),
  ]);
}
