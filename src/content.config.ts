import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/proyectos' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    cover: image(),
    previewImages: z.array(image()).min(1).max(3),
    year: z.string().min(1),
    order: z.number().optional(),
    tech: z.array(z.string()).optional(),
  }),
});

export const collections = {
  proyectos,
};
