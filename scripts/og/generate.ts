import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

import {
  OG_OUTPUT_DIR,
  OG_WIDTH,
  SOCIAL_IMAGE_EXTENSION,
  SOCIAL_JPEG_QUALITY,
  TWITTER_OUTPUT_DIR,
  TWITTER_WIDTH,
  type SocialVariant,
} from './config';
import { loadFonts } from './fonts';
import { renderSocialSvg } from './template';

const VARIANT_OUTPUT_DIR: Record<SocialVariant, string> = {
  og: OG_OUTPUT_DIR,
  twitter: TWITTER_OUTPUT_DIR,
};

const VARIANT_WIDTH: Record<SocialVariant, number> = {
  og: OG_WIDTH,
  twitter: TWITTER_WIDTH,
};

export async function generateSocialImage(
  title: string,
  description: string,
  slug: string,
  variant: SocialVariant,
): Promise<void> {
  const safeSlug = slug.replace(/^\/+|\/+$/g, '') || 'index';
  const outputDir = VARIANT_OUTPUT_DIR[variant];
  const outputPath = path.join(outputDir, `${safeSlug}.${SOCIAL_IMAGE_EXTENSION}`);
  const legacyPngPath = path.join(outputDir, `${safeSlug}.png`);
  const fonts = await loadFonts();
  const svg = await renderSocialSvg(title, description, safeSlug, fonts, variant);

  const png = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: VARIANT_WIDTH[variant],
    },
  })
    .render()
    .asPng();

  const jpeg = await sharp(png)
    .jpeg({
      quality: SOCIAL_JPEG_QUALITY,
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

export function generateOgImage(title: string, description: string, slug: string) {
  return generateSocialImage(title, description, slug, 'og');
}

export function generateTwitterImage(title: string, description: string, slug: string) {
  return generateSocialImage(title, description, slug, 'twitter');
}
