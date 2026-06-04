import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(_context: APIContext) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const items = posts.map((p) => ({
    url: p.data.type === 'link' && p.data.url ? p.data.url : `https://blog.my-monkey.fr/posts/${p.slug}/`,
    title: p.data.title,
    excerpt: p.data.excerpt ?? '',
    type: p.data.type,
    tags: p.data.tags,
    date: p.data.date.toISOString(),
  }));
  return new Response(JSON.stringify(items), { headers: { 'Content-Type': 'application/json' } });
}
