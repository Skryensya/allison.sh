import type { APIRoute } from 'astro';
import { SITE_URL } from '@/lib/seo';

export const GET: APIRoute = ({ site }) => {
  const origin = (site ?? new URL(SITE_URL)).toString().replace(/\/$/, '');
  const host = new URL(origin).host;
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    `Host: ${host}`,
    `Sitemap: ${origin}/sitemap.xml`,
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
