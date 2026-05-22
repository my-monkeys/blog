import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return rss({
    title: 'Blog My-Monkey',
    description: "Carnet de bord d'une galaxie de projets perso.",
    site: context.site!.toString(),
    items: sorted.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt ?? '',
      link: post.data.type === 'link' ? post.data.url! : `/posts/${post.slug}`,
      categories: post.data.tags,
    })),
    customData: '<language>fr-fr</language>',
  });
}
