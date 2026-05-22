import { describe, expect, it } from 'vitest';
import { renderPost, shouldSkip } from './sync-releases.mjs';

const CFG = { skip_prerelease: true, skip_empty_body: true };

describe('shouldSkip', () => {
  it('skips prereleases when configured', () => {
    expect(shouldSkip({ prerelease: true, body: 'x' }, CFG)).toBe('prerelease');
  });
  it('skips drafts', () => {
    expect(shouldSkip({ draft: true, body: 'x' }, CFG)).toBe('draft');
  });
  it('skips empty body when configured', () => {
    expect(shouldSkip({ body: '' }, CFG)).toBe('empty body');
  });
  it('skips releases whose title contains [skip-blog]', () => {
    expect(shouldSkip({ body: 'real content here', name: 'Hotfix [skip-blog]' }, CFG)).toMatch(/skip-blog/);
  });
  it('skips releases whose tag contains [skip-blog]', () => {
    expect(shouldSkip({ body: 'real content', tag_name: 'v1.0.1[skip-blog]' }, CFG)).toMatch(/skip-blog/);
  });
  it('does not skip a normal release', () => {
    expect(shouldSkip({ body: 'real content here', tag_name: 'v1.0.0' }, CFG)).toBeNull();
  });
});

describe('renderPost', () => {
  const release = {
    tag_name: 'v1.2.3',
    name: 'Big release',
    published_at: '2026-05-19T14:30:00Z',
    body: 'Added foo. Fixed bar. Removed baz.',
    html_url: 'https://github.com/my-monkeys/manabo/releases/tag/v1.2.3',
    prerelease: false,
    draft: false,
  };

  it('produces a slugified filename with dashes', () => {
    const out = renderPost('manabo', release);
    expect(out.filename).toBe('manabo-v1-2-3.mdx');
  });

  it('produces YAML frontmatter with required fields', () => {
    const { content } = renderPost('manabo', release);
    expect(content).toMatch(/title: "Update manabo v1\.2\.3"/);
    expect(content).toMatch(/type: update/);
    expect(content).toMatch(/project: manabo/);
    expect(content).toMatch(/source_url: "https:\/\/github\.com\/my-monkeys\/manabo\/releases\/tag\/v1\.2\.3"/);
    expect(content).toMatch(/date: 2026-05-19/);
  });

  it('strips markdown from excerpt', () => {
    const r = { ...release, body: '## Title\n\nSome `code` and [a link](https://x.com).' };
    const { content } = renderPost('manabo', r);
    expect(content).toMatch(/excerpt: "Title Some code and a link\."/);
  });

  it('truncates long excerpts to ~200 chars', () => {
    const r = { ...release, body: 'word '.repeat(200) };
    const { content } = renderPost('manabo', r);
    const m = content.match(/excerpt: "([^"]+)"/);
    expect(m).toBeTruthy();
    expect(m[1].length).toBeLessThanOrEqual(200);
  });
});
