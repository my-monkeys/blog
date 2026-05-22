import { describe, expect, it } from 'vitest';
import { z } from 'zod';

const postShape = z
  .object({
    title: z.string().min(1).max(120),
    date: z.coerce.date(),
    type: z.enum(['article', 'update', 'post-mortem', 'link']),
    excerpt: z.string().max(280).optional(),
    tags: z.array(z.string()).default([]),
    project: z.string().optional(),
    url: z.string().url().optional(),
    source_url: z.string().url().optional(),
    draft: z.boolean().default(false),
  })
  .refine((d) => d.type !== 'link' || !!d.url, {
    message: 'A post of type=link must have a url field',
    path: ['url'],
  });

describe('post frontmatter shape', () => {
  it('accepts a valid article', () => {
    expect(() =>
      postShape.parse({
        title: 'Hello',
        date: '2026-05-19',
        type: 'article',
      }),
    ).not.toThrow();
  });

  it('rejects type=link without url', () => {
    expect(() =>
      postShape.parse({
        title: 'Lien',
        date: '2026-05-19',
        type: 'link',
      }),
    ).toThrow(/url/);
  });

  it('accepts type=link with url', () => {
    expect(() =>
      postShape.parse({
        title: 'Lien',
        date: '2026-05-19',
        type: 'link',
        url: 'https://example.com',
      }),
    ).not.toThrow();
  });

  it('rejects title > 120 chars', () => {
    expect(() =>
      postShape.parse({
        title: 'x'.repeat(121),
        date: '2026-05-19',
        type: 'article',
      }),
    ).toThrow();
  });

  it('defaults tags to empty array', () => {
    const parsed = postShape.parse({
      title: 'Hello',
      date: '2026-05-19',
      type: 'article',
    });
    expect(parsed.tags).toEqual([]);
  });
});
