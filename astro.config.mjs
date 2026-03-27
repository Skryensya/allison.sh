// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import rehypeSlug from 'rehype-slug';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
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
    {
      provider: fontProviders.fontshare(),
      name: 'Clash Grotesk',
      cssVariable: '--font-display',
      weights: ['400', '500', '600', '700'],
      styles: ['normal'],
    },
  ],
});
