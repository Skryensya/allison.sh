// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

// https://astro.build/config
const siteUrl = (process.env.PUBLIC_SITE_URL || process.env.SITE_URL || 'https://allison.sh').replace(/\/$/, '');

export default defineConfig({
  site: siteUrl,
  compressHTML: true,
  devToolbar: {
    enabled: false,
  },
  // Spanish is the default locale and lives at the root; English lives under /en.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  redirects: {
    '/proyectos': '/#proyectos',
    '/en/projects': '/en/#proyectos',
  },
  vite: {
    plugins: [tailwindcss()],
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
    },
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    build: {
      minify: 'terser',
      terserOptions: /** @type {import('terser').MinifyOptions} */ ({
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      }),
    },
  },
  markdown: {
    rehypePlugins: [rehypeSlug],
  },
  integrations: [mdx(), react()],
});
