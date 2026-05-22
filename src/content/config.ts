import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1).max(120),
        date: z.coerce.date(),
        type: z.enum(['article', 'update', 'post-mortem', 'link']),
        excerpt: z.string().max(280).optional(),
        tags: z.array(z.string()).default([]),
        project: z.string().optional(),
        cover: image().optional(),
        url: z.string().url().optional(),
        source_url: z.string().url().optional(),
        draft: z.boolean().default(false),
      })
      .refine((d) => d.type !== 'link' || !!d.url, {
        message: 'A post of type=link must have a url field',
        path: ['url'],
      }),
});

const now = defineCollection({
  type: 'content',
  schema: z.object({
    updated: z.coerce.date(),
  }),
});

export const collections = { posts, now };
