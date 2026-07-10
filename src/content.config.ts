import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/proyectos' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    cover: image().optional(),
    previewImages: z.array(image()).max(3).optional(),
    year: z.string().min(1),
    order: z.number().optional(),
    tech: z.array(z.string()).optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
    employer: z.string().optional(),
  }),
});

export const collections = {
  proyectos,
};
