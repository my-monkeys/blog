import { describe, expect, it } from 'vitest';
import { PROJECTS, getProject } from './projects.js';

describe('projects registry', () => {
  it('all entries have non-empty slug, name, url', () => {
    for (const p of PROJECTS) {
      expect(p.slug).toMatch(/^[a-z0-9-]+$/);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.url).toMatch(/^https:\/\//);
    }
  });

  it('slugs are unique', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('getProject returns undefined for unknown slug', () => {
    expect(getProject('nope-not-here')).toBeUndefined();
  });

  it('getProject returns the entry for a known slug', () => {
    const m = getProject('manabo');
    expect(m).toBeDefined();
    expect(m!.url).toBe('https://manabo.my-monkey.fr');
  });
});
