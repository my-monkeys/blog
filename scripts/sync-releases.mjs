#!/usr/bin/env node
// Pull recent GitHub releases for opt-in repos under the org and
// materialize them as type=update posts. Idempotent: never overwrites.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const POSTS_DIR = join(ROOT, 'src', 'content', 'posts');
const CONFIG_PATH = join(__dirname, 'sync-releases.config.json');

const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf8'));

function ghFetch(url) {
  const TOKEN = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  return fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

function sanitizeExcerpt(body) {
  if (!body) return '';
  const text = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#+\s*/g, '')
    .replace(/[*_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > 200 ? text.slice(0, 197).trimEnd() + '…' : text;
}

function tagToFileSlug(tag) {
  return tag.replace(/^v/, 'v').replace(/\./g, '-');
}

function escapeYaml(s) {
  return s.replace(/"/g, '\\"');
}

export function renderPost(repo, release) {
  const tagFile = tagToFileSlug(release.tag_name);
  const filename = `${repo}-${tagFile}.mdx`;
  const date = new Date(release.published_at).toISOString().slice(0, 10);
  const excerpt = sanitizeExcerpt(release.body);
  const title = `Update ${repo} ${release.tag_name}`;
  const content = `---
title: "${escapeYaml(title)}"
date: ${date}
type: update
project: ${repo}
tags: ["release"]
${excerpt ? `excerpt: "${escapeYaml(excerpt)}"` : ''}
source_url: "${release.html_url}"
draft: false
---

${release.body ?? ''}
`;
  return { filename, content };
}

export function shouldSkip(release, cfg) {
  if (cfg.skip_prerelease && release.prerelease) return 'prerelease';
  if (release.draft) return 'draft';
  if (cfg.skip_empty_body && (!release.body || release.body.trim().length < 10)) return 'empty body';
  if (release.name && /\[skip-blog\]/i.test(release.name)) return 'opt-out [skip-blog]';
  if (release.tag_name && /\[skip-blog\]/i.test(release.tag_name)) return 'opt-out [skip-blog]';
  return null;
}

async function syncRepo(repo) {
  const url = `https://api.github.com/repos/${config.org}/${repo}/releases?per_page=30`;
  const res = await ghFetch(url);
  if (!res.ok) {
    console.warn(`[${repo}] API error ${res.status}, skipping`);
    return 0;
  }
  const releases = await res.json();
  let created = 0;
  for (const r of releases) {
    const reason = shouldSkip(r, config);
    if (reason) {
      console.log(`[${repo}] skip ${r.tag_name}: ${reason}`);
      continue;
    }
    const { filename, content } = renderPost(repo, r);
    const target = join(POSTS_DIR, filename);
    if (existsSync(target)) {
      continue;
    }
    if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });
    writeFileSync(target, content, 'utf8');
    console.log(`[${repo}] created ${filename}`);
    created++;
  }
  return created;
}

async function main() {
  const TOKEN = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN;
  if (!TOKEN) {
    console.error('Missing GH_TOKEN / GITHUB_TOKEN env var');
    process.exit(1);
  }
  let total = 0;
  for (const repo of config.repos) {
    total += await syncRepo(repo);
  }
  console.log(`Done. ${total} new update post(s).`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
