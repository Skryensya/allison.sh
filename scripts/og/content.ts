import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Dirent } from 'node:fs';

import { PROJECTS_DIR, ROOT_DIR, type PageEntry } from './config';
import { parseFrontmatter } from './utils';

export async function getProjectPages(): Promise<PageEntry[]> {
  const entries = await readdir(PROJECTS_DIR, { withFileTypes: true });
  const files = entries.filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.mdx'));

  const pages = await Promise.all(
    files.map(async (file: Dirent) => {
      const filePath = path.join(PROJECTS_DIR, file.name);
      const source = await readFile(filePath, 'utf8');
      const frontmatter = parseFrontmatter(source);
      const title = frontmatter.title;
      const description = frontmatter.description;

      if (!title || !description) {
        throw new Error(`Missing title or description in ${path.relative(ROOT_DIR, filePath)}`);
      }

      return {
        title,
        description,
        slug: path.basename(file.name, path.extname(file.name)),
      } satisfies PageEntry;
    }),
  );

  return pages.sort((a: PageEntry, b: PageEntry) => a.slug.localeCompare(b.slug));
}

export async function getAllOgPages(): Promise<PageEntry[]> {
  return [
    {
      title: 'Allison Peña',
      description:
        'Diseño y desarrollo interfaces web claras, accesibles y rápidas. Me interesan los sistemas y las decisiones que hacen útil una experiencia.',
      slug: 'index',
    },
    ...(await getProjectPages()),
  ];
}
