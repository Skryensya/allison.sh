import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Dirent } from 'node:fs';

import { messages } from '../../src/i18n/messages';
import { PROJECTS_DIRS, ROOT_DIR, type OgLocale, type PageEntry } from './config';
import { parseFrontmatter } from './utils';

export async function getProjectPages(locale: OgLocale): Promise<PageEntry[]> {
  const projectsDir = PROJECTS_DIRS[locale];
  const entries = await readdir(projectsDir, { withFileTypes: true });
  const files = entries.filter((entry: Dirent) => entry.isFile() && entry.name.endsWith('.mdx'));

  const pages = await Promise.all(
    files.map(async (file: Dirent) => {
      const filePath = path.join(projectsDir, file.name);
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

export async function getAllOgPages(locale: OgLocale): Promise<PageEntry[]> {
  return [
    {
      title: 'Allison Peña',
      description: messages[locale].site.description,
      slug: 'index',
    },
    ...(await getProjectPages(locale)),
  ];
}
