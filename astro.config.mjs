// @ts-check
import { defineConfig } from 'astro/config';
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
});
