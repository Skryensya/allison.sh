import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    year: z.string().optional(),
    tech: z.array(z.string()).optional(),
  }),
});

export const collections = {
  proyectos,
};
