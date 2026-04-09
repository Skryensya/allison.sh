// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import mdx from '@astrojs/mdx';

// https://astro.build/config
const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://dev.allison.sh').replace(/\/$/, '');

export default defineConfig({
  site: siteUrl,
  compressHTML: true,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  },
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
  integrations: [mdx()],
  fonts: [
    // Clash Grotesk for headings/display
    {
      provider: fontProviders.local(),
      name: 'Clash Grotesk',
      cssVariable: '--font-display',
      options: {
        variants: [
          { src: ['./src/assets/fonts/clash-grotesk-400.woff2'], weight: '400' },
        ],
      },
    },
    // Satoshi for body text
    {
      provider: fontProviders.local(),
      name: 'Satoshi',
      cssVariable: '--font-sans',
      options: {
        variants: [
          { src: ['./src/assets/fonts/satoshi-400.woff2'], weight: '400' },
          { src: ['./src/assets/fonts/satoshi-500.woff2'], weight: '500' },
        ],
      },
    },
    // IBM Plex Mono for code
    {
      provider: fontProviders.local(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      options: {
        variants: [
          { src: ['./src/assets/fonts/ibm-plex-mono-400.woff2'], weight: '400' },
        ],
      },
    },
  ],
});
