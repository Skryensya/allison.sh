import { defineCollection } from 'astro:content';
import type { SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'zod';

const projectSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    description: z.string(),
    cover: image().optional(),
    previewImages: z.array(image()).max(3).optional(),
    year: z.string().min(1),
    order: z.number().optional(),
    tech: z.array(z.string()).optional(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
    employer: z.string().optional(),
  });

// One collection per locale, same slugs in both: Spanish in `proyectos`, English in `projects`.
const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/proyectos' }),
  schema: projectSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: projectSchema,
});

export const collections = {
  proyectos,
  projects,
};
