import type { CollectionEntry } from 'astro:content';

type Post = CollectionEntry<'posts'>;

/**
 * Posts triés par date desc, drafts/links exclus.
 */
export function publishedPosts(all: Post[]): Post[] {
  return all
    .filter((p) => !p.data.draft && p.data.type !== 'link')
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/**
 * Renvoie le post plus récent et le post plus ancien que `current`,
 * selon l'ordre date desc.
 */
export function prevNext(
  current: Post,
  all: Post[],
): { newer: Post | null; older: Post | null } {
  const sorted = publishedPosts(all);
  const idx = sorted.findIndex((p) => p.slug === current.slug);
  if (idx === -1) return { newer: null, older: null };
  return {
    newer: idx > 0 ? sorted[idx - 1] : null,
    older: idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

/**
 * Score-based related posts. Match sur tags partagés (1 point) +
 * même project (2 points). Retourne les top N, jamais < 1 point.
 */
export function relatedPosts(current: Post, all: Post[], max = 3): Post[] {
  return publishedPosts(all)
    .filter((p) => p.slug !== current.slug)
    .map((p) => {
      const shared = p.data.tags.filter((t) => current.data.tags.includes(t)).length;
      const same = p.data.project && p.data.project === current.data.project ? 2 : 0;
      return { post: p, score: shared + same };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.post);
}
